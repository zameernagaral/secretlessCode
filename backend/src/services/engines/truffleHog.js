const { execFile } = require('child_process');
const { getRuleMetadata } = require('../ruleSeverity');

const TRUFFLEHOG_PATH = process.env.TRUFFLEHOG_PATH || 'trufflehog';
const SCAN_TIMEOUT_MS = parseInt(process.env.SCAN_TIMEOUT_MS, 10) || 25000;

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        if (error.killed || error.signal === 'SIGTERM') {
          return reject(new Error(`TruffleHog timed out after ${options.timeout}ms.`));
        }
        error.stderr = stderr;
        error.stdout = stdout;
        return reject(error);
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Detects whether trufflehog is available on PATH.
 * @returns {Promise<boolean>}
 */
async function isAvailable() {
  try {
    await runCommand(TRUFFLEHOG_PATH, ['--version'], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Maps TruffleHog detector names to our severity model.
 * TruffleHog's DetectorName is used as a fallback ruleId.
 */
function mapTruffleHogDetector(detectorName = '', verified = false) {
  const name = detectorName.toLowerCase();

  // Verified findings (TruffleHog actually tested the credential) are always Critical
  if (verified) {
    return {
      ruleId: name || 'trufflehog-verified',
      severity: 'Critical',
      secretType: `${detectorName} (Verified Active Credential)`
    };
  }

  // Unverified — map by known detector name patterns
  const criticalDetectors = [
    'aws', 'gcp', 'azure', 'github', 'privatekey', 'rsa', 'openssh',
    'mysql', 'postgres', 'mongodb', 'stripe', 'paypal'
  ];
  const highDetectors = [
    'slack', 'discord', 'openai', 'anthropic', 'sendgrid', 'twilio',
    'jwt', 'npmtoken', 'heroku', 'pypi'
  ];

  if (criticalDetectors.some(d => name.includes(d))) {
    return { ruleId: name, severity: 'Critical', secretType: detectorName };
  }
  if (highDetectors.some(d => name.includes(d))) {
    return { ruleId: name, severity: 'High', secretType: detectorName };
  }
  return { ruleId: name || 'trufflehog-generic', severity: 'Medium', secretType: detectorName || 'Generic Secret' };
}

/**
 * Runs TruffleHog v3 against a directory using the filesystem source.
 * TruffleHog outputs NDJSON (one JSON object per line on stdout).
 *
 * @param {string} targetDir - Absolute path to the cloned repository
 * @returns {Promise<Array>} Normalised findings array
 */
async function scan(targetDir) {
  let stdout = '';

  try {
    const result = await runCommand(
      TRUFFLEHOG_PATH,
      [
        'filesystem',
        '--directory', targetDir,
        '--json',          // NDJSON output to stdout
        '--no-update',     // Skip version checks (faster + no network call)
        '--concurrency', '4'
      ],
      { timeout: SCAN_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 } // 10MB stdout buffer
    );
    stdout = result.stdout;
  } catch (err) {
    // TruffleHog exits 183 when secrets are found — read stdout anyway
    if (err.stdout) {
      stdout = err.stdout;
    } else {
      throw err;
    }
  }

  if (!stdout || !stdout.trim()) return [];

  // Parse NDJSON — each line is one finding object
  const findings = [];
  const lines = stdout.trim().split('\n');

  lines.forEach((line, idx) => {
    try {
      const f = JSON.parse(line);

      // Extract location from nested SourceMetadata structure
      const fsData = f.SourceMetadata?.Data?.Filesystem
        || f.SourceMetadata?.Data?.Git
        || {};

      const filePath = fsData.file || fsData.File || 'unknown';
      const lineNumber = parseInt(fsData.line || fsData.Line || 1, 10);
      const detectorName = f.DetectorName || f.detectorName || '';
      const verified = f.Verified === true || f.verified === true;
      const rawMatch = f.Raw || f.raw || f.RawV2 || f.rawV2 || '';

      const { ruleId, severity, secretType } = mapTruffleHogDetector(detectorName, verified);

      findings.push({
        id: `th-${idx + 1}`,
        filePath,
        lineNumber,
        endLine: lineNumber,
        secretType,
        ruleId,
        severity,
        rawMatch,
        verified,           // expose TruffleHog's verification result
        engine: 'trufflehog'
      });
    } catch {
      // Skip malformed NDJSON lines
    }
  });

  return findings;
}

module.exports = { isAvailable, scan };
