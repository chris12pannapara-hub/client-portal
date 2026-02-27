/**
 * Authentication Routes
 * 
 * Forwards authentication requests to the FastAPI backend.
 * 
 * Endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/logout
 * - POST /api/auth/refresh
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const BackendService = require('../services/backendService');
const { verifyToken } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * POST /api/auth/login
 * 
 * Authenticate user and return JWT tokens.
 * Rate limited to 10 attempts per 15 minutes.
 */
router.post(
  '/login',
  authLimiter,
  [
    body('email_or_username')
      .trim()
      .notEmpty()
      .withMessage('Email or username is required')
      .isLength({ min: 3, max: 255 })
      .withMessage('Email or username must be between 3 and 255 characters'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
  ],
  async (req, res, next) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: 'Validation Error',
        errors: errors.array()
      });
    }

    try {
      // Forward to backend
      const response = await BackendService.post('/api/v1/auth/login', {
        email_or_username: req.body.email_or_username,
        password: req.body.password
      });

      // Return tokens to client
      res.status(200).json(response.data);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/refresh
 * 
 * Exchange a refresh token for a new access token.
 */
router.post(
  '/refresh',
  [
    body('refresh_token')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],
  async (req, res, next) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: 'Validation Error',
        errors: errors.array()
      });
    }

    try {
      // Forward to backend
      const response = await BackendService.post('/api/v1/auth/refresh', {
        refresh_token: req.body.refresh_token
      });

      // Return new tokens
      res.status(200).json(response.data);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * 
 * Revoke refresh token(s).
 * Requires valid access token.
 */
router.post(
  '/logout',
  verifyToken, // Requires authentication
  async (req, res, next) => {
    try {
      // Extract access token from Authorization header
      const token = req.headers.authorization.split(' ')[1];

      // Forward to backend with Authorization header
      const response = await BackendService.post(
        '/api/v1/auth/logout',
        req.body.refresh_token ? { refresh_token: req.body.refresh_token } : {},
        {
          Authorization: `Bearer ${token}`
        }
      );

      res.status(200).json(response.data);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;