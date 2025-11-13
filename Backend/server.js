/**
 * CivicSight AI Backend Server
 * Express.js server with MongoDB connection for citizen issue reporting system
 * * Features implemented:
 * - Modular route structure
 * - MongoDB connection using Mongoose
 * - CORS configuration
 * - Body parsing middleware
 * - JWT token support
 * - Production-ready error handling
 * * @author CivicSight AI Team
 * @version 1.1.0 (Updated for .env integration and CORS fix)
 */

// 1. CRITICAL: Load environment variables from .env file immediately
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import route modules
const apiRoutes = require('./src/routes');

// Initialize Express app
const app = express();

// Environment variables (The process.env.MONGODB_URI is now guaranteed to be loaded)
const PORT = process.env.PORT || 3000;
// Using the .env variable, falling back to localhost for pure local dev if .env is missing
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civicsight_dev';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware configuration
app.use(cors({
  // 2. FIX: Use wildcard (*) for development to allow Expo/Tunnel connections
  origin: NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://civicsight.ai']
    : '*', 
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));
// Request logging middleware (only in development)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// MongoDB connection
const connectDB = async () => {
  try {
    // Mongoose will use the URI from the .env file (MONGODB_URI)
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${MONGODB_URI}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

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

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'CivicSight AI Backend API',
    version: '1.1.0',
    status: 'running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    features: [
      'Authentication (B-01)',
      'Data Storage (B-05, B-06)',
      'Mobile Frontend Support (M-01, M-03, M-05, M-06)'
    ],
    documentation: {
      health: '/api/health',
      auth: '/api/auth',
      reports: '/api/reports'
    }
  });
});

// API routes
app.use('/api', apiRoutes);

// Enhanced health check route
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: {
      status: dbStatus,
      readyState: mongoose.connection.readyState
    },
    server: {
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
      }
    }
  });
});

// Test route for Report model (development only)
if (NODE_ENV === 'development') {
  // NOTE: You must install the 'dotenv' package: npm install dotenv
  // If you see a failure here, ensure you have run that command.
  const { Report } = require('./src/models');
  
  app.get('/api/test-report', async (req, res) => {
    try {
      const testReport = new Report({
        userId: 'test-user-' + Date.now(),
        issueType: 'pothole',
        severityScore: 4,
        description: 'Test report for model validation',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        },
        status: 'submitted',
        priority: 'high',
        tags: ['test', 'validation'],
        metadata: {
          source: 'test',
          deviceInfo: {
            platform: 'test',
            version: '1.0.0',
            model: 'test'
          }
        }
      });

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
}

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /',
      'GET /api/health',
      ...(NODE_ENV === 'development' ? ['GET /api/test-report'] : []),
      'POST /api/auth/signup',
      'POST /api/auth/login',
      'GET /api/auth/profile (requires Authorization header)',
      'PUT /api/auth/profile (requires Authorization header)',
      'GET /api/auth/users',
      'POST /api/reports (requires Authorization header)',
      'GET /api/reports (requires Authorization header)',
      'GET /api/reports/my (requires Authorization header)',
      'GET /api/reports/:id (requires Authorization header)',
      'PUT /api/reports/:id/status (requires Authorization header)'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Global error handler:', error);
  
  const isDevelopment = NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { 
      stack: error.stack,
      details: error
    })
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Graceful shutdown...`);
  
  mongoose.connection.close()
    .then(() => {
      console.log('📦 MongoDB connection closed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log('🚀 CivicSight AI Backend Server Started');
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📱 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log('📋 Available features: Auth (B-01), Data Storage (B-05, B-06), Mobile Support (M-01, M-03, M-05, M-06)');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;