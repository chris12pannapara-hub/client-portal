/**
 * Backend Service
 * 
 * Axios client for communicating with the FastAPI backend.
 * All requests to the Python backend go through this service.
 */

const axios = require('axios');
const config = require('../config');

// Create axios instance with default config
const backendClient = axios.create({
  baseURL: config.backendUrl,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - log outgoing requests in development
backendClient.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`→ Backend Request: ${config.method.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('Backend request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - log responses and handle errors
backendClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`← Backend Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // Backend returned an error response
      console.error(
        `Backend error: ${error.response.status} ${error.response.config.url}`,
        error.response.data
      );
    } else if (error.request) {
      // Request made but no response received
      console.error('Backend not responding:', error.message);
    } else {
      // Something else happened
      console.error('Backend request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

class BackendService {
  /**
   * Forward a request to the FastAPI backend
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body (for POST/PATCH)
   * @param {Object} headers - Additional headers
   * @returns {Promise} - Axios response
   */
  static async request(method, endpoint, data = null, headers = {}) {
    try {
      const response = await backendClient({
        method,
        url: endpoint,
        data,
        headers,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST request to backend
   */
  static async post(endpoint, data, headers = {}) {
    return this.request('POST', endpoint, data, headers);
  }

  /**
   * GET request to backend
   */
  static async get(endpoint, headers = {}) {
    return this.request('GET', endpoint, null, headers);
  }

  /**
   * PATCH request to backend
   */
  static async patch(endpoint, data, headers = {}) {
    return this.request('PATCH', endpoint, data, headers);
  }

  /**
   * DELETE request to backend
   */
  static async delete(endpoint, headers = {}) {
    return this.request('DELETE', endpoint, null, headers);
  }
}

module.exports = BackendService;