/**
 * Express Middleware Application
 * 
 * BFF (Backend For Frontend) layer between React and FastAPI.
 * 
 * Responsibilities:
 * - JWT token verification
 * - Rate limiting
 * - CORS handling
 * - Request forwarding to FastAPI backend
 * - Security headers
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');

// Import middleware
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const notificationRoutes = require('./routes/notification.routes');

// Create Express app
const app = express();

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Security headers
app.use(helmet());

// CORS - Allow requests from React frontend
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (only in development)
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting (skip in test environment)
if (config.nodeEnv !== 'test') {
  app.use(generalLimiter);
}

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'express-middleware',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// =============================================================================
// START SERVER
// =============================================================================

const PORT = config.port;

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Express Middleware Server`);
  console.log('='.repeat(60));
  console.log(`Environment:     ${config.nodeEnv}`);
  console.log(`Port:            ${PORT}`);
  console.log(`Backend URL:     ${config.backendUrl}`);
  console.log(`CORS Origin:     ${config.corsOrigin}`);
  console.log(`Rate Limit:      ${config.rateLimitMaxRequests} requests per ${config.rateLimitWindowMs / 60000} minutes`);
  console.log('='.repeat(60));
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Health check:    http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
});

module.exports = app;