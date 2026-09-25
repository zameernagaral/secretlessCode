/**
 * Admin Authentication Middleware — Secretless Code
 *
 * Protects admin-only routes using a static Bearer token (ADMIN_API_KEY).
 * Suitable for internal tooling and team dashboards without a full auth server.
 *
 * For a production multi-user setup, replace this with JWT + a user service.
 *
 * Usage:
 *   app.use('/api/admin', requireAdminAuth, adminRouter);
 *
 * Required env var:
 *   ADMIN_API_KEY  — A long random secret (min 32 chars).
 *                    Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const crypto = require('crypto');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const MIN_KEY_LENGTH = 32;

// Warn loudly at startup if the admin key is missing or weak
if (!ADMIN_API_KEY) {
  console.warn('[Auth] ⚠️  ADMIN_API_KEY is not set. Admin routes are disabled. Set it in your .env to enable them.');
} else if (ADMIN_API_KEY.length < MIN_KEY_LENGTH) {
  console.warn(`[Auth] ⚠️  ADMIN_API_KEY is shorter than ${MIN_KEY_LENGTH} characters. Use a longer, more random key.`);
}

/**
 * Extracts the Bearer token from the Authorization header.
 * @param {string} authHeader - e.g. "Bearer abc123"
 * @returns {string | null}
 */
function extractBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  return parts[1].trim() || null;
}

/**
 * Express middleware: require a valid ADMIN_API_KEY in the Authorization header.
 * Returns 503 if admin key is not configured, 401 if missing/wrong.
 */
function requireAdminAuth(req, res, next) {
  // If no key is configured, admin routes are completely unavailable
  if (!ADMIN_API_KEY) {
    return res.status(503).json({
      status: 'error',
      errorCode: 'ADMIN_NOT_CONFIGURED',
      message: 'Admin routes are not enabled on this server.'
    });
  }

  const provided = extractBearerToken(req.headers['authorization'] || '');

  if (!provided) {
    return res.status(401).json({
      status: 'error',
      errorCode: 'MISSING_AUTH',
      message: 'Authorization: Bearer <token> header is required.'
    });
  }

  // Use crypto.timingSafeEqual to prevent timing attacks on token comparison
  let isValid = false;
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(ADMIN_API_KEY);
    // Buffers must be same length for timingSafeEqual
    if (a.length === b.length) {
      isValid = crypto.timingSafeEqual(a, b);
    }
  } catch {
    isValid = false;
  }

  if (!isValid) {
    // Add a small artificial delay to slow down brute-force attempts
    return setTimeout(() => {
      res.status(401).json({
        status: 'error',
        errorCode: 'INVALID_AUTH',
        message: 'Invalid admin token.'
      });
    }, 300);
  }

  // Stamp a flag so downstream middleware can verify auth passed
  req.isAdminAuthenticated = true;
  next();
}

/**
 * Optional: check a user has a specific permission (extendable for RBAC).
 * Currently only one level exists: 'admin'. Structure is ready for expansion.
 *
 * @param {'admin'} requiredPermission
 */
function requirePermission(requiredPermission) {
  return (req, res, next) => {
    if (!req.isAdminAuthenticated) {
      return res.status(403).json({
        status: 'error',
        errorCode: 'FORBIDDEN',
        message: 'You do not have permission to access this resource.'
      });
    }
    // Future: check req.user.roles.includes(requiredPermission)
    if (requiredPermission !== 'admin') {
      return res.status(403).json({
        status: 'error',
        errorCode: 'INSUFFICIENT_PERMISSION',
        message: `Required permission: ${requiredPermission}`
      });
    }
    next();
  };
}

module.exports = { requireAdminAuth, requirePermission };
