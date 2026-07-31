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

  return async function (req, res) {
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

/**
 * Verify Firebase auth token from Authorization header
 * Returns decoded uid or throws Error with statusCode 401
 */
export async function verifyAuth(req, authLib) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
  const idToken = authHeader.substring(7);
  try {
    const decoded = await authLib.verifyIdToken(idToken);
    return decoded.uid;
  } catch (e) {
    const err = new Error('Invalid token');
    err.statusCode = 401;
    throw err;
  }
}

/**
 * Check if a user is an admin
 * 
 * @param {Object} req - Request object
 * @param {Object} authLib - Firebase Admin Auth
 * @param {Object} db - Firebase Admin Firestore
 * @returns {Object} { isAdmin: boolean, userId: string }
 */
export async function isAdmin(req, authLib, db) {
  try {
    const userId = await verifyAuth(req, authLib);

    // Check admins collection
    const adminSnap = await db.collection('admins').doc(userId).get();
    if (adminSnap.exists) {
      return { isAdmin: true, userId };
    }

    return { isAdmin: false, userId };
  } catch (e) {
    return { isAdmin: false };
  }
}

/**
 * Check if a user has permission to manage a project
 * 
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} projectSlug - Project slug
 * @param {string[]} allowedRoles - List of allowed roles
 * @returns {Promise<boolean>}
 */
export async function requireProjectPermission(db, userId, projectSlug, allowedRoles = ['admin']) {
  if (!userId || !projectSlug) return false;

  try {
    // allowedRoles is retained for caller compatibility; ownership is canonical.
    void allowedRoles;
    const adminSnap = await db.collection('admins').doc(userId).get();
    if (adminSnap.exists) return true;

    // 2. Check the project's own permissions
    const projectSnap = await db.collection('projects').doc(projectSlug).get();
    if (!projectSnap.exists) return false;

    const project = projectSnap.data();

    return Array.isArray(project.owners) && project.owners.includes(userId);
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}
