const { ClerkExpressRequireAuth, ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

// Require authentication (throws 401 if not logged in)
const requireAuth = ClerkExpressRequireAuth({});

// Optional authentication (req.auth will be populated if logged in, otherwise null)
const optionalAuth = ClerkExpressWithAuth({});

module.exports = {
  requireAuth,
  optionalAuth
};
