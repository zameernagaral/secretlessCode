require('dotenv').config();
const express = require('express');
const cors = require('cors');
const scanRouter = require('./routes/scan');
const githubRouter = require('./routes/github');
const {
  globalLimiter,
  scanLimiter,
  healthLimiter,
  webhookLimiter
} = require('./middlewares/rateLimiter');

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Trust first proxy (required for correct IP extraction behind Render / Vercel / Nginx)
app.set('trust proxy', 1);

// ── Security & Parsing middlewares ────────────────────────────────────────────
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '100kb' }));

// ── Global rate limiter (all routes except GitHub webhook) ────────────────────
app.use(globalLimiter);

// ── Health check endpoint (with its own tighter limiter) ──────────────────────
app.get('/api/health', healthLimiter, (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Secretless Code Backend',
    timestamp: new Date().toISOString(),
    rateLimits: {
      scan: `${process.env.RATE_SCAN_MAX || 5} scans / ${(parseInt(process.env.RATE_SCAN_WINDOW_MS, 10) || 3600000) / 60000} min per IP`,
      global: `${process.env.RATE_GLOBAL_MAX || 200} requests / ${(parseInt(process.env.RATE_GLOBAL_WINDOW_MS, 10) || 900000) / 60000} min per IP`
    }
  });
});

// ── Scan API routes (scan-specific strict limiter applied here) ───────────────
app.use('/api/scan', scanLimiter);
app.use('/api', scanRouter);

// ── GitHub App webhook routes (webhook-specific limiter) ──────────────────────
// Note: express.raw() is applied inside github.js for HMAC body verification
app.use('/api/github/webhook', webhookLimiter);
app.use('/api', githubRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    errorCode: 'NOT_FOUND',
    message: 'Endpoint not found.'
  });
});

// ── Centralized error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    status: 'error',
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'An internal server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`🛡️  Secretless Code Backend running on http://localhost:${PORT}`);
  console.log(`   Health check:     GET  http://localhost:${PORT}/api/health`);
  console.log(`   Scan endpoint:    POST http://localhost:${PORT}/api/scan`);
  console.log(`   GitHub Webhook:   POST http://localhost:${PORT}/api/github/webhook`);
  console.log(`   Rate limits:      scan=${process.env.RATE_SCAN_MAX || 5}/hr · global=${process.env.RATE_GLOBAL_MAX || 200}/15min`);
});

module.exports = app;
