/**
 * CivicSight AI Backend Server
 * Express.js server with MongoDB connection for citizen issue reporting system
 * 
 * Features implemented:
 * - Basic Express app setup
 * - MongoDB connection using Mongoose
 * - CORS configuration
 * - Body parsing middleware
 * - JWT token support
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Import models, middleware, and controllers
const { Report } = require('./src/models');
const { authMiddleware } = require('./src/middleware');
const { authController } = require('./src/controllers');

// Initialize Express app
const app = express();

// Environment variables (with defaults for development)
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civicsight-ai';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:19006'], // React Native Metro bundler
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  console.log(`📊 Database: ${MONGODB_URI}`);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Basic route for health check
app.get('/', (req, res) => {
  res.json({
    message: 'CivicSight AI Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    features: [
      'Authentication (B-01)',
      'Data Storage (B-05, B-06)',
      'Mobile Frontend Support (M-01, M-03, M-05, M-06)'
    ]
  });
});

// API routes placeholder
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Test route to verify Report model (B-05)
app.get('/api/test-report', async (req, res) => {
  try {
    // Create a test report to verify the model works
    const testReport = new Report({
      userId: new mongoose.Types.ObjectId(), // Mock user ID
      issueType: 'pothole',
      severityScore: 4,
      description: 'Large pothole on Main Street causing traffic issues',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      },
      status: 'submitted',
      priority: 'high',
      tags: ['road', 'safety', 'traffic'],
      metadata: {
        source: 'mobile_app',
        deviceInfo: {
          platform: 'iOS',
          version: '1.0.0',
          model: 'iPhone 14'
        }
      }
    });

    // Save the test report
    await testReport.save();
    
    res.json({
      message: 'Report model test successful',
      report: testReport.toJSON(),
      modelInfo: {
        schemaFields: Object.keys(Report.schema.paths),
        indexes: Report.schema.indexes().length,
        virtuals: Object.keys(Report.schema.virtuals)
      }
    });
  } catch (error) {
    console.error('Report model test error:', error);
    res.status(500).json({
      error: 'Report model test failed',
      message: error.message
    });
  }
});

// Authentication test routes
app.get('/api/auth/test', authMiddleware.authenticateToken, (req, res) => {
  res.json({
    message: 'Authentication successful',
    user: req.user,
    authInfo: req.authInfo,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/auth/optional', authMiddleware.optionalAuth, (req, res) => {
  res.json({
    message: 'Optional authentication endpoint',
    authenticated: !!req.user,
    user: req.user || null,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/auth/admin', authMiddleware.authenticateToken, authMiddleware.requireRole('admin'), (req, res) => {
  res.json({
    message: 'Admin access granted',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/auth/authority', authMiddleware.authenticateToken, authMiddleware.requireRole(['authority', 'admin']), (req, res) => {
  res.json({
    message: 'Authority access granted',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Token generation test route
app.get('/api/auth/generate-token/:userId', (req, res) => {
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

// Authentication API routes (M-01)
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/profile', authMiddleware.authenticateToken, authController.getProfile);
app.put('/api/auth/profile', authMiddleware.authenticateToken, authController.updateProfile);
app.get('/api/auth/users', authController.getAllUsers); // For testing purposes

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/test-report',
      'GET /api/auth/test (requires Authorization header)',
      'GET /api/auth/optional',
      'GET /api/auth/admin (requires admin role)',
      'GET /api/auth/authority (requires authority/admin role)',
      'GET /api/auth/generate-token/:userId',
      'POST /api/auth/signup',
      'POST /api/auth/login',
      'GET /api/auth/profile (requires Authorization header)',
      'PUT /api/auth/profile (requires Authorization header)',
      'GET /api/auth/users'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Global error handler:', error);
  
  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  mongoose.connection.close(() => {
    console.log('📦 MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  mongoose.connection.close(() => {
    console.log('📦 MongoDB connection closed.');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 CivicSight AI Backend Server Started');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📱 API Base URL: http://localhost:${PORT}/api`);
  console.log('📋 Available features: Auth (B-01), Data Storage (B-05, B-06), Mobile Support (M-01, M-03, M-05, M-06)');
});

module.exports = app;
