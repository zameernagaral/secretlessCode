/**
 * S3-Compatible Storage Provider
 * Works with:
 *   - AWS S3          (STORAGE_PROVIDER=s3)
 *   - Cloudflare R2   (STORAGE_PROVIDER=r2)
 *
 * Cloudflare R2 is 100% S3-compatible — same SDK, different endpoint.
 * R2 has zero egress fees, making it ideal for report downloads.
 *
 * Required env vars:
 *   STORAGE_BUCKET        - Bucket name
 *   STORAGE_REGION        - AWS region (e.g. "us-east-1") — R2 uses "auto"
 *   STORAGE_ACCESS_KEY_ID - Access key
 *   STORAGE_SECRET_KEY    - Secret access key
 *   STORAGE_ENDPOINT      - Custom endpoint URL (required for R2)
 *                           R2: https://<account-id>.r2.cloudflarestorage.com
 *   STORAGE_PUBLIC_URL    - (optional) Public CDN base URL for direct links
 *                           R2 public bucket URL or CloudFront distribution
 *   STORAGE_PRESIGN_EXPIRY_SEC - Presigned URL expiry in seconds (default: 3600)
 */

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const BUCKET = process.env.STORAGE_BUCKET;
const REGION = process.env.STORAGE_REGION || 'auto';
const ACCESS_KEY = process.env.STORAGE_ACCESS_KEY_ID;
const SECRET_KEY = process.env.STORAGE_SECRET_KEY;
const ENDPOINT = process.env.STORAGE_ENDPOINT;          // R2: required, S3: omit
const PUBLIC_URL = process.env.STORAGE_PUBLIC_URL;       // Optional CDN base URL
const PRESIGN_EXPIRY = parseInt(process.env.STORAGE_PRESIGN_EXPIRY_SEC, 10) || 3600;

let _client = null;

function getClient() {
  if (_client) return _client;

  const config = {
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY
    }
  };

  // Cloudflare R2 requires a custom endpoint
  if (ENDPOINT) {
    config.endpoint = ENDPOINT;
    config.forcePathStyle = true; // Required for R2 and MinIO
  }

  _client = new S3Client(config);
  return _client;
}

/**
 * Validates that all required env vars are present.
 * @returns {boolean}
 */
function isConfigured() {
  return Boolean(BUCKET && ACCESS_KEY && SECRET_KEY);
}

/**
 * Uploads a Buffer to the configured S3/R2 bucket.
 *
 * @param {string} key        - Object key / storage path (e.g. "reports/2025/01/15/repo_ts.json")
 * @param {Buffer} buffer     - File content to upload
 * @param {string} contentType - MIME type (default: "application/json")
 * @returns {Promise<{ key: string, url: string | null, presignedUrl: string }>}
 */
async function upload(key, buffer, contentType = 'application/json') {
  if (!isConfigured()) {
    throw new Error('S3/R2 storage is not configured. Set STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_KEY.');
  }

  const client = getClient();

  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    // Tag reports as masked-only for compliance documentation
    Tagging: 'content=masked-report&app=secretless-code'
  }));

  // If a public CDN URL is configured, build a direct link
  const publicUrl = PUBLIC_URL
    ? `${PUBLIC_URL.replace(/\/$/, '')}/${key}`
    : null;

  // Generate a presigned URL for temporary authenticated access (even for private buckets)
  const presignedUrl = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: PRESIGN_EXPIRY }
  );

  return { key, url: publicUrl, presignedUrl, expiresIn: PRESIGN_EXPIRY };
}

module.exports = { upload, isConfigured };
