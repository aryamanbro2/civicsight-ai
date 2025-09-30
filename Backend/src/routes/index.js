/**
 * Routes Index
 * Central routing configuration for all API endpoints
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const reportRoutes = require('./reportRoutes');
// const userRoutes = require('./userRoutes');

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'connected', // This will be updated by the server
    timestamp: new Date().toISOString()
  });
});

// API route modules
router.use('/auth', authRoutes);
router.use('/reports', reportRoutes);
// router.use('/users', userRoutes);

module.exports = router;
