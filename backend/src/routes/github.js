const express = require('express');
const { verifyWebhookSignature } = require('../utils/webhookVerify');
const { getInstallationOctokit, postPRReview } = require('../services/githubApp');
const { scanPRBranch } = require('../services/prScanner');
const { sendScanNotification } = require('../services/notifier');
const { saveReport } = require('../services/storage/storageRouter');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /webhooks/github
 *
 * Receives GitHub App webhook events.
 * Currently handles:
 *   - pull_request (opened, synchronize, reopened) → scan PR branch → post review
 *
 * GitHub sends the raw body as JSON with Content-Type: application/json.
 * We need the raw body bytes for HMAC-SHA256 signature verification BEFORE JSON parsing.
 * This route uses express.raw() as a middleware (set in server.js) so we receive a Buffer.
 */
router.post(
  '/webhooks/github',
  express.raw({ type: 'application/json' }), // MUST be raw for HMAC verification
  async (req, res) => {
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    const signature = req.headers['x-hub-signature-256'];
    const eventType = req.headers['x-github-event'];

    // 1. Immediately acknowledge GitHub to prevent 10s timeout re-deliveries
    res.status(202).json({ success: true, data: { status: 'received' } });

    // 2. Verify webhook signature (reject tampered / unauthenticated requests)
    if (webhookSecret) {
      const rawBody = req.body;
      if (!verifyWebhookSignature(webhookSecret, rawBody, signature)) {
        logger.warn('[Webhook] Invalid signature — ignoring event.');
        return;
      }
    } else {
      logger.warn('[Webhook] GITHUB_WEBHOOK_SECRET not set — signature verification skipped.');
    }

    // 3. Parse body
    let payload;
    try {
      payload = JSON.parse(req.body.toString('utf8'));
    } catch {
      logger.warn('[Webhook] Failed to parse webhook payload.');
      return;
    }

    // 4. Only handle pull_request events
    if (eventType !== 'pull_request') {
      logger.info('[Webhook] Ignoring non-PR event', { eventType });
      return;
    }

    // 5. Only scan on open / sync (new commits pushed) / reopen
    const action = payload.action;
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
      logger.info('[Webhook] Ignoring PR action', { action });
      return;
    }

    const pr = payload.pull_request;
    const repo = payload.repository;
    const installationId = payload.installation?.id;

    if (!pr || !repo || !installationId) {
      logger.warn('[Webhook] Payload missing required fields.');
      return;
    }

    const owner = repo.owner.login;
    const repoName = repo.name;
    const prNumber = pr.number;
    const headRef = pr.head.ref;       // branch name
    const headSha = pr.head.sha;       // HEAD commit SHA for review
    const cloneUrl = repo.clone_url;   // public HTTPS clone URL

    logger.info('[PR Scanner] Starting scan', { repo: `${owner}/${repoName}`, pr: prNumber, ref: headRef, sha: headSha.slice(0, 7) });

    // 6. Run the full scan pipeline (async — already sent 202)
    try {
      // Get authenticated Octokit using installation token
      const octokit = await getInstallationOctokit(installationId);

      // Post an in-progress check status on the PR (pending indicator)
      await setCommitStatus(octokit, owner, repoName, headSha, 'pending', 'Secretless Code is scanning for secrets...');

      // Scan PR branch (now returns the full scan result object)
      const scanResult = await scanPRBranch(
        cloneUrl,
        headRef,
        owner,
        repoName
      );

      const { findings, summary, engineUsed, scanDurationMs } = scanResult;

      // Save masked report to cloud storage (fire-and-forget)
      const storagePromise = saveReport(scanResult).catch(() => ({ stored: false }));

      // Await storage just long enough to see if we get a URL for the PR comment
      const storageResult = await Promise.race([
        storagePromise,
        new Promise(resolve => setTimeout(() => resolve({ stored: false }), 5000))
      ]);

      // If we got a presigned URL or public URL, we could inject it into the review body
      // but for now postPRReview just takes findings. 
      // (Optional future enhancement: pass storageResult.presignedUrl to postPRReview to add a "Download full report" link)

      // Post findings review to GitHub PR
      await postPRReview(octokit, owner, repoName, prNumber, headSha, findings);

      // Update commit status to pass/fail
      const hasBlockingIssues = summary.critical > 0 || summary.high > 0;

      await setCommitStatus(
        octokit,
        owner,
        repoName,
        headSha,
        hasBlockingIssues ? 'failure' : 'success',
        hasBlockingIssues
          ? `🔴 ${summary.total} secret(s) found — Critical: ${summary.critical}, High: ${summary.high}`
          : summary.medium > 0
          ? `🟡 ${summary.medium} medium severity finding(s) detected`
          : '✅ No secrets detected',
        'secretless-code/scan'
      );

      // Fire-and-forget Slack/Discord notification
      sendScanNotification({
        repo: `${owner}/${repoName}`,
        source: `GitHub PR #${prNumber} (\`${headRef}\`)`,
        summary,
        findings,
        scanDurationMs
      }).catch(() => {});

      logger.info('[PR Scanner] Done', { repo: `${owner}/${repoName}`, pr: prNumber, findings: summary.total, ms: scanDurationMs, engine: engineUsed });

    } catch (err) {
      logger.error('[PR Scanner] Scan failed', { pr: prNumber, error: err.message });

      // Try to post error status to commit
      try {
        const octokit = await getInstallationOctokit(installationId);
        await setCommitStatus(
          octokit, owner, repoName, headSha,
          'error',
          `Secretless Code scan error: ${err.message.slice(0, 130)}`,
          'secretless-code/scan'
        );
      } catch {
        // Don't let secondary errors crash anything
      }
    }
  }
);

/**
 * Posts a commit status check on GitHub (shows as a check in the PR merge box).
 * @param {'pending'|'success'|'failure'|'error'} state
 */
async function setCommitStatus(octokit, owner, repo, sha, state, description, context = 'secretless-code/scan') {
  try {
    await octokit.rest.repos.createCommitStatus({
      owner,
      repo,
      sha,
      state,
      description: description.slice(0, 140),
      context
    });
  } catch (err) {
    logger.warn('[Commit Status] Could not set commit status', { error: err.message });
  }
}

module.exports = router;
