const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { runScan, getEngineConfig } = require('./engineRouter');

const CLONE_TIMEOUT_MS = parseInt(process.env.CLONE_TIMEOUT_MS, 10) || 25000;
const MAX_REPO_SIZE_MB = parseInt(process.env.MAX_REPO_SIZE_MB, 10) || 60;
const { execFile } = require('child_process');

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        if (error.killed || error.signal === 'SIGTERM') {
          return reject(new Error(`Command timed out after ${options.timeout}ms.`));
        }
        error.stderr = stderr;
        error.stdout = stdout;
        return reject(error);
      }
      resolve({ stdout, stderr });
    });
  });
}

function getDirectorySizeMB(dirPath) {
  let totalBytes = 0;
  function traverse(current) {
    if (!fs.existsSync(current)) return;
    const stats = fs.statSync(current);
    if (stats.isDirectory()) {
      for (const file of fs.readdirSync(current)) traverse(path.join(current, file));
    } else {
      totalBytes += stats.size;
    }
  }
  traverse(dirPath);
  return totalBytes / (1024 * 1024);
}

/**
 * Clones a repository shallowly, runs the configured scan engine, and
 * deletes the temp directory in a guaranteed try/finally block.
 *
 * @param {string} repoUrl    - Validated HTTPS clone URL
 * @param {string} repoName   - "owner/repo" string for response metadata
 * @returns {Promise<object>} Scan result payload
 */
async function scanRepository(repoUrl, repoName) {
  const scanId = crypto.randomBytes(8).toString('hex');
  const tempDir = path.join(os.tmpdir(), `secretless-scan-${scanId}`);
  const reportPath = path.join(os.tmpdir(), `secretless-report-${scanId}.json`);
  const startTime = Date.now();

  try {
    // 1. Shallow clone (depth 1, single branch)
    try {
      await runCommand(
        'git',
        ['clone', '--depth', '1', '--single-branch', repoUrl, tempDir],
        { timeout: CLONE_TIMEOUT_MS }
      );
    } catch (cloneErr) {
      const msg = cloneErr.message || '';
      if (msg.includes('timed out')) {
        throw new Error('Repository clone timed out. The repository might be too large or the network is slow.');
      }
      const stderr = cloneErr.stderr || '';
      if (stderr.includes('Repository not found') || stderr.includes('Authentication failed') || stderr.includes('not found')) {
        throw new Error('GitHub repository not found or is private. Only public repositories are supported.');
      }
      throw new Error(`Failed to clone repository: ${stderr || msg}`);
    }

    // 2. Size guard
    const repoSizeMB = getDirectorySizeMB(tempDir);
    if (repoSizeMB > MAX_REPO_SIZE_MB) {
      throw new Error(`Repository exceeds the maximum allowed size of ${MAX_REPO_SIZE_MB}MB (actual: ${repoSizeMB.toFixed(1)}MB).`);
    }

    // 3. Run the configured scan engine (Gitleaks / TruffleHog / builtin)
    const { findings, engineUsed } = await runScan(tempDir, reportPath);

    // 4. Compute summary
    const summary = {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'Critical').length,
      high: findings.filter(f => f.severity === 'High').length,
      medium: findings.filter(f => f.severity === 'Medium').length
    };

    const scanDurationMs = Date.now() - startTime;

    return {
      status: 'success',
      repo: repoName,
      scannedAt: new Date().toISOString(),
      scanDurationMs,
      engineUsed,
      engineConfig: getEngineConfig(),
      repoSizeMB: Number(repoSizeMB.toFixed(2)),
      summary,
      findings
    };

  } finally {
    // 5. Guaranteed cleanup — always runs regardless of success or error
    try { if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    try { if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath); } catch {}
  }
}

module.exports = { scanRepository };
