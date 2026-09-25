/**
 * Request Audit Logger — Secretless Code
 *
 * Logs every inbound request with a unique request ID for tracing.
 * Sensitive fields are NEVER logged (Authorization header, raw secrets, etc.)
 *
 * Log format (structured JSON — ready for Datadog, Papertrail, CloudWatch):
 * {"ts":"...","reqId":"a1b2c3d4","method":"POST","path":"/api/scan","ip":"1.2.3.4","status":200,"ms":842}
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

// Headers that must NEVER be logged
const REDACTED_HEADERS = new Set([
  'authorization', 'x-api-key', 'cookie', 'set-cookie', 'proxy-authorization'
]);

// Body fields that must never be logged even partially
const REDACTED_BODY_KEYS = new Set([
  'password', 'token', 'secret', 'key', 'apiKey', 'api_key',
  'privateKey', 'private_key', 'accessToken', 'access_token',
  'clientSecret', 'client_secret', 'rawMatch'
]);

/**
 * Redacts sensitive keys from a shallow copy of an object.
 */
function redactObject(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const safe = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_BODY_KEYS.has(key) || REDACTED_BODY_KEYS.has(key.toLowerCase())) {
      safe[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      safe[key] = '[object]';
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

/**
 * Generates a short, unique request ID (8 hex chars).
 */
function generateRequestId() {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Express middleware: assigns req.id and logs request + response metadata.
 * Attach before all routes.
 */
function requestLogger(req, res, next) {
  const reqId = generateRequestId();
  req.id = reqId;
  req.startTime = Date.now();

  res.setHeader('X-Request-ID', reqId);

  const meta = {
    reqId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket?.remoteAddress,
    ua: req.headers['user-agent'] || '-'
  };

  // Only log body for non-GET, non-buffer requests in non-production
  if (req.method !== 'GET' && req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    meta.body = redactObject(req.body);
  }

  logger.info('[REQ]', meta);

  res.on('finish', () => {
    const ms = Date.now() - req.startTime;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('[RES]', { reqId, method: req.method, path: req.path, status: res.statusCode, ms });
  });

  next();
}

/**
 * Specialized audit logger for admin actions.
 * Called manually inside admin route handlers for sensitive operations.
 *
 * @param {import('express').Request} req
 * @param {string} action
 * @param {object} [metadata]
 */
function auditLog(req, action, metadata = {}) {
  logger.warn('[AUDIT]', { reqId: req.id, action, ip: req.ip, ...metadata });
}

module.exports = { requestLogger, auditLog };
