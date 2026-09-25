const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile, spawn } = require('child_process');
const { getRuleMetadata } = require('./ruleSeverity');

// Max limits to protect server resources
const CLONE_TIMEOUT_MS = parseInt(process.env.CLONE_TIMEOUT_MS, 10) || 25000;
const SCAN_TIMEOUT_MS = parseInt(process.env.SCAN_TIMEOUT_MS, 10) || 25000;
const MAX_REPO_SIZE_MB = parseInt(process.env.MAX_REPO_SIZE_MB, 10) || 60; // 60MB max
const GITLEAKS_PATH = process.env.GITLEAKS_PATH || 'gitleaks';

/**
 * Calculates total size of a directory in Megabytes.
 * @param {string} dirPath 
 * @returns {number} size in MB
 */
function getDirectorySizeMB(dirPath) {
  let totalBytes = 0;
  function traverse(current) {
    if (!fs.existsSync(current)) return;
    const stats = fs.statSync(current);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(current);
      for (const file of files) {
        traverse(path.join(current, file));
      }
    } else {
      totalBytes += stats.size;
    }
  }
  traverse(dirPath);
  return totalBytes / (1024 * 1024);
}

/**
 * Executes a command with timeout as a promise.
 * Avoids shell injection by using execFile with argument arrays.
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        if (error.killed || error.signal === 'SIGTERM') {
          return reject(new Error(`Command timed out after ${options.timeout || 'configured'}ms.`));
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
 * Fallback static secret scanner for environments where the Gitleaks binary
 * is not yet installed on PATH. Uses standard Gitleaks detection signatures.
 */
function runBuiltinScanner(targetDir) {
  const findings = [];
  const rules = [
    {
      id: 'aws-access-token',
      description: 'AWS Access Key ID',
      regex: /\b(AKIA[0-9A-Z]{16})\b/g
    },
    {
      id: 'aws-secret-key',
      description: 'AWS Secret Access Key',
      regex: /(aws_secret_access_key|aws_secret_key|secret_key)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi,
      matchIndex: 2
    },
    {
      id: 'stripe-api-key',
      description: 'Stripe Secret Key',
      regex: /\b(sk_live_[0-9a-zA-Z]{24,34})\b/g
    },
    {
      id: 'github-pat',
      description: 'GitHub Personal Access Token',
      regex: /\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b/g
    },
    {
      id: 'slack-bot-token',
      description: 'Slack Bot Token',
      regex: /\b(xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24})\b/g
    },
    {
      id: 'slack-webhook-url',
      description: 'Slack Incoming Webhook',
      regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8,12}\/B[a-zA-Z0-9_]{8,12}\/[a-zA-Z0-9_]{24}/g
    },
    {
      id: 'openai-api-key',
      description: 'OpenAI API Key',
      regex: /\b(sk-[a-zA-Z0-9]{20,48}|sk-proj-[a-zA-Z0-9_-]{48,120})\b/g
    },
    {
      id: 'database-connection-string',
      description: 'Database URI with Password',
      regex: /\b(postgres(?:ql)?|mongodb(?:\+srv)?|mysql):\/\/[a-zA-Z0-9_.-]+:([^@\s/:]+)@[a-zA-Z0-9_.-]+(?::[0-9]+)?\/[a-zA-Z0-9_.-]*/gi
    },
    {
      id: 'private-key',
      description: 'Asymmetric Private Key',
      regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g
    }
  ];

  const ignoreDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'vendor']);

  function scanFolder(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) {
          scanFolder(path.join(dir, entry.name));
        }
      } else if (entry.isFile()) {
        const fullPath = path.join(dir, entry.name);
        // Skip huge binary or media files
        const stats = fs.statSync(fullPath);
        if (stats.size > 2 * 1024 * 1024) continue; // Skip files > 2MB

        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');

          lines.forEach((line, lineIdx) => {
            const lineNum = lineIdx + 1;
            rules.forEach(rule => {
              // Reset regex state
              rule.regex.lastIndex = 0;
              let match;
              while ((match = rule.regex.exec(line)) !== null) {
                const secretMatch = rule.matchIndex ? match[rule.matchIndex] : match[0];
                const relativePath = path.relative(targetDir, fullPath);

                findings.push({
                  RuleID: rule.id,
                  Description: rule.description,
                  File: relativePath,
                  StartLine: lineNum,
                  EndLine: lineNum,
                  Secret: secretMatch || match[0],
                  Match: line.trim()
                });
              }
            });
          });
        } catch {
          // Skip binary/unreadable files
        }
      }
    }
  }

  scanFolder(targetDir);
  return findings;
}

/**
 * Clones a repository shallowly, executes Gitleaks scan, and cleans up the temp dir reliably.
 * @param {string} repoUrl Validated GitHub repository URL
 * @returns {Promise<{ findings: Array, summary: Object, repo: string, scanDurationMs: number }>}
 */
