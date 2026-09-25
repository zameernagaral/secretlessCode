const fs = require('fs');
const path = require('path');
const { getRuleMetadata } = require('../ruleSeverity');

const IGNORE_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'vendor', '.turbo']);
const MAX_FILE_BYTES = 2 * 1024 * 1024; // Skip files > 2MB

const RULES = [
  { id: 'aws-access-token',          description: 'AWS Access Key ID',                regex: /\b(AKIA[0-9A-Z]{16})\b/g },
  { id: 'aws-secret-key',            description: 'AWS Secret Access Key',             regex: /(aws_secret(?:_access)?_key|secret_key)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi, matchIndex: 2 },
  { id: 'stripe-api-key',            description: 'Stripe Secret Key',                 regex: /\b(sk_live_[0-9a-zA-Z]{24,34})\b/g },
  { id: 'stripe-test-key',           description: 'Stripe Test Key',                   regex: /\b(sk_test_[0-9a-zA-Z]{24,34})\b/g },
  { id: 'github-pat',                description: 'GitHub Personal Access Token',       regex: /\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b/g },
  { id: 'github-oauth',              description: 'GitHub OAuth Token',                 regex: /\b(gho_[0-9a-zA-Z]{36})\b/g },
  { id: 'slack-bot-token',           description: 'Slack Bot Token',                   regex: /\b(xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24})\b/g },
  { id: 'slack-webhook-url',         description: 'Slack Incoming Webhook',             regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8,12}\/B[a-zA-Z0-9_]{8,12}\/[a-zA-Z0-9_]{24}/g },
  { id: 'openai-api-key',            description: 'OpenAI API Key',                    regex: /\b(sk-[a-zA-Z0-9]{20,48}|sk-proj-[a-zA-Z0-9_-]{48,120})\b/g },
  { id: 'anthropic-api-key',         description: 'Anthropic API Key',                 regex: /\b(sk-ant-[a-zA-Z0-9_-]{40,100})\b/g },
  { id: 'discord-bot-token',         description: 'Discord Bot Token',                 regex: /\b([A-Za-z0-9]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,38})\b/g },
  { id: 'database-connection-string', description: 'Database URI with Credentials',   regex: /(postgres(?:ql)?|mongodb(?:\+srv)?|mysql|redis):\/\/[a-zA-Z0-9_.-]+:[^@\s/:]{4,}@[a-zA-Z0-9_.-]+/gi },
  { id: 'private-key',               description: 'Asymmetric Private Key',            regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
  { id: 'sendgrid-api-key',          description: 'SendGrid API Key',                  regex: /\b(SG\.[a-zA-Z0-9_-]{22,66})\b/g },
  { id: 'twilio-api-key',            description: 'Twilio Auth Token',                 regex: /\b(SK[0-9a-f]{32})\b/g },
  { id: 'npm-access-token',          description: 'npm Access Token',                  regex: /\b(npm_[a-zA-Z0-9]{36})\b/g },
  { id: 'generic-api-key',           description: 'Hardcoded API Key / Secret',        regex: /(?:api_?key|apikey|api_?secret|access_?token)\s*[:=]\s*["']([a-zA-Z0-9_\-./+=]{16,80})["']/gi, matchIndex: 1 }
];

function scanFile(fullPath, targetDir, findings) {
  const stats = fs.statSync(fullPath);
  if (stats.size > MAX_FILE_BYTES) return;

  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch {
    return; // Skip binary / unreadable files
  }

  const lines = content.split('\n');
  const relativePath = path.relative(targetDir, fullPath);

  lines.forEach((line, lineIdx) => {
    RULES.forEach(rule => {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(line)) !== null) {
        const secretMatch = rule.matchIndex ? match[rule.matchIndex] : match[0];
        if (!secretMatch) continue;
        const { severity, secretType } = getRuleMetadata(rule.id, rule.description);
        findings.push({
          id: `bi-${findings.length + 1}`,
          filePath: relativePath,
          lineNumber: lineIdx + 1,
          endLine: lineIdx + 1,
          secretType,
          ruleId: rule.id,
          severity,
          rawMatch: secretMatch,
          engine: 'builtin'
        });
      }
    });
  });
}

function scanFolder(dir, targetDir, findings) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        scanFolder(path.join(dir, entry.name), targetDir, findings);
      }
    } else if (entry.isFile()) {
      scanFile(path.join(dir, entry.name), targetDir, findings);
    }
  }
}

/**
 * Built-in regex heuristic scanner — no binary required.
 * Used as the final fallback when neither Gitleaks nor TruffleHog is available.
 *
 * @param {string} targetDir
 * @returns {Array} Normalised findings
 */
function scan(targetDir) {
  const findings = [];
  scanFolder(targetDir, targetDir, findings);
  return findings;
}

// Built-in is always "available"
async function isAvailable() {
  return true;
}

module.exports = { isAvailable, scan };
