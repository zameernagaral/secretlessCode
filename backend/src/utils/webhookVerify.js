const crypto = require('crypto');

/**
 * Verifies GitHub webhook signature using HMAC-SHA256.
 * Prevents spoofed webhook events from reaching the scanner.
 * @param {string} secret  - GITHUB_WEBHOOK_SECRET from env
 * @param {string} payload - Raw request body as string
 * @param {string} signature - X-Hub-Signature-256 header value
 * @returns {boolean}
 */
function verifyWebhookSignature(secret, payload, signature) {
  if (!signature || !secret) return false;

  const expected = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
}

module.exports = { verifyWebhookSignature };
