require('dotenv').config();
const express = require('express');
const cors = require('cors');
const scanRouter = require('./routes/scan');
const githubRouter = require('./routes/github');

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Security & Parsing middlewares
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '100kb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Secretless Code Backend',
    timestamp: new Date().toISOString()
  });
});

// Scan API routes
app.use('/api', scanRouter);

// GitHub App webhook routes (uses express.raw() internally for HMAC verification)
app.use('/api', githubRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    errorCode: 'NOT_FOUND',
    message: 'Endpoint not found.'
  });
});

// Centralized error handler
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
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Scan endpoint:    POST http://localhost:${PORT}/api/scan`);
  console.log(`   GitHub Webhook:   POST http://localhost:${PORT}/api/github/webhook`);
});

module.exports = app;
