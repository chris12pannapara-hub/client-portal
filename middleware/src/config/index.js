/**
 * Configuration module
 * 
 * Loads and validates environment variables.
 * All config values are accessed through this single module.
 */

require('dotenv').config();

const config = {
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  
  // Backend Service
  backendUrl: process.env.BACKEND_URL || 'http://localhost:8000',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
  
  // Token Expiry
  accessTokenExpireMinutes: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES, 10) || 15,
  refreshTokenExpireDays: parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS, 10) || 7,
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate required environment variables
if (!config.jwtSecret) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
  process.exit(1);
}

if (config.jwtSecret.length < 32) {
  console.warn('WARNING: JWT_SECRET should be at least 32 characters for security.');
}

// Ensure JWT_SECRET matches backend
console.log('✓ Configuration loaded successfully');
console.log(`  Environment: ${config.nodeEnv}`);
console.log(`  Port: ${config.port}`);
console.log(`  Backend URL: ${config.backendUrl}`);
console.log(`  CORS Origin: ${config.corsOrigin}`);

module.exports = config;