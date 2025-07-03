/**
 * Common Utility Functions
 * Shared utilities used across the application
 */

/**
 * Generate a unique idempotency key
 */
export function generateIdempotencyKey(prefix = "tx") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 15)}`;
}

/**
 * Format error response consistently
 */
export function formatError(error, context = "") {
  return {
    success: false,
    error: error.message || "Unknown error occurred",
    details: error.details || {},
    context,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format success response consistently
 */
export function formatSuccess(data, context = "") {
  return {
    success: true,
    data,
    context,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate required fields in an object
 */
export function validateRequired(obj, requiredFields) {
  const missing = requiredFields.filter((field) => !obj[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
  return true;
}

/**
 * Sleep/delay function
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry operation with exponential backoff
 */
export async function withRetry(operation, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(
        `Operation failed (attempt ${attempt}/${maxRetries}):`,
        error.message
      );
      await sleep(delay);
    }
  }
}

/**
 * Truncate address for display
 */
export function truncateAddress(address, startLength = 6, endLength = 4) {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Format token amount
 */
export function formatTokenAmount(amount, decimals = 6, displayDecimals = 2) {
  if (!amount) return "0";

  const numericAmount = parseFloat(amount) / Math.pow(10, decimals);
  return numericAmount.toFixed(displayDecimals);
}

/**
 * Parse token amount to wei
 */
export function parseTokenAmount(amount, decimals = 6) {
  if (!amount) return "0";

  const numericAmount = parseFloat(amount);
  return Math.floor(numericAmount * Math.pow(10, decimals)).toString();
}

/**
 * Check if value is a valid Ethereum address
 */
export function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if value is a valid transaction hash
 */
export function isValidTxHash(hash) {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Debounce function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (typeof obj === "object") {
    const cloned = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
}

/**
 * Check if object is empty
 */
export function isEmpty(obj) {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === "string") return obj.length === 0;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === "object") return Object.keys(obj).length === 0;
  return false;
}

/**
 * Safe JSON parse
 */
export function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safe JSON stringify
 */
export function safeJsonStringify(obj, defaultValue = "{}") {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Get timestamp in various formats
 */
export function getTimestamp(format = "iso") {
  const now = new Date();

  switch (format) {
    case "iso":
      return now.toISOString();
    case "unix":
      return Math.floor(now.getTime() / 1000);
    case "ms":
      return now.getTime();
    case "readable":
      return now.toLocaleString();
    default:
      return now.toISOString();
  }
}

export default {
  generateIdempotencyKey,
  formatError,
  formatSuccess,
  validateRequired,
  sleep,
  withRetry,
  truncateAddress,
  formatTokenAmount,
  parseTokenAmount,
  isValidAddress,
  isValidTxHash,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  safeJsonParse,
  safeJsonStringify,
  getTimestamp,
};
