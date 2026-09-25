const express = require('express');
const { validateGitHubUrl } = require('../utils/validator');
const { scanRepository } = require('../services/scanner');
const { sendScanNotification } = require('../services/notifier');
const { saveReport, getProviderName } = require('../services/storage/storageRouter');
const { validateBody, SCAN_SCHEMA } = require('../middlewares/validateSchema');

const router = express.Router();

/**
 * POST /api/scan
 * Body: { repoUrl: "https://github.com/owner/repo" }
 *
 * Middleware stack:
 *   1. validateBody(SCAN_SCHEMA) — strict: only {repoUrl} allowed, string 10-300 chars
 *   2. validateGitHubUrl()       — SSRF guard, shell injection, pattern enforcement
 *   3. scanRepository()          — isolated clone + engine scan + guaranteed cleanup
 */
router.post('/scan', validateBody(SCAN_SCHEMA), async (req, res) => {
  const { repoUrl } = req.body || {};

  // 1. Strict input validation
  const validation = validateGitHubUrl(repoUrl);
  if (!validation.valid) {
    return res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_URL',
      message: validation.error
    });
  }

  try {
    // 2. Perform isolated clone & scan
    const result = await scanRepository(validation.sanitizedUrl, validation.repo);

    // 3. Save masked report to cloud storage (fire-and-forget — never blocks response)
    const storagePromise = saveReport(result).catch(() => ({ stored: false }));

    // 4. Fire-and-forget Slack/Discord notification (never blocks response)
    sendScanNotification({
      repo: validation.repo,
      source: 'Manual Scan (Dashboard)',
      summary: result.summary,
      findings: result.findings,
      scanDurationMs: result.scanDurationMs
    }).catch(() => {});

    // Await storage just long enough to get the report URL to include in the response
    const storageResult = await Promise.race([
      storagePromise,
      new Promise(resolve => setTimeout(() => resolve({ stored: false, reason: 'storage timeout' }), 5000))
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        ...result,
        report: storageResult.stored
          ? {
              stored: true,
              provider: storageResult.provider,
              key: storageResult.key,
              presignedUrl: storageResult.presignedUrl,
              expiresIn: storageResult.expiresIn,
              publicUrl: storageResult.url || null
            }
          : {
              stored: false,
              provider: getProviderName(),
              reason: storageResult.reason
            }
      }
    });
  } catch (error) {
    console.error(`[Scan Error] for ${validation.sanitizedUrl}:`, error.message);

    // Provide clean, structured error responses for the frontend
    let statusCode = 500;
    let errorCode = 'SCAN_FAILED';

    if (error.message.includes('not found or is private')) {
      statusCode = 404;
      errorCode = 'REPO_NOT_FOUND_OR_PRIVATE';
    } else if (error.message.includes('timed out')) {
      statusCode = 408;
      errorCode = 'TIMEOUT';
    } else if (error.message.includes('exceeds the maximum allowed size')) {
      statusCode = 413;
      errorCode = 'REPO_TOO_LARGE';
    }

    return res.status(statusCode).json({
      status: 'error',
      errorCode,
      message: error.message || 'An unexpected error occurred while scanning the repository.'
    });
  }
});

module.exports = router;
