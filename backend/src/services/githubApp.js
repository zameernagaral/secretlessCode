const { createAppAuth } = require('@octokit/auth-app');
const { Octokit } = require('@octokit/rest');

/**
 * Creates an authenticated Octokit instance for a specific GitHub App installation.
 * Uses short-lived installation tokens (they expire in 1h, GitHub auto-refreshes).
 *
 * Required env vars:
 *   GITHUB_APP_ID        - The numeric App ID shown in your GitHub App settings
 *   GITHUB_APP_PRIVATE_KEY - The full PEM private key (newlines as \n in .env)
 *
 * @param {number} installationId - The installation ID from the webhook payload
 * @returns {Promise<Octokit>}
 */
async function getInstallationOctokit(installationId) {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = (process.env.GITHUB_APP_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!appId || !privateKey) {
    throw new Error(
      'GitHub App credentials missing. Set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY in .env'
    );
  }

  const auth = createAppAuth({
    appId,
    privateKey,
    installationId
  });

  const { token } = await auth({ type: 'installation' });

  return new Octokit({ auth: token });
}

/**
 * Posts a Pull Request review with inline comments for each secret found.
 * Collapses findings into a single COMMENT review to avoid overwhelming the PR.
 *
 * @param {Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {number} pullNumber
 * @param {string} commitSha - HEAD commit SHA of the PR branch
 * @param {Array}  findings  - Formatted findings from scanner.js
 */
async function postPRReview(octokit, owner, repo, pullNumber, commitSha, findings) {
  if (findings.length === 0) {
    // Post a clean pass check comment
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: [
        '## 🛡️ Secretless Code — Secret Scan Results',
        '',
        '✅ **No leaked secrets detected in this pull request.**',
        '',
        'Gitleaks completed analysis and found no exposed API keys, tokens, or credentials.',
        '',
        '---',
        '*Automated scan by [Secretless Code](https://github.com/zameernagaral/secretlessCode)*'
      ].join('\n')
    });
    return;
  }

  // Build inline review comments for each finding (per file + line)
  const reviewComments = findings
    .filter(f => f.filePath && f.lineNumber) // must have location info
    .map(f => ({
      path: f.filePath,
      line: f.lineNumber,
      side: 'RIGHT',
      body: buildInlineCommentBody(f)
    }));

  // Severity summary counts
  const critical = findings.filter(f => f.severity === 'Critical').length;
  const high = findings.filter(f => f.severity === 'High').length;
  const medium = findings.filter(f => f.severity === 'Medium').length;

  const reviewBody = buildReviewSummary(findings, critical, high, medium);

  try {
    await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      commit_id: commitSha,
      event: critical > 0 || high > 0 ? 'REQUEST_CHANGES' : 'COMMENT',
      body: reviewBody,
      comments: reviewComments.slice(0, 10) // GitHub API allows max 10 inline comments per review
    });
  } catch (reviewErr) {
    // Fallback: if inline comments fail (e.g. file not in diff), post a plain comment
    console.warn('[GitHub PR] Inline review failed, falling back to issue comment:', reviewErr.message);
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: reviewBody
    });
  }
}

/**
 * Builds the summary body for the whole PR review.
 */
function buildReviewSummary(findings, critical, high, medium) {
  const statusEmoji = critical > 0 ? '🔴' : high > 0 ? '🟠' : '🟡';
  const verdict = critical > 0 || high > 0
    ? '⚠️ **Secretless Code has blocked this PR** — Critical or High severity secrets were detected.'
    : '⚠️ **Secretless Code flagged this PR** — Medium severity secrets were detected.';

  const rows = findings.map(f => {
    const badge = f.severity === 'Critical' ? '🔴 Critical' : f.severity === 'High' ? '🟠 High' : '🟡 Medium';
    return `| ${badge} | \`${f.filePath}:${f.lineNumber}\` | ${f.secretType} | \`${maskForComment(f.rawMatch)}\` |`;
  });

  return [
    `## ${statusEmoji} Secretless Code — Secret Scan Results`,
    '',
    verdict,
    '',
    `**Summary**: ${findings.length} secret(s) found — 🔴 ${critical} Critical · 🟠 ${high} High · 🟡 ${medium} Medium`,
    '',
    '| Severity | Location | Secret Type | Masked Value |',
    '|----------|----------|-------------|--------------|',
    ...rows,
    '',
    '### 🔧 Required Action',
    '1. **Immediately revoke** any exposed credentials from your cloud/service provider.',
    '2. **Remove the secret** from the code (use environment variables instead).',
    '3. **Rewrite git history** using `git filter-repo` to purge the secret from all past commits.',
    '4. Re-push your branch after removing the secrets to clear this review.',
    '',
    '---',
    '*Automated scan powered by [Secretless Code](https://github.com/zameernagaral/secretlessCode) · [Gitleaks](https://github.com/gitleaks/gitleaks)*'
  ].join('\n');
}

/**
 * Builds a concise inline comment for a single finding.
 */
function buildInlineCommentBody(finding) {
  const badge = finding.severity === 'Critical' ? '🔴 **CRITICAL**' : finding.severity === 'High' ? '🟠 **HIGH**' : '🟡 **MEDIUM**';

  return [
    `### ${badge} Secret Detected: ${finding.secretType}`,
    '',
    `**Rule ID**: \`${finding.ruleId}\``,
    `**Masked Value**: \`${maskForComment(finding.rawMatch)}\``,
    '',
    '> ⚠️ **This credential must be revoked and removed immediately.**',
    '> Never store secrets in source code. Use environment variables or a secrets manager (e.g. HashiCorp Vault, AWS Secrets Manager).',
  ].join('\n');
}

/**
 * Masks a secret string for safe display inside GitHub PR comments.
 */
function maskForComment(secret) {
  if (!secret) return '••••••••';
  const s = secret.trim();
  if (s.length <= 8) return '••••••••';
  return s.slice(0, Math.min(6, Math.floor(s.length * 0.25))) + '••••••••';
}

module.exports = { getInstallationOctokit, postPRReview };
