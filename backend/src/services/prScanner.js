const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { runScan, getEngineConfig } = require('./engineRouter');

const CLONE_TIMEOUT_MS = parseInt(process.env.CLONE_TIMEOUT_MS, 10) || 25000;
const MAX_REPO_SIZE_MB = parseInt(process.env.MAX_REPO_SIZE_MB, 10) || 60;

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
      const files = fs.readdirSync(current);
      for (const file of files) traverse(path.join(current, file));
    } else {
      totalBytes += stats.size;
    }
  }
  traverse(dirPath);
  return totalBytes / (1024 * 1024);
}


/**
 * Scans a specific PR branch of a GitHub repository.
 * Clones only the head branch at the given commit SHA (ephemeral, guaranteed cleanup).
 *
 * @param {string} repoUrl       - Full HTTPS clone URL (e.g. https://github.com/owner/repo.git)
 * @param {string} headRef       - Branch name (e.g. "feature/new-login")
 * @param {string} repoOwner
 * @param {string} repoName
 * @returns {Promise<{ findings: Array, summary: object, scanDurationMs: number }>}
 */
async function scanPRBranch(repoUrl, headRef, repoOwner, repoName) {
  const scanId = crypto.randomBytes(8).toString('hex');
  const tempDir = path.join(os.tmpdir(), `secretless-pr-${scanId}`);
  const reportPath = path.join(os.tmpdir(), `secretless-pr-report-${scanId}.json`);
  const startTime = Date.now();

  try {
    // Clone only the PR head branch (shallow, single-branch)
    try {
      await runCommand(
        'git',
        ['clone', '--depth', '1', '--single-branch', '--branch', headRef, repoUrl, tempDir],
        { timeout: CLONE_TIMEOUT_MS }
      );
    } catch (cloneErr) {
      if (cloneErr.message.includes('timed out')) {
        throw new Error('Repository clone timed out during PR scan.');
      }
      throw new Error(`Clone failed for PR branch "${headRef}": ${cloneErr.stderr || cloneErr.message}`);
    }

    // Size guard
    const sizeMB = getDirectorySizeMB(tempDir);
    if (sizeMB > MAX_REPO_SIZE_MB) {
      throw new Error(`PR branch exceeds size limit of ${MAX_REPO_SIZE_MB}MB (${sizeMB.toFixed(1)}MB).`);
    }

    // Run scan via engine router
    const { findings, engineUsed } = await runScan(tempDir, reportPath);

    const summary = {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'Critical').length,
      high: findings.filter(f => f.severity === 'High').length,
      medium: findings.filter(f => f.severity === 'Medium').length
    };

    const scanDurationMs = Date.now() - startTime;

    return {
      repo: `${repoOwner}/${repoName}`,
      scannedAt: new Date().toISOString(),
      scanDurationMs,
      engineUsed,
      engineConfig: getEngineConfig(),
      repoSizeMB: Number(sizeMB.toFixed(2)),
      summary,
      findings
    };

  } finally {
    // Guaranteed cleanup — always runs even on error
    try { if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    try { if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath); } catch {}
  }
}

module.exports = { scanPRBranch };
