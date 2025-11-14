/**
 * Authentication Controller (B-01, M-01)
 * Handles user signup, login, and profile management using MongoDB.
 */
const { User } = require('../models');
// 1. IMPORT THE CORRECT TOKEN GENERATOR (from auth.js)
const { generateToken } = require('../middleware/auth');
// 2. REMOVE 'jsonwebtoken' (it's not needed here)
// const jwt = require('jsonwebtoken');

// 3. REMOVE THE INCORRECT LOCAL createToken FUNCTION
/*
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '3d' 
  });
};
*/

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
    
    // 4. USE THE CORRECT IMPORTED FUNCTION
    const token = generateToken(user._id);

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

    // 5. USE THE CORRECT IMPORTED FUNCTION
    const token = generateToken(user._id);

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

/**
 * Get User Profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
  try {
    // This logic is now correct. req.userId comes from auth.js (which finds decoded.sub)
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }
    
    res.json({
      message: 'Profile retrieved successfully',
      user: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update User Profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    // This logic is also correct.
    const { name, address, phone } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (phone) updateData.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    }
    
    console.log(`[Auth] Profile updated: ${updatedUser._id}`);
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
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
 * Get all users (Admin/Test only)
 * GET /api/auth/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      message: 'Users retrieved successfully',
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers
};