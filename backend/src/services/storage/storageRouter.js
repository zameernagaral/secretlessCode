/**
 * Storage Router — Secretless Code
 *
 * Selects the active storage provider based on the STORAGE_PROVIDER env var.
 *
 * STORAGE_PROVIDER values:
 *   "r2"        - Cloudflare R2 (S3-compatible, zero egress fees) [recommended]
 *   "s3"        - AWS S3 (classic, many regions)
 *   "supabase"  - Supabase Storage (great if you're already using Supabase)
 *   "none"      - Disable storage, reports are ephemeral (default)
 *
 * Usage:
 *   const { saveReport } = require('./storage/storageRouter');
 *   const result = await saveReport(scanResult);
 *   // result → { stored: true, key, presignedUrl, provider, expiresIn }
 *   // or    → { stored: false, reason: '...' }  (if storage disabled or fails)
 */

const { buildReport, serializeReport, buildStorageKey } = require('./reportGenerator');

const STORAGE_PROVIDER = (process.env.STORAGE_PROVIDER || 'none').toLowerCase().trim();

/**
 * Lazily loads the appropriate provider module to avoid import errors when
 * SDKs aren't configured (e.g. no SUPABASE_URL set but supabase pkg installed).
 */
function getProvider() {
  switch (STORAGE_PROVIDER) {
    case 'r2':
    case 's3':
      return require('./s3Storage');
    case 'supabase':
      return require('./supabaseStorage');
    case 'none':
    default:
      return null;
  }
}

/**
 * Saves a scan result report to the configured cloud storage.
 * Never throws — storage failure must never break the scan response.
 *
 * @param {object} scanResult - Full scan result from scanner.js
 * @returns {Promise<object>} Storage result metadata or skip info
 */
async function saveReport(scanResult) {
  if (STORAGE_PROVIDER === 'none') {
    return { stored: false, reason: 'Storage disabled (STORAGE_PROVIDER=none)' };
  }

  const provider = getProvider();

  if (!provider) {
    return { stored: false, reason: `Unknown STORAGE_PROVIDER: "${STORAGE_PROVIDER}"` };
  }

  if (!provider.isConfigured()) {
    console.warn(`[Storage] Provider "${STORAGE_PROVIDER}" selected but not fully configured — skipping report save.`);
    return { stored: false, reason: `Provider "${STORAGE_PROVIDER}" credentials not configured.` };
  }

  try {
    // Build a masked, sanitized report (no raw secrets ever stored)
    const report = buildReport(scanResult);
    const buffer = serializeReport(report);
    const key = buildStorageKey(scanResult.repo, scanResult.scannedAt);

    const result = await provider.upload(key, buffer, 'application/json');

    console.log(`[Storage] ✅ Report saved: ${result.key} via ${STORAGE_PROVIDER}`);

    return {
      stored: true,
      provider: STORAGE_PROVIDER,
      key: result.key,
      url: result.url,
      presignedUrl: result.presignedUrl,
      expiresIn: result.expiresIn
    };

  } catch (err) {
    console.error(`[Storage] ❌ Failed to save report via ${STORAGE_PROVIDER}:`, err.message);
    // Non-fatal: return storage failure info instead of throwing
    return { stored: false, reason: err.message };
  }
}

/**
 * Returns the current storage provider name for API responses.
 */
function getProviderName() {
  return STORAGE_PROVIDER;
}

module.exports = { saveReport, getProviderName };
