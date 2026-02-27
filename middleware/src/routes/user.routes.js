/**
 * User Routes
 * 
 * Forwards user-related requests to the FastAPI backend.
 * All routes require authentication.
 * 
 * Endpoints:
 * - GET    /api/users/me
 * - PATCH  /api/users/me
 * - POST   /api/users/me/password
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const BackendService = require('../services/backendService');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/users/me
 * 
 * Get current authenticated user's profile.
 */
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    // Extract token and forward to backend
    const token = req.headers.authorization.split(' ')[1];
    
    const response = await BackendService.get('/api/v1/users/me', {
      Authorization: `Bearer ${token}`
    });

    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/users/me
 * 
 * Update current user's profile.
 */
router.patch(
  '/me',
  verifyToken,
  [
    body('first_name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('First name must be between 1 and 100 characters'),
    body('last_name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Last name must be between 1 and 100 characters'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object')
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
      const token = req.headers.authorization.split(' ')[1];
      
      const response = await BackendService.patch(
        '/api/v1/users/me',
        req.body,
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

/**
 * POST /api/users/me/password
 * 
 * Change current user's password.
 */
router.post(
  '/me/password',
  verifyToken,
  [
    body('current_password')
      .notEmpty()
      .withMessage('Current password is required')
      .isLength({ min: 8, max: 128 })
      .withMessage('Current password must be between 8 and 128 characters'),
    body('new_password')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8, max: 128 })
      .withMessage('New password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])/)
      .withMessage('New password must contain uppercase, lowercase, digit, and special character')
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
      const token = req.headers.authorization.split(' ')[1];
      
      const response = await BackendService.post(
        '/api/v1/users/me/password',
        {
          current_password: req.body.current_password,
          new_password: req.body.new_password
        },
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