/**
 * Token Service
 * 
 * Handles JWT token operations:
 * - Signing new tokens
 * - Verifying tokens
 * - Extracting token payload
 * 
 * IMPORTANT: This uses the SAME secret key as the FastAPI backend,
 * allowing the middleware to verify tokens issued by FastAPI.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

class TokenService {
  /**
   * Verify a JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object|null} - Decoded payload if valid, null if invalid
   */
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret, {
        algorithms: [config.jwtAlgorithm]
      });
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.log('Token expired:', error.message);
      } else if (error.name === 'JsonWebTokenError') {
        console.log('Invalid token:', error.message);
      } else {
        console.error('Token verification error:', error);
      }
      return null;
    }
  }

  /**
   * Decode a token without verifying (useful for debugging)
   * @param {string} token - JWT token to decode
   * @returns {Object|null} - Decoded payload or null
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  /**
   * Extract user ID from token
   * @param {string} token - JWT token
   * @returns {string|null} - User ID (from 'sub' claim) or null
   */
  static getUserIdFromToken(token) {
    const decoded = this.verifyToken(token);
    return decoded ? decoded.sub : null;
  }

  /**
   * Extract user role from token
   * @param {string} token - JWT token
   * @returns {string|null} - User role or null
   */
  static getUserRoleFromToken(token) {
    const decoded = this.verifyToken(token);
    return decoded ? decoded.role : null;
  }

  /**
   * Check if token is expired (without verifying signature)
   * @param {string} token - JWT token
   * @returns {boolean} - True if expired, false otherwise
   */
  static isTokenExpired(token) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }
}

module.exports = TokenService;