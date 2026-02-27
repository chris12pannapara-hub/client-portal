/**
 * Notification Routes
 * 
 * Forwards notification requests to the FastAPI backend.
 * All routes require authentication.
 * 
 * Endpoints:
 * - GET    /api/notifications
 * - GET    /api/notifications/unread/count
 * - PATCH  /api/notifications/read
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const BackendService = require('../services/backendService');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/notifications
 * 
 * Get notifications for authenticated user (paginated).
 * Query params: limit, offset, unread_only
 */
router.get(
  '/',
  verifyToken,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer'),
    query('unread_only')
      .optional()
      .isBoolean()
      .withMessage('unread_only must be a boolean')
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
      
      // Build query string
      const params = new URLSearchParams();
      if (req.query.limit) params.append('limit', req.query.limit);
      if (req.query.offset) params.append('offset', req.query.offset);
      if (req.query.unread_only) params.append('unread_only', req.query.unread_only);
      
      const queryString = params.toString();
      const endpoint = `/api/v1/notifications${queryString ? '?' + queryString : ''}`;
      
      const response = await BackendService.get(endpoint, {
        Authorization: `Bearer ${token}`
      });

      res.status(200).json(response.data);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/notifications/unread/count
 * 
 * Get count of unread notifications.
 * Polled by frontend notification bell every 30 seconds.
 */
router.get('/unread/count', verifyToken, async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    
    const response = await BackendService.get('/api/v1/notifications/unread/count', {
      Authorization: `Bearer ${token}`
    });

    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/notifications/read
 * 
 * Mark notification(s) as read.
 */
router.patch(
  '/read',
  verifyToken,
  [
    body('notification_ids')
      .isArray({ min: 1 })
      .withMessage('notification_ids must be a non-empty array'),
    body('notification_ids.*')
      .isUUID()
      .withMessage('Each notification_id must be a valid UUID')
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
        '/api/v1/notifications/read',
        {
          notification_ids: req.body.notification_ids
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