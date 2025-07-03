/**
 * Rate limiting utility for API routes
 * Based on the Next.js API rate limiting pattern
 */

/**
 * Creates a rate limiter instance to protect API routes from abuse
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Time window in milliseconds
 * @param {number} options.uniqueTokenPerInterval - Max number of unique clients per interval
 * @returns {Object} Rate limiter object with check method
 */
export default function rateLimit(options) {
  const { interval, uniqueTokenPerInterval } = options;
  
  // Store for rate limiting tokens
  const tokenCache = new Map();
  
  // Cleanup function to prevent memory leaks
  const getTokensRemaining = (token, limit) => {
    const now = Date.now();
    const windowStart = now - interval;
    
    // Get existing data for this token
    const tokenData = tokenCache.get(token) || {
      count: 0,
      timestamps: []
    };
    
    // Filter out timestamps that are outside the current window
    tokenData.timestamps = tokenData.timestamps.filter(timestamp => timestamp > windowStart);
    
    // Get count of requests in the current window
    const currentCount = tokenData.timestamps.length;
    
    // Calculate remaining requests
    return Math.max(0, limit - currentCount);
  };

  /**
   * Check if a request is within rate limits
   * 
   * @param {Object} res - Response object
   * @param {number} limit - Maximum number of requests per interval
   * @param {string} token - Unique identifier for the client
   * @returns {Promise<void>}
   * @throws {Error} If rate limit is exceeded
   */
  const check = async (res, limit, token) => {
    // Use IP as fallback if no token provided
    const clientToken = token || 'global';
    
    // Check remaining tokens
    const remaining = getTokensRemaining(clientToken, limit);
    
    // Get token data or initialize new entry
    const tokenData = tokenCache.get(clientToken) || {
      count: 0,
      timestamps: []
    };
    
    // Set headers for rate limiting
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining - 1);
    
    // If no tokens remaining, reject the request
    if (remaining <= 0) {
      const error = new Error('Rate limit exceeded');
      error.statusCode = 429;
      throw error;
    }
    
    // Add timestamp to track this request
    tokenData.timestamps.push(Date.now());
    tokenCache.set(clientToken, tokenData);
    
    // Clean up old entries periodically
    if (tokenCache.size > uniqueTokenPerInterval) {
      // Find oldest token to remove
      let oldestToken = null;
      let oldestTime = Date.now();
      
      for (const [key, data] of tokenCache.entries()) {
        const oldestTimestamp = data.timestamps.length > 0 
          ? Math.min(...data.timestamps) 
          : Date.now();
        
        if (oldestTimestamp < oldestTime) {
          oldestTime = oldestTimestamp;
          oldestToken = key;
        }
      }
      
      // Remove oldest token if found
      if (oldestToken && oldestTime < Date.now() - interval) {
        tokenCache.delete(oldestToken);
      }
    }
  };
  
  return { check };
}