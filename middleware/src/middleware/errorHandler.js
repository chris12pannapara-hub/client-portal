/**
 * Error Handling Middleware
 * 
 * Centralized error handler for the Express app.
 * Catches all errors and returns consistent error responses.
 */

/**
 * Global error handler
 * Must be registered LAST in the middleware chain
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  // Default to 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Axios errors (from backend service)
  if (err.response) {
    // Backend returned an error
    statusCode = err.response.status;
    message = err.response.data?.detail || err.response.data?.message || message;
  } else if (err.request) {
    // Backend didn't respond
    statusCode = 503;
    message = 'Backend service unavailable';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Send error response
  res.status(statusCode).json({
    error: getErrorName(statusCode),
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Get standard error name from status code
 */
function getErrorName(statusCode) {
  const errorNames = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return errorNames[statusCode] || 'Error';
}

/**
 * 404 handler for unmatched routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};