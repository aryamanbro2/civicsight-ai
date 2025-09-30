/**
 * Authentication Routes (B-01, M-01)
 * Defines all authentication-related API endpoints
 * 
 * Features implemented:
 * - User signup and login
 * - Profile management
 * - Token generation and testing
 * - User management (for testing)
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { authMiddleware } = require('../middleware');

// Public authentication routes (no auth required)
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Protected authentication routes (require authentication)
router.get('/profile', authMiddleware.authenticateToken, authController.getProfile);
router.put('/profile', authMiddleware.authenticateToken, authController.updateProfile);

// Testing and utility routes
router.get('/test', authMiddleware.authenticateToken, (req, res) => {
  res.json({
    message: 'Authentication successful',
    user: req.user,
    authInfo: req.authInfo,
    timestamp: new Date().toISOString()
  });
});

router.get('/optional', authMiddleware.optionalAuth, (req, res) => {
  res.json({
    message: 'Optional authentication endpoint',
    authenticated: !!req.user,
    user: req.user || null,
    timestamp: new Date().toISOString()
  });
});

// Role-based authentication routes
router.get('/admin', authMiddleware.authenticateToken, authMiddleware.requireRole('admin'), (req, res) => {
  res.json({
    message: 'Admin access granted',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

router.get('/authority', authMiddleware.authenticateToken, authMiddleware.requireRole(['authority', 'admin']), (req, res) => {
  res.json({
    message: 'Authority access granted',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Token generation route
router.get('/generate-token/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const token = authMiddleware.generateToken(userId, { expiresIn: '24h' });
    
    res.json({
      message: 'Token generated successfully',
      token,
      userId,
      expiresIn: '24h',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Token generation failed',
      message: error.message
    });
  }
});

// User management routes (for testing purposes)
router.get('/users', authController.getAllUsers);

module.exports = router;
