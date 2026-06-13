const logger = require('../config/logger');
const { error } = require('../utils/apiResponse');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).reduce((acc, { path, message }) => {
      acc[path] = [message];
      return acc;
    }, {});
    return error(res, 'Validation failed', 422, errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return error(res, `${field} already exists`, 409);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return error(res, `Invalid ${err.path}: ${err.value}`, 400);
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  return error(res, message, statusCode);
};

// 404 handler (must be registered after all routes)
const notFound = (req, res) => {
  error(res, `Route ${req.originalUrl} not found`, 404);
};

module.exports = { errorHandler, notFound };
