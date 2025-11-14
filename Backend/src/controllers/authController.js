const { User } = require('../models');
const jwt = require('jsonwebtoken');
// REMOVED: google-auth-library import

// Helper function to create a token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '3d' // 3 day expiry
  });
};

/**
 * Register a new user (B-01)
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Validation failed', message: 'All fields (name, email, password) are required', code: 'MISSING_FIELDS' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ error: 'Conflict', message: 'User already exists with this email', code: 'USER_EXISTS' });
    }

    const user = new User({ name, email, password });
    await user.save();
    
    const token = createToken(user._id);

    console.log(`[Auth] New user registered: ${email} (ID: ${user._id})`);

    res.status(201).json({
      message: 'User registered successfully',
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
    next(error);
  }
};

/**
 * Log in a user (B-01)
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Validation failed', message: 'Email and password are required', code: 'MISSING_FIELDS' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const token = createToken(user._id);
    
    console.log(`[Auth] User logged in: ${email}`);

    res.status(200).json({
      message: 'Login successful',
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (error) {
    next(error);
  }
};

// REMOVED: googleLogin controller function

module.exports = {
  register,
  login,
  // REMOVED: googleLogin export
};