/**
 * Structured Logger — Secretless Code
 *
 * Behaviour per environment:
 *   production  → ERROR + WARN only. No stack traces. No path disclosure.
 *   development → All levels (debug, info, warn, error) with full detail.
 *   test        → Silent by default (set LOG_LEVEL=debug to enable).
 *
 * All output is structured JSON (one line per entry) — ready for
 * Datadog, CloudWatch, Render log drain, Railway logs, Fly.io, etc.
 *
 * Usage:
 *   const logger = require('../utils/logger');
 *   logger.info('[Scan] Started', { repo: 'owner/repo' });
 *   logger.error('[Scan] Failed',  { error: 'Repository not found' });  // never pass Error objects directly
 */

const IS_PROD  = process.env.NODE_ENV === 'production';
const IS_TEST  = process.env.NODE_ENV === 'test';

// Allowed levels per environment (ordered by severity)
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

function getMinLevel() {
  const envOverride = (process.env.LOG_LEVEL || '').toLowerCase();
  if (envOverride && LEVELS[envOverride] !== undefined) return LEVELS[envOverride];
  if (IS_TEST)  return Infinity;          // silent in test (unless LOG_LEVEL set)
  if (IS_PROD)  return LEVELS.warn;      // warn + error only in production
  return LEVELS.debug;                    // everything in development
}

const MIN_LEVEL = getMinLevel();

/**
 * Sanitizes an Error object for safe logging.
 * Never exposes stack traces or internal file paths in production.
 * @param {Error | unknown} err
 * @returns {object}
 */
function sanitizeError(err) {
  if (!err) return {};
  if (err instanceof Error) {
    return IS_PROD
      ? { error: err.message }         // message only in production
      : { error: err.message, stack: err.stack?.split('\n').slice(0, 5).join(' | ') };
  }
  return { error: String(err) };
}

/**
 * Sanitizes a metadata object — removes any keys that could leak secrets.
 * @param {object} meta
 * @returns {object}
 */
const REDACTED_KEYS = new Set([
  'password', 'token', 'secret', 'apiKey', 'api_key', 'key',
  'privateKey', 'private_key', 'accessToken', 'access_token',
  'authorization', 'cookie', 'rawMatch', 'GITHUB_APP_PRIVATE_KEY'
]);

function sanitizeMeta(meta = {}) {
  if (!meta || typeof meta !== 'object') return {};
  const safe = {};
  for (const [k, v] of Object.entries(meta)) {
    if (REDACTED_KEYS.has(k) || REDACTED_KEYS.has(k.toLowerCase())) {
      safe[k] = '[REDACTED]';
    } else if (v instanceof Error) {
      Object.assign(safe, sanitizeError(v));
    } else if (typeof v === 'object' && v !== null) {
      safe[k] = '[object]';
    } else {
      safe[k] = v;
    }
  }
  return safe;
}

/**
 * Core log emitter.
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {string} message
 * @param {object} [meta]
 */
function emit(level, message, meta = {}) {
  if (LEVELS[level] < MIN_LEVEL) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...sanitizeMeta(meta)
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

const logger = {
  debug: (msg, meta) => emit('debug', msg, meta),
  info:  (msg, meta) => emit('info',  msg, meta),
  warn:  (msg, meta) => emit('warn',  msg, meta),
  error: (msg, meta) => emit('error', msg, meta)
};

module.exports = logger;
