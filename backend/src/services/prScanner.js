const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { getRuleMetadata } = require('./ruleSeverity');

const CLONE_TIMEOUT_MS = parseInt(process.env.CLONE_TIMEOUT_MS, 10) || 25000;
const SCAN_TIMEOUT_MS = parseInt(process.env.SCAN_TIMEOUT_MS, 10) || 25000;
const MAX_REPO_SIZE_MB = parseInt(process.env.MAX_REPO_SIZE_MB, 10) || 60;
const GITLEAKS_PATH = process.env.GITLEAKS_PATH || 'gitleaks';

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
 * Lightweight heuristic scanner fallback (same as main scanner.js).
 * Kept separate here so prScanner.js is self-contained.
 */
function runBuiltinScanner(targetDir) {
  const findings = [];
  const rules = [
    { id: 'aws-access-token', description: 'AWS Access Key ID', regex: /\b(AKIA[0-9A-Z]{16})\b/g },
    { id: 'stripe-api-key', description: 'Stripe Secret Key', regex: /\b(sk_live_[0-9a-zA-Z]{24,34})\b/g },
    { id: 'github-pat', description: 'GitHub Personal Access Token', regex: /\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b/g },
    { id: 'slack-bot-token', description: 'Slack Bot Token', regex: /\b(xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24})\b/g },
    { id: 'openai-api-key', description: 'OpenAI API Key', regex: /\b(sk-[a-zA-Z0-9]{20,48}|sk-proj-[a-zA-Z0-9_-]{48,120})\b/g },
    { id: 'database-connection-string', description: 'Database URI', regex: /\b(postgres(?:ql)?|mongodb(?:\+srv)?|mysql):\/\/[a-zA-Z0-9_.-]+:([^@\s/:]+)@/gi },
    { id: 'private-key', description: 'Asymmetric Private Key', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g }
  ];

  const ignoreDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'vendor']);

  function scanFolder(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) scanFolder(path.join(dir, entry.name));
      } else {
        const fullPath = path.join(dir, entry.name);
        if (fs.statSync(fullPath).size > 2 * 1024 * 1024) continue;
        try {
          const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
          lines.forEach((line, idx) => {
            rules.forEach(rule => {
              rule.regex.lastIndex = 0;
              let match;
              while ((match = rule.regex.exec(line)) !== null) {
                findings.push({
                  RuleID: rule.id,
                  Description: rule.description,
                  File: path.relative(targetDir, fullPath),
                  StartLine: idx + 1,
                  Secret: match[0],
                  Match: line.trim()
                });
              }
            });
          });
        } catch { /* skip binary files */ }
      }
    }
  }

  scanFolder(targetDir);
  return findings;
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

    // Run Gitleaks scanner
    let rawFindings = [];
    let engine = 'gitleaks-cli';

    try {
      await runCommand(
        GITLEAKS_PATH,
        ['detect', `--source=${tempDir}`, `--report-path=${reportPath}`, '--report-format=json', '--no-git', '--exit-code=0'],
        { timeout: SCAN_TIMEOUT_MS }
      );

      if (fs.existsSync(reportPath)) {
        const content = fs.readFileSync(reportPath, 'utf8');
        if (content.trim()) rawFindings = JSON.parse(content);
      }
    } catch (gitleaksErr) {
      if (gitleaksErr.code === 'ENOENT' || (gitleaksErr.message && gitleaksErr.message.includes('ENOENT'))) {
        engine = 'builtin-heuristic';
        rawFindings = runBuiltinScanner(tempDir);
      } else {
        // Try to read any partial output
        if (fs.existsSync(reportPath)) {
          try {
            const content = fs.readFileSync(reportPath, 'utf8');
            if (content.trim()) rawFindings = JSON.parse(content);
          } catch {
            engine = 'builtin-heuristic';
            rawFindings = runBuiltinScanner(tempDir);
          }
        } else {
          engine = 'builtin-heuristic';
          rawFindings = runBuiltinScanner(tempDir);
        }
      }
    }

    // Format findings
    const findings = rawFindings.map((f, i) => {
      const ruleId = f.RuleID || f.ruleId || 'generic-secret';
      const description = f.Description || f.description || ruleId;
      const { severity, secretType } = getRuleMetadata(ruleId, description);
      return {
        id: `pr-finding-${i + 1}`,
        filePath: f.File || f.file || 'unknown',
        lineNumber: f.StartLine || f.startLine || 1,
        secretType,
        ruleId,
        severity,
        rawMatch: f.Secret || f.Match || f.secret || ''
      };
    });

    const summary = {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'Critical').length,
      high: findings.filter(f => f.severity === 'High').length,
      medium: findings.filter(f => f.severity === 'Medium').length
    };

    return {
      findings,
      summary,
      engine,
      scanDurationMs: Date.now() - startTime
    };

  } finally {
    // Guaranteed cleanup — always runs even on error
    try { if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    try { if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath); } catch {}
  }
}

module.exports = { scanPRBranch };
