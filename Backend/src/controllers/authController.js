/**
 * Authentication Controller (B-01, M-01)
 * Handles user authentication endpoints for citizen issue reporting system
 * 
 * Features implemented:
 * - User signup with phone number (M-01)
 * - User login with phone number
 * - Mock token generation and verification
 * - In-memory user storage (placeholder for database)
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

const { generateToken } = require('../middleware/auth');

// In-memory user store (placeholder for database)
// In production, this would be replaced with MongoDB User model
const userStore = new Map();

// Counter for generating unique user IDs
let userIdCounter = 1;

/**
 * Generate a unique user ID
 * @returns {string} Unique user ID
 */
const generateUserId = () => {
  return `citizen-${userIdCounter++}`;
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone number
 */
const isValidPhoneNumber = (phone) => {
  // Basic phone number validation (10+ digits)
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Find user by phone number
 * @param {string} phone - Phone number to search for
 * @returns {Object|null} User object or null if not found
 */
const findUserByPhone = (phone) => {
  for (const [userId, user] of userStore.entries()) {
    if (user.phone === phone) {
      return { userId, ...user };
    }
  }
  return null;
};

/**
 * Create a new user
 * @param {string} phone - User's phone number
 * @param {Object} additionalData - Additional user data
 * @returns {Object} Created user object
 */
const createUser = (phone, additionalData = {}) => {
  const userId = generateUserId();
  const user = {
    id: userId,
    phone,
    type: 'citizen',
    name: additionalData.name || `User ${userId}`,
    email: additionalData.email || null,
    address: additionalData.address || null,
    isVerified: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    ...additionalData
  };
  
  userStore.set(userId, user);
  return user;
};

/**
 * User Signup (M-01)
 * POST /api/auth/signup
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const signup = async (req, res) => {
  try {
    const { phone, name, email, address } = req.body;

    // Validate required fields
    if (!phone) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Phone number is required',
        code: 'MISSING_PHONE'
      });
    }

    // Validate phone number format
    if (!isValidPhoneNumber(phone)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid phone number format',
        code: 'INVALID_PHONE_FORMAT'
      });
    }

    // Check if user already exists
    const existingUser = findUserByPhone(phone);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this phone number is already registered',
        code: 'USER_EXISTS',
        userId: existingUser.id
      });
    }

    // Create new user
    const newUser = createUser(phone, { name, email, address });

    // Generate authentication token
    const token = generateToken(newUser.id, {
      expiresIn: '7d',
      payload: {
        phone: newUser.phone,
        type: newUser.type
      }
    });

    // Update last login time
    newUser.lastLoginAt = new Date().toISOString();
    userStore.set(newUser.id, newUser);

    console.log(`📱 New user signup: ${newUser.id} (${phone})`);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        phone: newUser.phone,
        name: newUser.name,
        email: newUser.email,
        type: newUser.type,
        isVerified: newUser.isVerified,
        createdAt: newUser.createdAt
      },
      token,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Signup failed',
      message: 'Internal server error during user registration',
      code: 'SIGNUP_ERROR'
    });
  }
};

/**
 * User Login (M-01)
 * POST /api/auth/login
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate required fields
    if (!phone) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Phone number is required',
        code: 'MISSING_PHONE'
      });
    }

    // Validate phone number format
    if (!isValidPhoneNumber(phone)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid phone number format',
        code: 'INVALID_PHONE_FORMAT'
      });
    }

    // Find user by phone number
    const user = findUserByPhone(phone);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'No user found with this phone number',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate authentication token
    const token = generateToken(user.id, {
      expiresIn: '7d',
      payload: {
        phone: user.phone,
        type: user.type
      }
    });

    // Update last login time
    user.lastLoginAt = new Date().toISOString();
    userStore.set(user.id, user);

    console.log(`🔐 User login: ${user.id} (${phone})`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        type: user.type,
        isVerified: user.isVerified,
        lastLoginAt: user.lastLoginAt
      },
      token,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Internal server error during authentication',
      code: 'LOGIN_ERROR'
    });
  }
};

/**
 * Get User Profile
 * GET /api/auth/profile
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to access profile',
        code: 'AUTH_REQUIRED'
      });
    }

    const user = userStore.get(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      message: 'Profile retrieved successfully',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        address: user.address,
        type: user.type,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Profile retrieval failed',
      message: 'Internal server error while fetching profile',
      code: 'PROFILE_ERROR'
    });
  }
};

/**
 * Update User Profile
 * PUT /api/auth/profile
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, email, address } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to update profile',
        code: 'AUTH_REQUIRED'
      });
    }

    const user = userStore.get(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update user data
    const updatedUser = {
      ...user,
      name: name || user.name,
      email: email || user.email,
      address: address || user.address,
      updatedAt: new Date().toISOString()
    };

    userStore.set(userId, updatedUser);

    console.log(`📝 Profile updated: ${userId}`);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        name: updatedUser.name,
        email: updatedUser.email,
        address: updatedUser.address,
        type: updatedUser.type,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt,
        lastLoginAt: updatedUser.lastLoginAt,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Profile update failed',
      message: 'Internal server error while updating profile',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
};

/**
 * Get all users (for testing purposes)
 * GET /api/auth/users
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllUsers = async (req, res) => {
  try {
    const users = Array.from(userStore.values()).map(user => ({
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      type: user.type,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }));

    res.json({
      message: 'Users retrieved successfully',
      count: users.length,
      users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      error: 'User retrieval failed',
      message: 'Internal server error while fetching users',
      code: 'USERS_ERROR'
    });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  // Export utility functions for testing
  userStore,
  findUserByPhone,
  createUser
};
