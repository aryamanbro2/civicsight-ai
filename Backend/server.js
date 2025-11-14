// Backend/server.js
/**
 * CivicSight AI Backend Server (server.js)
 * This is the main entry point for the Node.js/Express server.
 */
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database'); 
const apiRoutes = require('./src/routes');
const { errorHandler, notFoundHandler } = require('./src/middleware');

// --- 1. Initialize Express App ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- 2. Core Middleware ---
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- 3. API Routes ---
app.use('/api', apiRoutes);

// --- 4. Health Check Route ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date().toISOString() 
  });
});

// --- 5. Error Handling Middleware ---
app.use(notFoundHandler);
app.use(errorHandler);

// --- 6. Start Server Function ---
const startServer = async () => {
  try {
    // CRITICAL FIX: Await the database connection *first*
    await connectDB();
    
    // Once connected, start the Express server
    app.listen(PORT, () => {
      console.log('--- CivicSight AI Backend Server Started ---');
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📱 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// --- 7. Run the Server ---
startServer();