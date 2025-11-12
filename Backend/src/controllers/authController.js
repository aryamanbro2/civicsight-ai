/**
 * Authentication Controller (B-01, M-01)
 * Handles user authentication endpoints for citizen issue reporting system
 * * @author CivicSight AI Team
 * @version 1.1.0 (FIXED for Email/Password Auth)
 */

const { generateToken } = require('../middleware/auth');

// In-memory user store (placeholder for database)
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
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Find user by email
 * @param {string} email - Email to search for
 * @returns {Object|null} User object or null if not found
 */
const findUserByEmail = (email) => {
  for (const [userId, user] of userStore.entries()) {
    if (user.email === email) {
      return user; // Return the full user object
    }
  }
  return null;
};

/**
 * Create a new user
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {Object} additionalData - Additional user data
 * @returns {Object} Created user object
 */
const createUser = (name, email, password, additionalData = {}) => {
  const userId = generateUserId();
  const user = {
    id: userId,
    email: email,
    password: password, // In production, THIS MUST BE HASHED
    type: 'citizen',
    name: name || `User ${userId}`,
    phone: additionalData.phone || null,
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
 * * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const signup = async (req, res) => {
  try {
    // FIX: Changed from 'phone' to 'name', 'email', 'password'
    const { name, email, password, address } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name, email, and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email is already registered',
        code: 'USER_EXISTS',
        userId: existingUser.id
      });
    }

    // Create new user
    // FIX: Pass email and password to createUser
    const newUser = createUser(name, email, password, { address });

    // Generate authentication token
    const token = generateToken(newUser.id, {
      expiresIn: '7d',
      payload: {
        email: newUser.email,
        type: newUser.type
      }
    });

    // Update last login time
    newUser.lastLoginAt = new Date().toISOString();
    userStore.set(newUser.id, newUser);

    console.log(`📧 New user signup: ${newUser.id} (${email})`);

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
 * * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    // FIX: Changed from 'phone' to 'email' and 'password'
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Find user by email
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'No user found with this email',
        code: 'USER_NOT_FOUND'
      });
    }

    // FIX: Add password check
    // This is a MOCK check. In production, you MUST use bcrypt.compare()
    if (user.password !== password) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate authentication token
    const token = generateToken(user.id, {
      expiresIn: '7d',
      payload: {
        email: user.email,
        type: user.type
      }
    });

    // Update last login time
    user.lastLoginAt = new Date().toISOString();
    userStore.set(user.id, user);

    console.log(`🔐 User login: ${user.id} (${email})`);

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
 * * @param {Object} req - Express request object
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
 * * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, address, phone } = req.body; // Allow updating name, address, phone
    
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
      address: address || user.address,
      phone: phone || user.phone, // Allow adding/updating phone
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
 * * @param {Object} req - Express request object
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
  findUserByEmail, // Changed from findUserByPhone
  createUser
};