/**
 * Token Utility Functions
 * 
 * Helper functions for working with JWT tokens.
 */

/**
 * Decode a JWT token (without verifying signature)
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null
 */
export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if a token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Get user ID from token
 * @param {string} token - JWT token
 * @returns {string|null} - User ID or null
 */
export const getUserIdFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded ? decoded.sub : null;
};

/**
 * Get user role from token
 * @param {string} token - JWT token
 * @returns {string|null} - User role or null
 */
export const getUserRoleFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded ? decoded.role : null;
};