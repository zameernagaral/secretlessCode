const express = require('express');
const { validateGitHubUrl } = require('../utils/validator');
const { scanRepository } = require('../services/scanner');
const { sendScanNotification } = require('../services/notifier');
const { saveReport, getProviderName } = require('../services/storage/storageRouter');
const { saveScanRecord } = require('./scansHistory');
const { validateBody, SCAN_SCHEMA } = require('../middlewares/validateSchema');
const logger = require('../utils/logger');

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
      success: false,
      error: {
        code: 'INVALID_URL',
        message: validation.error
      }
    });
  }

  try {
    // 2. Perform isolated clone & scan
    const result = await scanRepository(validation.sanitizedUrl, validation.repo);

    // 3. Save scan to Prisma database / history
    const dbRecord = await saveScanRecord({
      repoUrl: validation.sanitizedUrl,
      repoName: validation.repo,
      status: result.findings && result.findings.length > 0 ? 'completed' : 'clean',
      findingsCount: result.findings ? result.findings.length : 0,
      findings: result.findings || [],
      scanDurationMs: result.scanDurationMs,
      isDemo: false,
    }).catch(() => null);

    // 4. Save masked report to cloud storage (fire-and-forget — never blocks response)
    const storagePromise = saveReport(result).catch(() => ({ stored: false }));

    // 5. Fire-and-forget Slack/Discord notification (never blocks response)
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
      success: true,
      data: {
        ...result,
        id: dbRecord?.id || result.scanId,
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
    logger.error('[Scan] Failed', { url: validation.sanitizedUrl, error: error.message });

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
      success: false,
      error: {
        code: errorCode,
        message: error.message || 'An unexpected error occurred while scanning the repository.'
      }
    });
  }
});

/**
 * GET /api/v1/scans/demo
 * Returns immediate specimen scan findings for the deliberately leaky demo repo.
 * Public, zero signup, zero rate limit.
 */
router.get(['/scans/demo', '/scan/demo'], (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      repo: 'secretless-demo/vulnerable-specimen',
      isDemo: true,
      scanDurationMs: 1240,
      timestamp: new Date().toISOString(),
      summary: {
        totalFindings: 3,
        critical: 2,
        high: 1,
        medium: 0,
        low: 0
      },
      findings: [
        {
          ruleId: 'aws-access-token',
          provider: 'aws',
          ruleName: 'AWS Access Key ID',
          file: 'backend/.env',
          line: 42,
          maskedToken: 'AKIA••••••••••••••••3821',
          remediation: {
            revocationUrl: 'https://console.aws.amazon.com/iam/home#/security_credentials',
            scrubCommand: 'git-filter-repo --invert-paths --path backend/.env --force'
          }
        },
        {
          ruleId: 'stripe-secret-key',
          provider: 'stripe',
          ruleName: 'Stripe Live Secret Key',
          file: 'src/config/stripe.ts',
          line: 14,
          maskedToken: 'sk_live_••••••••••••••••8912',
          remediation: {
            revocationUrl: 'https://dashboard.stripe.com/apikeys',
            scrubCommand: 'git-filter-repo --invert-paths --path src/config/stripe.ts --force'
          }
        },
        {
          ruleId: 'github-pat',
          provider: 'github_pat',
          ruleName: 'GitHub Personal Access Token',
          file: '.github/workflows/deploy.yml',
          line: 19,
          maskedToken: 'ghp_••••••••••••••••7701',
          remediation: {
            revocationUrl: 'https://github.com/settings/tokens',
            scrubCommand: 'git-filter-repo --invert-paths --path .github/workflows/deploy.yml --force'
          }
        }
      ]
    }
  });
});

/**
 * GET /api/v1/security/policy
 * Returns the public specification for zero-retention architecture.
 */
router.get('/security/policy', (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      policy: 'Zero-Retention RAM Buffer Execution',
      version: '2026.1',
      retentionPolicy: 'Ephemeral in-memory cloning only; files discarded upon scan completion.',
      encryption: 'TLS 1.3 / AES-256',
      anonymousTTLSeconds: 3600
    }
  });
});

module.exports = router;
