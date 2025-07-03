/**
 * API Middleware Utilities
 * Common middleware functions for API endpoints
 */

import rateLimit from './rateLimit';

/**
 * Apply standard middleware to an API handler
 * 
 * @param {Function} handler - The API route handler
 * @param {Object} options - Configuration options
 * @param {string[]} options.allowedMethods - HTTP methods allowed for this endpoint
 * @param {number} options.rateLimit - Number of requests allowed per minute
 * @param {string} options.rateLimitKey - Key for rate limiting
 * @returns {Function} Enhanced handler with middleware applied
 */
export function withApiMiddleware(handler, options = {}) {
  const {
    allowedMethods = ['GET'],
    rateLimit: rateLimitCount = 10,
    rateLimitKey = 'API_REQUEST'
  } = options;
  
  // Create rate limiter
  const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500, // Max 500 users per minute
  });
  
  return async function(req, res) {
    try {
      // 1. Validate HTTP method
      if (!allowedMethods.includes(req.method)) {
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`,
          allowedMethods
        });
      }
      
      // 2. Apply rate limiting
      try {
        await limiter.check(res, rateLimitCount, rateLimitKey);
      } catch (error) {
        if (error.statusCode === 429) {
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded. Please try again later.'
          });
        }
        throw error; // Re-throw unexpected errors
      }
      
      // 3. Call the original handler
      return await handler(req, res);
    } catch (error) {
      console.error(`API Error in ${req.url}:`, error);
      
      // Handle different types of errors
      const statusCode = error.statusCode || error.response?.status || 500;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && {
          stack: error.stack,
          details: error.response?.data
        })
      });
    }
  };
}

/**
 * Validate required fields in a request body
 * 
 * @param {Object} body - Request body
 * @param {string[]} requiredFields - List of required field names
 * @throws {Error} If any required fields are missing
 */
export function validateRequiredFields(body, requiredFields) {
  const missingFields = requiredFields.filter(field => !body[field]);
  
  if (missingFields.length > 0) {
    const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
    error.statusCode = 400;
    error.details = {
      required: requiredFields,
      missing: missingFields,
      received: Object.keys(body)
    };
    throw error;
  }
}

/**
 * Parse query parameters safely
 * 
 * @param {Object} query - Request query object
 * @param {Object} options - Parsing options
 * @param {string[]} options.stringParams - Parameters to parse as strings
 * @param {string[]} options.numberParams - Parameters to parse as numbers
 * @param {string[]} options.booleanParams - Parameters to parse as booleans
 * @returns {Object} Parsed query parameters
 */
export function parseQueryParams(query, options = {}) {
  const {
    stringParams = [],
    numberParams = [],
    booleanParams = []
  } = options;
  
  const result = {};
  
  // Process string parameters
  stringParams.forEach(param => {
    if (query[param] !== undefined) {
      result[param] = String(query[param]);
    }
  });
  
  // Process number parameters
  numberParams.forEach(param => {
    if (query[param] !== undefined) {
      result[param] = Number(query[param]);
      
      // Validate number parsing
      if (isNaN(result[param])) {
        const error = new Error(`Invalid number format for parameter: ${param}`);
        error.statusCode = 400;
        throw error;
      }
    }
  });
  
  // Process boolean parameters
  booleanParams.forEach(param => {
    if (query[param] !== undefined) {
      result[param] = query[param] === 'true' || query[param] === '1';
    }
  });
  
  return result;
}