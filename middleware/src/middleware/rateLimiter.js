/**
 * Rate Limiting Middleware
 * 
 * Prevents abuse by limiting the number of requests per IP address.
 * 
 * Default: 100 requests per 15 minutes per IP
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');

// General rate limiter for all routes
const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too Many Requests',
    message: `Too many requests from this IP. Please try again after ${config.rateLimitWindowMs / 60000} minutes.`,
    retryAfter: config.rateLimitWindowMs / 1000 // seconds
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
  // Skip successful requests (only count errors and failed attempts)
  skip: (req, res) => res.statusCode < 400,
});

// Strict rate limiter for auth endpoints (more restrictive)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 login attempts per 15 minutes
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts. Please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Don't skip any requests for auth endpoints
  skipSuccessfulRequests: false,
});

module.exports = {
  generalLimiter,
  authLimiter
};