require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const scanRouter = require('./routes/scan');
const scanFileRouter = require('./routes/scanFile');
const githubRouter = require('./routes/github');
const adminRouter = require('./routes/admin');
const paymentsRouter = require('./routes/payments');
const { requireAdminAuth } = require('./middlewares/auth');
const { sanitizeRequestBody } = require('./utils/validator');
const { requestLogger } = require('./middlewares/requestLogger');
const { outputSanitizer } = require('./middlewares/outputSanitizer');
const logger = require('./utils/logger');
const {
  globalLimiter,
  scanLimiter,
  healthLimiter,
  webhookLimiter
} = require('./middlewares/rateLimiter');

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Trust first proxy (correct IP extraction behind Render / Vercel / Nginx / Fly.io)
app.set('trust proxy', 1);

// ── HTTP Security Headers (Helmet) ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 63072000,       // 2 years
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400   // Cache preflight for 24h
}));

// ── Request Audit Logging ──────────────────────────────────────────────────────
// Assigns req.id, logs all inbound requests (no sensitive fields)
app.use(requestLogger);

// ── Stripe Payments & Webhooks ─────────────────────────────────────────────────
// MUST be mounted before global express.json() so webhooks can read raw body
app.use('/api/v1', paymentsRouter);

// ── Body parsing & sanitization ────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeRequestBody);   // Strip __proto__, constructor, prototype pollution

// ── Output sanitization (masks rawMatch in all responses) ─────────────────────
app.use(outputSanitizer);

// ── Global rate limiter (all routes except GitHub webhook) ─────────────────────
app.use(globalLimiter);

// ── Public: Health check ────────────────────────────────────────────────────────
app.get('/api/v1/health', healthLimiter, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'Secretless Code Backend',
      timestamp: new Date().toISOString()
    }
  });
});

// ── Public: Scan routes ──────────────────────────────────────────────────────
app.use('/api/v1/scan', scanLimiter);
app.use('/api/v1', scanRouter);
app.use('/api/v1', scanFileRouter);    // POST /api/v1/scan/upload

// ── Public: GitHub App webhook ──────────────────────────────────────────────────
app.use('/api/v1/webhooks/github', webhookLimiter);
app.use('/api/v1', githubRouter);

// ── Protected: Admin routes ─────────────────────────────────────────────────────
// requireAdminAuth validates Bearer ADMIN_API_KEY header before any admin handler runs
app.use('/api/v1/admin', requireAdminAuth, adminRouter);

// ── 404 handler ─────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found.'
    }
  });
});

// ── Centralized error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Never leak stack traces or internal paths in production
  const isProd = process.env.NODE_ENV === 'production';
  logger.error('[Server] Unhandled error', {
    reqId: req.id,
    method: req.method,
    path: req.path,
    error: isProd ? 'Internal server error' : err.message
  });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred.'
    }
  });
});

// Start server only when run directly — tests require the app and control the port themselves
if (require.main === module) {
  app.listen(PORT, () => {
  logger.info('[Server] Started', {
    port: PORT,
    endpoints: [
      `GET  /api/v1/health`,
      `POST /api/v1/scan`,
      `POST /api/v1/scan/upload (max ${process.env.MAX_UPLOAD_SIZE_MB || 20}MB)`,
      `POST /api/v1/webhooks/github`,
      `POST /api/v1/projects`,
      `POST /api/v1/payments/create-checkout-session`,
      `POST /api/v1/webhooks/stripe`,
      `GET  /api/v1/admin/* (Bearer <ADMIN_API_KEY>)`
    ]
  });
  });
}

module.exports = app;
