/**
 * Middleware Index
 * Central export point for all custom middleware functions
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

// Import middleware modules
const authMiddleware = require('./auth');
// const validationMiddleware = require('./validationMiddleware');
// const errorMiddleware = require('./errorMiddleware');

module.exports = {
  authMiddleware,
  // validationMiddleware,
  // errorMiddleware
};
