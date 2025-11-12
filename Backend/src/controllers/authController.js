/**
 * Authentication Controller (B-01, M-01)
 * Handles user signup, login, and profile management using MongoDB.
 */

const { User } = require('../models');
const { generateToken } = require('../middleware/auth');

/**
 * User Signup (M-01)
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name, email, and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email is already registered',
        code: 'USER_EXISTS'
      });
    }

    // Create new user (password will be hashed by the pre-save hook)
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      address
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id);

    // Update last login time
    newUser.lastLoginAt = new Date();
    await newUser.save();

    console.log(`[Auth] New user signup: ${newUser._id} (${newUser.email})`);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      token
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
    next(error); // Pass to global error handler
  }
};

/**
 * User Login (M-01)
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    console.log(`[Auth] User login: ${user._id} (${user.email})`);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    next(error); // Pass to global error handler
  }
};

/**
 * Get User Profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
  try {
    // The user object is attached by requireAuth middleware
    // We re-fetch to ensure data is fresh, though req.user could be used
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
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
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
    // TODO: Add role check (req.user.role === 'admin')
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
  signup,
  login,
  getProfile,
  updateProfile,
  getAllUsers
};