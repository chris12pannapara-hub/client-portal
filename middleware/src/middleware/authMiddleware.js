/**
 * Authentication Middleware
 * 
 * Verifies JWT access tokens on protected routes.
 * Extracts token from Authorization header and validates it.
 */

const TokenService = require('../services/tokenService');

/**
 * Middleware to verify JWT access token
 * 
 * Expects: Authorization header with "Bearer <token>"
 * Sets: req.user = { userId, role } if valid
 * Returns: 401 if token is missing or invalid
 */
const verifyToken = (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No authorization header provided'
    });
  }

  // Check format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authorization header format. Expected: Bearer <token>'
    });
  }

  const token = parts[1];

  // Verify token
  const decoded = TokenService.verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired access token'
    });
  }

  // Verify token type (must be 'access', not 'refresh')
  if (decoded.type !== 'access') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token type. Expected access token.'
    });
  }

  // Attach user info to request object
  req.user = {
    userId: decoded.sub,
    role: decoded.role,
    tokenExp: decoded.exp
  };

  // Log authentication in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`✓ Authenticated user: ${req.user.userId} (${req.user.role})`);
  }

  next();
};

/**
 * Middleware to check user role
 * @param {string} requiredRole - Minimum required role ('user', 'manager', 'admin')
 * @returns {Function} - Express middleware function
 */
const requireRole = (requiredRole) => {
  const roleHierarchy = {
    user: 1,
    manager: 2,
    admin: 3
  };

  return (req, res, next) => {
    // Ensure verifyToken ran first
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const userLevel = roleHierarchy[req.user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 999;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. ${requiredRole} role required.`
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};