/**
 * Rate limiting utility for API routes
 *
 * NOTE: In serverless environments (Vercel, Netlify), this is an
 * approximate limiter — each invocation has its own in-memory cache.
 * For precise distributed rate limiting, replace with Vercel KV or Redis.
 */

function now() {
  return Date.now();
}

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

  const tokenCache = new Map();
  let lastCleanup = now();

  function evictStaleEntries() {
    const cutoff = now() - interval * 2;
    for (const [key, data] of tokenCache.entries()) {
      if (data.timestamps.length === 0 || Math.max(...data.timestamps) < cutoff) {
        tokenCache.delete(key);
      }
    }
  }

  function getTokensRemaining(token, limit) {
    const windowStart = now() - interval;
    const tokenData = tokenCache.get(token) || { timestamps: [] };

    tokenData.timestamps = tokenData.timestamps.filter(ts => ts > windowStart);
    return Math.max(0, limit - tokenData.timestamps.length);
  }

  const check = async (res, limit, token) => {
    if (now() - lastCleanup > interval) {
      evictStaleEntries();
      lastCleanup = now();
    }

    const clientToken = token || 'global';
    const remaining = getTokensRemaining(clientToken, limit);

    const tokenData = tokenCache.get(clientToken) || { timestamps: [] };

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining - 1));

    if (remaining <= 0) {
      const error = new Error('Rate limit exceeded');
      error.statusCode = 429;
      throw error;
    }

    tokenData.timestamps.push(now());
    tokenCache.set(clientToken, tokenData);

    if (tokenCache.size > uniqueTokenPerInterval) {
      let oldestToken = null;
      let oldestTime = now();

      for (const [key, data] of tokenCache.entries()) {
        const minTs = data.timestamps.length > 0 ? Math.min(...data.timestamps) : now();
        if (minTs < oldestTime) {
          oldestTime = minTs;
          oldestToken = key;
        }
      }

      if (oldestToken && oldestTime < now() - interval) {
        tokenCache.delete(oldestToken);
      }
    }
  };

  return { check };
}