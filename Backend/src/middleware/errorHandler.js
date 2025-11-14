// Backend/src/middleware/errorHandler.js
/**
 * Error Handling Middleware
 */

// 404 Not Found Handler
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// General Error Handler
const errorHandler = (err, req, res, next) => {
  // Sometimes an error comes with a status code, otherwise default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode);
  
  console.error('Error:', err.message);
  
  res.json({
    error: err.name || 'Error',
    message: err.message,
    code: err.code || 'SERVER_ERROR',
    // Only show stack in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};