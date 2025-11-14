// Backend/src/middleware/index.js
/**
 * Middleware Barrel File
 * This file imports and exports all middleware for easy access.
 */

// Import from the new errorHandler.js file
const { notFoundHandler, errorHandler } = require('./errorHandler');

module.exports = {
  requireAuth: require('./auth'),
  errorHandler: errorHandler,
  notFoundHandler: notFoundHandler, // Add this export
};