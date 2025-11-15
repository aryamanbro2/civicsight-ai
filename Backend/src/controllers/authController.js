/**
 * Authentication Controller
 * Handles user signup, login, and profile management with gamification.
 */
const { User, Report } = require('../models'); 
const { generateToken } = require('../middleware/auth');

// --- BADGE CRITERIA (Backend source of truth for saving) ---
// This list is now only used to calculate the 'earned' array.
const BADGE_CRITERIA_DATA = [
    { name: 'Newbie Reporter', type: 'Reports', goal: 1 },
    { name: 'Super Contributor', type: 'Reports', goal: 5 },
    { name: 'Community Hero', type: 'Reports', goal: 25 },
    { name: 'Verified Voice', type: 'Upvotes', goal: 10 },
    { name: 'Pothole Master', type: 'Category', category: 'pothole', goal: 5 },
    { name: 'The Architect', type: 'Category', category: 'infrastructure', goal: 5 },
    { name: 'Sanitation Star', type: 'Category', category: 'sanitation', goal: 5 },
];

/**
 * Calculates raw stats AND earned badges for a user.
 */
const calculateUserStatsAndBadges = async (userId) => {
    const reports = await Report.find({ userId: userId });
    
    // 1. Calculate Raw Stats
    const reportCount = reports.length;
    const totalUpvotesReceived = reports.reduce((sum, report) => sum + (report.upvotes?.length || 0), 0);
    const categoryCounts = reports.reduce((acc, report) => {
        const type = report.issueType.toLowerCase();
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const userStats = {
        reportCount,
        totalUpvotesReceived,
        categoryCounts
    };

    // 2. Calculate Earned Badges based on stats
    const earnedBadges = [];
    BADGE_CRITERIA_DATA.forEach(criteria => {
        let isEarned = false;
        if (criteria.type === 'Reports') {
            if (reportCount >= criteria.goal) isEarned = true;
        } else if (criteria.type === 'Upvotes') {
            if (totalUpvotesReceived >= criteria.goal) isEarned = true;
        } else if (criteria.type === 'Category') {
            const currentCategoryCount = categoryCounts[criteria.category] || 0;
            if (currentCategoryCount >= criteria.goal) isEarned = true;
        }
        
        if (isEarned) {
            earnedBadges.push(criteria.name);
        }
    });

    return { 
        stats: userStats, 
        earned: Array.from(new Set(earnedBadges)) 
    };
};
// --- END BADGE LOGIC ---


/**
 * Register a new user
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
      return res.status(400).json({ error: 'Validation failed', message: error.message, code: 'VALIDATION_ERROR' });
    }
    next(error);
  }
};

/**
 * Log in a user
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
 * Get User Profile (with Gamification)
 * GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }
    
    // --- INTEGRATE BADGE CALCULATION ---
    const { stats, earned } = await calculateUserStatsAndBadges(req.userId);
    
    // Save any newly earned badges to the DB
    if (JSON.stringify(user.badges.sort()) !== JSON.stringify(earned.sort())) {
        user.badges = earned;
        await user.save();
    }
    
    const userProfile = user.toJSON();
    
    res.json({
      message: 'Profile retrieved successfully',
      user: {
          ...userProfile,
          stats: stats, // <-- Send raw stats to the frontend
      }
    });
    // --- END INTEGRATION ---

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
      return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    }
    
    console.log(`[Auth] Profile updated: ${updatedUser._id}`);
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', message: error.message, code: 'VALIDATION_ERROR' });
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