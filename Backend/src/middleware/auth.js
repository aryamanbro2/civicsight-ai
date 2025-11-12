/**
 * Authentication Middleware (JWT)
 * Handles token generation and validation.
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Import User model
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_key_please_change';

/**
 * Generates a JWT token for a user.
 * @param {string} userId - The user's ID.
 * @returns {string} The generated JWT token.
 */
const generateToken = (userId, options = {}) => {
  const payload = {
    sub: userId, // 'sub' (subject) is the standard JWT claim for the user ID
    ...options.payload
  };
  
  const signOptions = {
    expiresIn: options.expiresIn || '1d', // Default to 1 day
  };

  return jwt.sign(payload, JWT_SECRET, signOptions);
};

/**
 * Middleware to verify JWT token and attach user to request.
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No token provided or invalid format',
      code: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find the user in the database
    const user = await User.findById(decoded.sub).select('-password'); // Find by 'sub' claim, exclude password
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user and userId to the request object
    req.user = user;
    req.userId = user._id; // Attach ID for convenience
    
    next(); // User is authenticated, proceed to the next middleware/controller
  } catch (error) {
    let message = 'Invalid token';
    let code = 'INVALID_TOKEN';
    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired';
      code = 'TOKEN_EXPIRED';
    }
    
    return res.status(401).json({
      error: 'Authentication failed',
      message: message,
      code: code
    });
  }
};

module.exports = {
  generateToken,
  requireAuth,
  JWT_SECRET
};