// src/middleware/errorHandler.js

import logger from '../utils/logger.js';

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  });

  // Don't leak error details in production
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : err.message;

  // Send error response
  res.status(err.statusCode || 500).json({
    error: errorMessage,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

/**
 * Handle 404 errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const notFoundHandler = (req, res) => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({ error: 'Route not found' });
};
