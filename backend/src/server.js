require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const scanRouter = require('./routes/scan');
const githubRouter = require('./routes/github');
const adminRouter = require('./routes/admin');
const { requireAdminAuth } = require('./middlewares/auth');
const { sanitizeRequestBody } = require('./utils/validator');
const { requestLogger } = require('./middlewares/requestLogger');
const { outputSanitizer } = require('./middlewares/outputSanitizer');
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

// ── Body parsing & sanitization ────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeRequestBody);   // Strip __proto__, constructor, prototype pollution

// ── Output sanitization (masks rawMatch in all responses) ─────────────────────
app.use(outputSanitizer);

// ── Global rate limiter (all routes except GitHub webhook) ─────────────────────
app.use(globalLimiter);

// ── Public: Health check ────────────────────────────────────────────────────────
app.get('/api/health', healthLimiter, (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Secretless Code Backend',
    timestamp: new Date().toISOString()
  });
});

// ── Public: Scan route ──────────────────────────────────────────────────────────
app.use('/api/scan', scanLimiter);
app.use('/api', scanRouter);

// ── Public: GitHub App webhook ──────────────────────────────────────────────────
app.use('/api/github/webhook', webhookLimiter);
app.use('/api', githubRouter);

// ── Protected: Admin routes ─────────────────────────────────────────────────────
// requireAdminAuth validates Bearer ADMIN_API_KEY header before any admin handler runs
app.use('/api/admin', requireAdminAuth, adminRouter);

// ── 404 handler ─────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    errorCode: 'NOT_FOUND',
    message: 'Endpoint not found.'
  });
});

// ── Centralized error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  // Never leak stack traces in production
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    status: 'error',
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: isProd ? 'An internal server error occurred.' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`🛡️  Secretless Code Backend running on http://localhost:${PORT}`);
  console.log(`   Health:          GET  http://localhost:${PORT}/api/health`);
  console.log(`   Scan endpoint:   POST http://localhost:${PORT}/api/scan`);
  console.log(`   GitHub Webhook:  POST http://localhost:${PORT}/api/github/webhook`);
  console.log(`   Admin routes:    /api/admin/* (requires Authorization: Bearer <ADMIN_API_KEY>)`);
});

module.exports = app;
