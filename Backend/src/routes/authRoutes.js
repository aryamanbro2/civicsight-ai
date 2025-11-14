/**
 * Auth Routes (R-01)
 * Defines API endpoints for user authentication (register, login).
 */

const express = require('express');
const { register, login } = require('../controllers/authController'); // REMOVED: googleLogin
const router = express.Router();

// POST /api/auth/register (B-01)
// Register a new user
router.post('/register', register);

// POST /api/auth/login (B-01)
// Log in a user
router.post('/login', login);

// REMOVED: /api/auth/google route

module.exports = router;