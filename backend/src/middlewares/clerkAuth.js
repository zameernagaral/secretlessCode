let clerkRequireAuth = null;
let clerkOptionalAuth = null;

if (process.env.CLERK_SECRET_KEY) {
  const { ClerkExpressRequireAuth, ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
  clerkRequireAuth = ClerkExpressRequireAuth({});
  clerkOptionalAuth = ClerkExpressWithAuth({});
}

// Require authentication (denies unauthenticated requests, returns 503 if Clerk unconfigured)
const requireAuth = (req, res, next) => {
  if (!process.env.CLERK_SECRET_KEY || !clerkRequireAuth) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'AUTH_NOT_CONFIGURED',
        message: 'Authentication service is not configured on this server.'
      }
    });
  }
  return clerkRequireAuth(req, res, next);
};

// Optional authentication
const optionalAuth = (req, res, next) => {
  if (!process.env.CLERK_SECRET_KEY || !clerkOptionalAuth) {
    req.auth = null;
    return next();
  }
  return clerkOptionalAuth(req, res, next);
};

module.exports = {
  requireAuth,
  optionalAuth
};

