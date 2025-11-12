/**
 * Auth Routes (R-01)
 * Defines API endpoints for user authentication (signup, login, profile).
 */

const express = require('express');
// FIX: Removed imports for verifyOTP and resendOTP
const { signup, login, getProfile, updateProfile, getAllUsers } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// --- Public Auth Routes ---

// POST /api/auth/signup
// Register a new user
router.post('/signup', signup);

// POST /api/auth/login
// Log in a user (originally with phone, now email/pass)
router.post('/login', login);

// POST /api/auth/verify-otp
// Verify the OTP sent to the user
// FIX: Commented out, as this logic was removed from the controller
// router.post('/verify-otp', verifyOTP);

// POST /api/auth/resend-otp
// Resend the OTP to the user
// FIX: Commented out, as this logic was removed from the controller
// router.post('/resend-otp', resendOTP);

// --- Protected Auth Routes ---
// These routes require a valid JWT token (via requireAuth middleware)

// GET /api/auth/profile
// Get the authenticated user's profile
router.get('/profile', requireAuth, getProfile);

// PUT /api/auth/profile
// Update the authenticated user's profile
router.put('/profile', requireAuth, updateProfile);

// GET /api/auth/users
// Get a list of all users (for admin/testing)
router.get('/users', requireAuth, getAllUsers);

module.exports = router;