const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getRuleMetadata } = require('../ruleSeverity');

const GITLEAKS_PATH = process.env.GITLEAKS_PATH || 'gitleaks';
const SCAN_TIMEOUT_MS = parseInt(process.env.SCAN_TIMEOUT_MS, 10) || 25000;

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        if (error.killed || error.signal === 'SIGTERM') {
          return reject(new Error(`Gitleaks timed out after ${options.timeout}ms.`));
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
 * Detects whether gitleaks is available on PATH.
 * @returns {Promise<boolean>}
 */
async function isAvailable() {
  try {
    await runCommand(GITLEAKS_PATH, ['version'], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs Gitleaks against a cloned directory and returns normalised findings.
 * @param {string} targetDir - Absolute path to the cloned repository
 * @param {string} reportPath - Temp path for the JSON report file
 * @returns {Promise<Array>} Normalised findings array
 */
async function scan(targetDir, reportPath) {
  // Run gitleaks with JSON report output, --no-git so it scans plain filesystem
  // (the directory is already a shallow clone — git history is minimal)
  try {
    await runCommand(
      GITLEAKS_PATH,
      [
        'detect',
        `--source=${targetDir}`,
        `--report-path=${reportPath}`,
        '--report-format=json',
        '--no-git',
        '--exit-code=0',   // exit 0 even when leaks found (exit 1 is the default on findings)
        '--redact'         // mask secrets in stdout/stderr logs
      ],
      { timeout: SCAN_TIMEOUT_MS }
    );
  } catch (err) {
    // Exit code 1 = gitleaks found leaks — still try to read the report
    if (err.code !== 1) {
      // Real error (binary not found, timeout, etc.)
      throw err;
    }
  }

  // Read and parse the JSON report
  if (!fs.existsSync(reportPath)) return [];

  const content = fs.readFileSync(reportPath, 'utf8').trim();
  if (!content) return [];

  const raw = JSON.parse(content);
  if (!Array.isArray(raw)) return [];

  return raw.map((f, i) => {
    const ruleId = f.RuleID || f.ruleId || 'generic-secret';
    const description = f.Description || f.description || ruleId;
    const { severity, secretType } = getRuleMetadata(ruleId, description);

    return {
      id: `gl-${i + 1}`,
      filePath: f.File || f.file || 'unknown',
      lineNumber: f.StartLine || f.startLine || 1,
      endLine: f.EndLine || f.endLine || f.StartLine || 1,
      secretType,
      ruleId,
      severity,
      rawMatch: f.Secret || f.Match || f.secret || '',
      engine: 'gitleaks'
    };
  });
}

module.exports = { isAvailable, scan };
