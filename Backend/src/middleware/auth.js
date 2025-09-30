/**
 * Authentication Middleware (B-01)
 * Mock JWT authentication middleware for citizen issue reporting system
 * 
 * Features implemented:
 * - Mock JWT token verification
 * - Mock token generation
 * - User ID extraction and attachment to request
 * - Authorization header validation
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');

// Mock JWT secret (in production, this should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'civicsight-ai-mock-secret-key';

/**
 * Mock JWT token generation function
 * Generates a JWT token for a given user ID
 * 
 * @param {string} userId - The user ID to encode in the token
 * @param {Object} options - Additional options for token generation
 * @param {string} options.expiresIn - Token expiration time (default: '24h')
 * @param {Object} options.payload - Additional payload data
 * @returns {string} Generated JWT token
 * 
 * @example
 * const token = generateToken('citizen-123', { expiresIn: '7d' });
 */
const generateToken = (userId, options = {}) => {
  try {
    const payload = {
      userId,
      type: 'citizen', // User type: citizen, authority, admin
      iat: Math.floor(Date.now() / 1000), // Issued at
      ...options.payload
    };

    const tokenOptions = {
      expiresIn: options.expiresIn || '24h',
      issuer: 'civicsight-ai',
      audience: 'civicsight-mobile-app'
    };

    return jwt.sign(payload, JWT_SECRET, tokenOptions);
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Mock JWT token verification function
 * Verifies and decodes a JWT token
 * 
 * @param {string} token - The JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'civicsight-ai',
      audience: 'civicsight-mobile-app'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Authentication token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid authentication token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Mock authentication middleware
 * Verifies JWT token from Authorization header and attaches user info to request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * app.use('/api/protected', authenticateToken);
 */
const authenticateToken = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Authorization header is missing',
        code: 'MISSING_AUTH_HEADER'
      });
    }

    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Invalid authentication format',
        message: 'Authorization header must start with "Bearer "',
        code: 'INVALID_AUTH_FORMAT'
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        error: 'Authentication token missing',
        message: 'Token not provided in Authorization header',
        code: 'MISSING_TOKEN'
      });
    }

    // For mock implementation, we'll use a simple approach
    // In a real implementation, this would verify the JWT token
    if (token === 'mock-token-citizen-123') {
      // Mock user data for testing
      req.userId = 'citizen-123';
      req.user = {
        id: 'citizen-123',
        type: 'citizen',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890'
      };
    } else if (token === 'mock-token-authority-456') {
      // Mock authority user data
      req.userId = 'authority-456';
      req.user = {
        id: 'authority-456',
        type: 'authority',
        name: 'City Works Department',
        email: 'works@city.gov',
        department: 'Public Works'
      };
    } else if (token === 'mock-token-admin-789') {
      // Mock admin user data
      req.userId = 'admin-789';
      req.user = {
        id: 'admin-789',
        type: 'admin',
        name: 'System Administrator',
        email: 'admin@civicsight.ai'
      };
    } else {
      // Try to verify as a real JWT token
      try {
        const decoded = verifyToken(token);
        req.userId = decoded.userId;
        req.user = {
          id: decoded.userId,
          type: decoded.type || 'citizen',
          ...decoded.payload
        };
      } catch (jwtError) {
        return res.status(401).json({
          error: 'Invalid authentication token',
          message: jwtError.message,
          code: 'INVALID_TOKEN'
        });
      }
    }

    // Add user info to request for logging
    req.authInfo = {
      userId: req.userId,
      userType: req.user.type,
      authenticatedAt: new Date().toISOString()
    };

    console.log(`🔐 Authenticated user: ${req.userId} (${req.user.type})`);
    next();

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal authentication error',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
};

/**
 * Optional authentication middleware
 * Similar to authenticateToken but doesn't return error if no token provided
 * Useful for endpoints that work with or without authentication
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No authentication provided, continue without user info
      req.userId = null;
      req.user = null;
      return next();
    }

    // Use the same logic as authenticateToken
    return authenticateToken(req, res, next);
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Continue without authentication on error
    req.userId = null;
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 * Checks if the authenticated user has the required role/permission
 * 
 * @param {string|Array} requiredRoles - Required role(s) for access
 * @returns {Function} Express middleware function
 * 
 * @example
 * app.get('/api/admin', requireRole('admin'), adminController);
 * app.get('/api/authority', requireRole(['authority', 'admin']), authorityController);
 */
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.type;
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Access denied. Required role: ${roles.join(' or ')}, User role: ${userRole}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Mock user data for testing
 * Contains sample user data for different user types
 */
const mockUsers = {
  'citizen-123': {
    id: 'citizen-123',
    type: 'citizen',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St, Anytown, USA'
  },
  'authority-456': {
    id: 'authority-456',
    type: 'authority',
    name: 'City Works Department',
    email: 'works@city.gov',
    phone: '+1987654321',
    department: 'Public Works',
    jurisdiction: 'Anytown, USA'
  },
  'admin-789': {
    id: 'admin-789',
    type: 'admin',
    name: 'System Administrator',
    email: 'admin@civicsight.ai',
    phone: '+1555000123',
    permissions: ['read', 'write', 'delete', 'admin']
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  optionalAuth,
  requireRole,
  mockUsers
};
