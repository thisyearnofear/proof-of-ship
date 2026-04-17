/**
 * Base Service Class
 * Common functionality for all API services
 */

import { apiConfigs } from "../config/environment";

export class BaseService {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.config = apiConfigs[serviceName] || {};
    this.initialized = false;
  }

  /**
   * Check if service is properly configured
   */
  isConfigured() {
    return this.initialized && this.validateConfig();
  }

  /**
   * Validate service configuration - to be implemented by subclasses
   */
  validateConfig() {
    throw new Error("validateConfig() must be implemented by subclass");
  }

  /**
   * Initialize service - to be implemented by subclasses
   */
  initialize() {
    throw new Error("initialize() must be implemented by subclass");
  }

  /**
   * Common error handling
   */
  handleError(error, context = "") {
    console.error(
      `${this.serviceName} Service Error${context ? ` (${context})` : ""}:`,
      error
    );

    // Format error for consistent response
    return {
      success: false,
      error: error.message || "Unknown error occurred",
      service: this.serviceName,
      context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Common success response
   */
  handleSuccess(data, context = "") {
    return {
      success: true,
      data,
      service: this.serviceName,
      context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Common configuration error
   */
  throwConfigError(message) {
    throw new Error(`${this.serviceName} Service: ${message}`);
  }

  /**
   * Common validation helper
   */
  validateRequired(params, requiredFields) {
    const missing = requiredFields.filter((field) => !params[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(", ")}`);
    }
  }

  /**
   * Common retry logic
   */
  async withRetry(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        console.warn(
          `${this.serviceName} operation failed (attempt ${attempt}/${maxRetries}):`,
          error.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  /**
   * Common rate limiting helper
   */
  async rateLimit(key, maxRequests = 10, windowMs = 60000) {
    // Simple in-memory rate limiting
    if (!this.rateLimits) {
      this.rateLimits = new Map();
    }

    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, []);
    }

    const requests = this.rateLimits.get(key);
    const recentRequests = requests.filter((time) => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      throw new Error(`Rate limit exceeded for ${key}. Try again later.`);
    }

    recentRequests.push(now);
    this.rateLimits.set(key, recentRequests);
  }
}

/**
 * Base API Service Class
 * For services that make HTTP requests
 */
export class BaseAPIService extends BaseService {
  constructor(serviceName, baseUrl) {
    super(serviceName);
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "User-Agent": "Builder-Credit-Platform",
    };
  }

  /**
   * Common HTTP request method
   */
  async makeRequest(endpoint, options = {}) {
    if (!this.isConfigured()) {
      this.throwConfigError("Service not properly configured");
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP ${response.status}: ${error.message || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  /**
   * Get authentication headers - to be implemented by subclasses
   */
  getAuthHeaders() {
    return {};
  }

  /**
   * Common GET request
   */
  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  /**
   * Common POST request
   */
  async post(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Common PUT request
   */
  async put(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Common DELETE request
   */
  async delete(endpoint) {
    return this.makeRequest(endpoint, {
      method: "DELETE",
    });
  }
}

export default BaseService;
