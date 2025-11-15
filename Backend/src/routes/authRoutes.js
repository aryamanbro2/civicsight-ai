/**
 * Auth Routes (R-01)
 * Defines API endpoints for user authentication (signup, login, profile).
 */

const express = require('express');
const { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  getAllUsers,
  // Note: 'signup' is not imported here as 'register' is the primary route 
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// --- Public Auth Routes ---

// POST /api/auth/register (This is the route failing at line 16)
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// --- Protected Auth Routes ---

// GET /api/auth/profile
router.get('/profile', requireAuth, getProfile);

// PUT /api/auth/profile
router.put('/profile', requireAuth, updateProfile);

// GET /api/auth/users
router.get('/users', requireAuth, getAllUsers);

module.exports = router;