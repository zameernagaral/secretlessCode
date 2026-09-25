const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

/**
 * Standard rate limit response formatter.
 * Returns structured JSON consistent with the rest of the API error shape.
 */
function rateLimitHandler(req, res, next, options) {
  res.status(options.statusCode).json({
    status: 'error',
    errorCode: 'RATE_LIMIT_EXCEEDED',
    message: options.message,
    retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutes'
  });
}

// ── Config from env (with safe defaults) ─────────────────────────────────────

const GLOBAL_MAX     = parseInt(process.env.RATE_GLOBAL_MAX, 10)     || 200;
const GLOBAL_WINDOW  = parseInt(process.env.RATE_GLOBAL_WINDOW_MS, 10)  || 15 * 60 * 1000; // 15 min
const SCAN_MAX       = parseInt(process.env.RATE_SCAN_MAX, 10)       || 5;
const SCAN_WINDOW    = parseInt(process.env.RATE_SCAN_WINDOW_MS, 10)    || 60 * 60 * 1000; // 1 hour
const HEALTH_MAX     = parseInt(process.env.RATE_HEALTH_MAX, 10)     || 60;
const HEALTH_WINDOW  = parseInt(process.env.RATE_HEALTH_WINDOW_MS, 10)  || 60 * 1000;      // 1 min

// ── 1. Global limiter — applied to all routes ─────────────────────────────────
// Protects against DDoS and general abuse on any endpoint.

const globalLimiter = rateLimit({
  windowMs: GLOBAL_WINDOW,
  max: GLOBAL_MAX,
  standardHeaders: 'draft-7',  // Return `RateLimit-*` headers (RFC 9110 draft)
  legacyHeaders: false,
  message: `Too many requests from this IP. Limit: ${GLOBAL_MAX} requests per ${GLOBAL_WINDOW / 60000} minutes.`,
  handler: rateLimitHandler,
  skip: (req) => req.path === '/api/github/webhook' || process.env.NODE_ENV === 'test'
});

// ── 2. Scan endpoint limiter ──────────────────────────────────────────────────
// Strict limit on POST /api/scan to prevent repo scanning abuse.
// Each scan clones a repo, runs Gitleaks, and consumes significant CPU/disk.

const scanLimiter = rateLimit({
  windowMs: SCAN_WINDOW,
  max: SCAN_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: `Scan limit exceeded. Maximum ${SCAN_MAX} scans per ${SCAN_WINDOW / 60000} minutes per IP. Please wait before scanning again.`,
  handler: rateLimitHandler,
  keyGenerator: (req) => ipKeyGenerator(req),
  skip: (req) => process.env.NODE_ENV === 'test'
});

// ── 3. Health check limiter ───────────────────────────────────────────────────
// Health probes should be fast and cheap but still rate-limited to prevent
// using the endpoint as a covert channel or uptime flooder.

const healthLimiter = rateLimit({
  windowMs: HEALTH_WINDOW,
  max: HEALTH_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: `Health check rate limit reached. Max ${HEALTH_MAX} requests per minute.`,
  handler: rateLimitHandler,
  skip: (req) => process.env.NODE_ENV === 'test'
});

// ── 4. GitHub Webhook limiter ─────────────────────────────────────────────────
// GitHub sends retries on failure — we want to accept bursts but cap runaway loops.
// Signature verification already guards against spoofed requests, this is an
// additional safety net for delivery volume.

const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 60,                   // 60 webhook events per 5 minutes (very generous for legit GitHub traffic)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Webhook rate limit exceeded.',
  handler: rateLimitHandler,
  keyGenerator: () => 'github-webhook', // all GitHub events share one bucket (not per-IP)
  skip: (req) => process.env.NODE_ENV === 'test'
});

module.exports = {
  globalLimiter,
  scanLimiter,
  healthLimiter,
  webhookLimiter
};
