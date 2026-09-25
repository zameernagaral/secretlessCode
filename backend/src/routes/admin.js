/**
 * Admin Routes — Secretless Code
 * All routes here require requireAdminAuth (set in server.js).
 *
 * Endpoints:
 *   GET  /api/admin/health     — Extended health info (engine, storage, rate limits)
 *   GET  /api/admin/config     — Current runtime configuration (no secrets exposed)
 *   POST /api/admin/clear-cache — Placeholder for cache invalidation
 */

const express = require('express');
const { getEngineConfig } = require('../services/engineRouter');
const { getProviderName } = require('../services/storage/storageRouter');

const router = express.Router();

/**
 * GET /api/admin/health
 * Extended health check with runtime config info.
 * Only accessible to authenticated admins.
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Secretless Code Backend',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      heapUsedMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
      rssМB: (process.memoryUsage().rss / 1024 / 1024).toFixed(2)
    }
  });
});

/**
 * GET /api/admin/config
 * Returns current runtime configuration.
 * ⚠️ NEVER includes secret values — only keys/feature flags.
 */
router.get('/config', (req, res) => {
  const e = process.env;
  res.status(200).json({
    status: 'success',
    config: {
      scanEngine: getEngineConfig(),
      storageProvider: getProviderName(),
      rateLimits: {
        globalMax: parseInt(e.RATE_GLOBAL_MAX, 10) || 200,
        globalWindowMin: ((parseInt(e.RATE_GLOBAL_WINDOW_MS, 10) || 900000) / 60000).toFixed(0),
        scanMax: parseInt(e.RATE_SCAN_MAX, 10) || 5,
        scanWindowHr: ((parseInt(e.RATE_SCAN_WINDOW_MS, 10) || 3600000) / 3600000).toFixed(0)
      },
      features: {
        githubAppEnabled: Boolean(e.GITHUB_APP_ID && e.GITHUB_APP_PRIVATE_KEY),
        slackEnabled: Boolean(e.SLACK_WEBHOOK_URL),
        discordEnabled: Boolean(e.DISCORD_WEBHOOK_URL),
        storageEnabled: Boolean(e.STORAGE_PROVIDER && e.STORAGE_PROVIDER !== 'none'),
        adminEnabled: Boolean(e.ADMIN_API_KEY)
      },
      limits: {
        maxRepoSizeMB: parseInt(e.MAX_REPO_SIZE_MB, 10) || 60,
        cloneTimeoutMs: parseInt(e.CLONE_TIMEOUT_MS, 10) || 25000,
        scanTimeoutMs: parseInt(e.SCAN_TIMEOUT_MS, 10) || 25000
      },
      // Show which secrets are set (true/false only — never the value)
      secretsConfigured: {
        GITHUB_APP_ID: Boolean(e.GITHUB_APP_ID),
        GITHUB_APP_PRIVATE_KEY: Boolean(e.GITHUB_APP_PRIVATE_KEY),
        GITHUB_WEBHOOK_SECRET: Boolean(e.GITHUB_WEBHOOK_SECRET),
        SLACK_WEBHOOK_URL: Boolean(e.SLACK_WEBHOOK_URL),
        DISCORD_WEBHOOK_URL: Boolean(e.DISCORD_WEBHOOK_URL),
        STORAGE_ACCESS_KEY_ID: Boolean(e.STORAGE_ACCESS_KEY_ID),
        SUPABASE_SERVICE_KEY: Boolean(e.SUPABASE_SERVICE_KEY),
        ADMIN_API_KEY: Boolean(e.ADMIN_API_KEY)
      }
    }
  });
});

/**
 * POST /api/admin/clear-cache
 * Placeholder for future cache invalidation (e.g. Cloudflare KV, Redis).
 */
router.post('/clear-cache', (req, res) => {
  // TODO: Implement when a caching layer is added
  res.status(200).json({
    status: 'success',
    message: 'Cache cleared (no cache layer currently active).'
  });
});

module.exports = router;