async function scanRepository(repoUrl, repoName) {
  const scanId = crypto.randomBytes(8).toString('hex');
  const tempDir = path.join(os.tmpdir(), `secretless-scan-${scanId}`);
  const reportPath = path.join(os.tmpdir(), `secretless-report-${scanId}.json`);

  const startTime = Date.now();

  try {
    // 1. Shallow clone repository with strict timeout
    try {
      await runCommand(
        'git',
        ['clone', '--depth', '1', '--single-branch', repoUrl, tempDir],
        { timeout: CLONE_TIMEOUT_MS }
      );
    } catch (cloneErr) {
      const msg = cloneErr.message || '';
      if (msg.includes('timed out')) {
        throw new Error('Repository clone timed out. The repository might be too large or slow to respond.');
      }
      if (cloneErr.stderr && (cloneErr.stderr.includes('Repository not found') || cloneErr.stderr.includes('Authentication failed'))) {
        throw new Error('GitHub repository not found or is private. Only public repositories are supported.');
      }
      throw new Error(`Failed to clone repository: ${cloneErr.stderr || cloneErr.message}`);
    }

    // 2. Check cloned repository size
    const repoSizeMB = getDirectorySizeMB(tempDir);
    if (repoSizeMB > MAX_REPO_SIZE_MB) {
      throw new Error(`Repository exceeds the maximum allowed size limit of ${MAX_REPO_SIZE_MB}MB (actual: ${repoSizeMB.toFixed(1)}MB).`);
    }

    // 3. Run Gitleaks scanner as subprocess
    let rawFindings = [];
    let scannerEngine = 'gitleaks-cli';

    try {
      // Execute gitleaks with report output
      await runCommand(
        GITLEAKS_PATH,
        [
          'detect',
          `--source=${tempDir}`,
          `--report-path=${reportPath}`,
          '--report-format=json',
          '--no-git',
          '--exit-code=0'
        ],
        { timeout: SCAN_TIMEOUT_MS }
      );

      // Read report if generated
      if (fs.existsSync(reportPath)) {
        const fileContent = fs.readFileSync(reportPath, 'utf8');
        if (fileContent.trim()) {
          rawFindings = JSON.parse(fileContent);
        }
      }
    } catch (gitleaksErr) {
      // If gitleaks binary is not installed or returned an error, fallback gracefully
      if (gitleaksErr.code === 'ENOENT' || (gitleaksErr.message && gitleaksErr.message.includes('ENOENT'))) {
        scannerEngine = 'builtin-heuristic';
        rawFindings = runBuiltinScanner(tempDir);
      } else if (gitleaksErr.message && gitleaksErr.message.includes('timed out')) {
        throw new Error('Secret scanner timed out while analyzing the codebase.');
      } else {
        // Gitleaks might return exit code 1 if leaks were found depending on version flags
        if (fs.existsSync(reportPath)) {
          try {
            const content = fs.readFileSync(reportPath, 'utf8');
            if (content.trim()) {
              rawFindings = JSON.parse(content);
            }
          } catch {
            // Fallback to built-in scanner
            scannerEngine = 'builtin-heuristic';
            rawFindings = runBuiltinScanner(tempDir);
          }
        } else {
          scannerEngine = 'builtin-heuristic';
          rawFindings = runBuiltinScanner(tempDir);
        }
      }
    }

    // 4. Transform raw findings into clean, standardized API response
    const formattedFindings = rawFindings.map((finding, index) => {
      const ruleId = finding.RuleID || finding.ruleId || 'generic-secret';
      const description = finding.Description || finding.description || ruleId;
      const { severity, secretType } = getRuleMetadata(ruleId, description);

      return {
        id: `finding-${index + 1}`,
        filePath: finding.File || finding.file || 'unknown',
        lineNumber: finding.StartLine || finding.startLine || 1,
        endLine: finding.EndLine || finding.endLine || finding.StartLine || 1,
        secretType,
        ruleId,
        severity, // 'Critical' | 'High' | 'Medium'
        rawMatch: finding.Secret || finding.Match || finding.secret || ''
      };
    });

    // Compute summary counts
    const summary = {
      critical: formattedFindings.filter(f => f.severity === 'Critical').length,
      high: formattedFindings.filter(f => f.severity === 'High').length,
      medium: formattedFindings.filter(f => f.severity === 'Medium').length,
      total: formattedFindings.length
    };

    const scanDurationMs = Date.now() - startTime;

    return {
      status: 'success',
      repo: repoName,
      scannedAt: new Date().toISOString(),
      scanDurationMs,
      scannerEngine,
      repoSizeMB: Number(repoSizeMB.toFixed(2)),
      summary,
      findings: formattedFindings
    };

  } finally {
    // 5. CRITICAL: Guaranteed cleanup of isolated temp clone directory and reports
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.error(`Warning: Failed to clean tempDir ${tempDir}:`, cleanupErr.message);
    }

    try {
      if (fs.existsSync(reportPath)) {
        fs.unlinkSync(reportPath);
      }
    } catch {
      // Ignore report unlink error
    }
  }
}

module.exports = {
  scanRepository
};
