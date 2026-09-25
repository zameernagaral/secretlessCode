const express = require('express');
const { verifyWebhookSignature } = require('../utils/webhookVerify');
const { getInstallationOctokit, postPRReview } = require('../services/githubApp');
const { scanPRBranch } = require('../services/prScanner');
const { sendScanNotification } = require('../services/notifier');
const { saveReport } = require('../services/storage/storageRouter');

const router = express.Router();

/**
 * POST /api/github/webhook
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
  '/github/webhook',
  express.raw({ type: 'application/json' }), // MUST be raw for HMAC verification
  async (req, res) => {
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    const signature = req.headers['x-hub-signature-256'];
    const eventType = req.headers['x-github-event'];

    // 1. Immediately acknowledge GitHub to prevent 10s timeout re-deliveries
    res.status(202).json({ status: 'received' });

    // 2. Verify webhook signature (reject tampered / unauthenticated requests)
    if (webhookSecret) {
      const rawBody = req.body; // Buffer from express.raw()
      if (!verifyWebhookSignature(webhookSecret, rawBody, signature)) {
        console.warn('[Webhook] Invalid signature — ignoring event.');
        return;
      }
    } else {
      console.warn('[Webhook] GITHUB_WEBHOOK_SECRET not set — signature verification skipped. Set it in production!');
    }

    // 3. Parse body
    let payload;
    try {
      payload = JSON.parse(req.body.toString('utf8'));
    } catch {
      console.error('[Webhook] Failed to parse webhook payload JSON.');
      return;
    }

    // 4. Only handle pull_request events
    if (eventType !== 'pull_request') {
      console.log(`[Webhook] Ignoring non-PR event: ${eventType}`);
      return;
    }

    // 5. Only scan on open / sync (new commits pushed) / reopen
    const action = payload.action;
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
      console.log(`[Webhook] Ignoring PR action: ${action}`);
      return;
    }

    const pr = payload.pull_request;
    const repo = payload.repository;
    const installationId = payload.installation?.id;

    if (!pr || !repo || !installationId) {
      console.error('[Webhook] Payload missing required fields (pull_request / repository / installation).');
      return;
    }

    const owner = repo.owner.login;
    const repoName = repo.name;
    const prNumber = pr.number;
    const headRef = pr.head.ref;       // branch name
    const headSha = pr.head.sha;       // HEAD commit SHA for review
    const cloneUrl = repo.clone_url;   // public HTTPS clone URL

    console.log(`[PR Scanner] Starting scan: ${owner}/${repoName} PR #${prNumber} (${headRef}) — commit ${headSha.slice(0, 7)}`);

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

      console.log(
        `[PR Scanner] ✅ Done: ${owner}/${repoName} PR #${prNumber} — ${summary.total} findings in ${scanDurationMs}ms via ${engineUsed}`
      );

    } catch (err) {
      console.error(`[PR Scanner] ❌ Error scanning PR #${prNumber}:`, err.message);

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
    // Non-fatal — some repos may not allow status checks from the app
    console.warn(`[Commit Status] Could not set status: ${err.message}`);
  }
}

module.exports = router;
