/**
 * Supabase Storage Provider
 * Works with:
 *   - Supabase Storage (STORAGE_PROVIDER=supabase)
 *
 * Uses the @supabase/storage-js lightweight client (no full Supabase SDK needed).
 * Reports are uploaded to a private bucket and accessed via signed URLs.
 *
 * Required env vars:
 *   SUPABASE_URL             - Project URL: https://<project-id>.supabase.co
 *   SUPABASE_SERVICE_KEY     - Service role key (from Project Settings → API)
 *                              ⚠️ Use SERVICE key (not anon key) for server-side uploads
 *   SUPABASE_STORAGE_BUCKET  - Bucket name (e.g. "scan-reports") — must exist in dashboard
 *   STORAGE_PRESIGN_EXPIRY_SEC - Signed URL expiry in seconds (default: 3600)
 */

const { StorageClient } = require('@supabase/storage-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'scan-reports';
const PRESIGN_EXPIRY = parseInt(process.env.STORAGE_PRESIGN_EXPIRY_SEC, 10) || 3600;

let _storageClient = null;

function getClient() {
  if (_storageClient) return _storageClient;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Supabase storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }

  _storageClient = new StorageClient(`${SUPABASE_URL}/storage/v1`, {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`
  });

  return _storageClient;
}

/**
 * Validates that all required Supabase env vars are present.
 * @returns {boolean}
 */
function isConfigured() {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

/**
 * Uploads a Buffer to Supabase Storage and returns a signed URL.
 *
 * @param {string} key        - Object path within the bucket
 * @param {Buffer} buffer     - File content to upload
 * @param {string} contentType - MIME type (default: "application/json")
 * @returns {Promise<{ key: string, url: null, presignedUrl: string }>}
 */
async function upload(key, buffer, contentType = 'application/json') {
  if (!isConfigured()) {
    throw new Error('Supabase storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }

  const storage = getClient();
  const bucket = storage.from(BUCKET);

  // Upload the file (upsert: true prevents duplicate-key errors on retry)
  const { error: uploadError } = await bucket.upload(key, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600'
  });

  if (uploadError) {
    throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
  }

  // Generate a time-limited signed URL for download
  const { data: signedData, error: signError } = await bucket.createSignedUrl(key, PRESIGN_EXPIRY);

  if (signError) {
    throw new Error(`Supabase signed URL generation failed: ${signError.message}`);
  }

  return {
    key,
    url: null,            // No public URL (private bucket by design)
    presignedUrl: signedData.signedUrl,
    expiresIn: PRESIGN_EXPIRY
  };
}

module.exports = { upload, isConfigured };
