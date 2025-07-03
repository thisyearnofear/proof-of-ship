/**
 * Global error handling middleware and utilities
 */

import config from '@/config/environment';

// Error types for better categorization
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR', 
  AUTHENTICATION: 'AUTH_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER_ERROR',
  CLIENT: 'CLIENT_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class ErrorHandler {
  constructor() {
    this.errorReports = [];
    this.maxReports = 100;
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    if (typeof window !== 'undefined') {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason, {
          type: ERROR_TYPES.CLIENT,
          severity: ERROR_SEVERITY.HIGH,
          context: 'unhandledrejection'
        });
      });

      // Handle uncaught errors
      window.addEventListener('error', (event) => {
        this.handleError(event.error, {
          type: ERROR_TYPES.CLIENT,
          severity: ERROR_SEVERITY.HIGH,
          context: 'uncaught error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });
    }
  }

  /**
   * Central error handling method
   */
  handleError(error, options = {}) {
    const {
      type = ERROR_TYPES.CLIENT,
      severity = ERROR_SEVERITY.MEDIUM,
      context = 'unknown',
      silent = false,
      retryable = false,
      userId = null,
      metadata = {}
    } = options;

    const errorReport = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      error: this.serializeError(error),
      type,
      severity,
      context,
      retryable,
      userId,
      metadata: {
        ...metadata,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        url: typeof window !== 'undefined' ? window.location.href : null,
        environment: config.isProduction ? 'production' : 'development'
      }
    };

    // Store error report
    this.errorReports.unshift(errorReport);
    if (this.errorReports.length > this.maxReports) {
      this.errorReports.pop();
    }

    // Log in development
    if (!config.isProduction && !silent) {
      console.group(`🚨 Error [${severity.toUpperCase()}] - ${type}`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Metadata:', metadata);
      console.log('Full Report:', errorReport);
      console.groupEnd();
    }

    // Send to monitoring service in production
    if (config.isProduction && config.features.enableErrorReporting) {
      this.reportToMonitoring(errorReport);
    }

    return errorReport;
  }

  /**
   * Handle API errors specifically
   */
  handleApiError(response, context = 'api') {
    let type = ERROR_TYPES.SERVER;
    let severity = ERROR_SEVERITY.MEDIUM;

    if (response.status >= 400 && response.status < 500) {
      type = ERROR_TYPES.CLIENT;
      if (response.status === 401) type = ERROR_TYPES.AUTHENTICATION;
      if (response.status === 403) type = ERROR_TYPES.AUTHORIZATION;
      if (response.status === 404) type = ERROR_TYPES.NOT_FOUND;
      if (response.status === 429) type = ERROR_TYPES.RATE_LIMIT;
    }

    if (response.status >= 500) {
      severity = ERROR_SEVERITY.HIGH;
    }

    const error = new Error(`API Error: ${response.status} ${response.statusText}`);
    
    return this.handleError(error, {
      type,
      severity,
      context: `${context} - ${response.url}`,
      retryable: response.status >= 500 || response.status === 429,
      metadata: {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      }
    });
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error, context = 'network') {
    return this.handleError(error, {
      type: ERROR_TYPES.NETWORK,
      severity: ERROR_SEVERITY.MEDIUM,
      context,
      retryable: true,
      metadata: {
        name: error.name,
        code: error.code
      }
    });
  }

  /**
   * Handle validation errors
   */
  handleValidationError(errors, context = 'validation') {
    const error = new Error(`Validation failed: ${Array.isArray(errors) ? errors.join(', ') : errors}`);
    
    return this.handleError(error, {
      type: ERROR_TYPES.VALIDATION,
      severity: ERROR_SEVERITY.LOW,
      context,
      retryable: false,
      metadata: {
        validationErrors: errors
      }
    });
  }

  /**
   * Serialize error for reporting
   */
  serializeError(error) {
    if (!error) return null;

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      // Capture additional properties
      ...Object.getOwnPropertyNames(error).reduce((acc, key) => {
        if (!['name', 'message', 'stack', 'code'].includes(key)) {
          acc[key] = error[key];
        }
        return acc;
      }, {})
    };
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Report to external monitoring service
   */
  reportToMonitoring(errorReport) {
    try {
      // Report to Google Analytics if available
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'exception', {
          description: errorReport.error.message,
          fatal: errorReport.severity === ERROR_SEVERITY.CRITICAL,
          error_type: errorReport.type,
          error_context: errorReport.context
        });
      }

      // Here you could add other monitoring services like Sentry, LogRocket, etc.
      // Example:
      // if (window.Sentry) {
      //   window.Sentry.captureException(errorReport.error, {
      //     level: errorReport.severity,
      //     tags: { type: errorReport.type, context: errorReport.context },
      //     extra: errorReport.metadata
      //   });
      // }
    } catch (reportingError) {
      console.error('Failed to report error to monitoring:', reportingError);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorReports.length,
      byType: {},
      bySeverity: {},
      recent: this.errorReports.slice(0, 10)
    };

    this.errorReports.forEach(report => {
      stats.byType[report.type] = (stats.byType[report.type] || 0) + 1;
      stats.bySeverity[report.severity] = (stats.bySeverity[report.severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error reports
   */
  clearReports() {
    this.errorReports = [];
  }

  /**
   * Create user-friendly error message
   */
  getUserMessage(errorReport) {
    const { type, error } = errorReport;

    switch (type) {
      case ERROR_TYPES.NETWORK:
        return "Unable to connect to the server. Please check your internet connection and try again.";
      
      case ERROR_TYPES.AUTHENTICATION:
        return "You need to sign in to access this feature.";
      
      case ERROR_TYPES.AUTHORIZATION:
        return "You don't have permission to perform this action.";
      
      case ERROR_TYPES.NOT_FOUND:
        return "The requested resource could not be found.";
      
      case ERROR_TYPES.RATE_LIMIT:
        return "Too many requests. Please wait a moment and try again.";
      
      case ERROR_TYPES.VALIDATION:
        return error.message || "Please check your input and try again.";
      
      case ERROR_TYPES.TIMEOUT:
        return "The request timed out. Please try again.";
      
      default:
        return "Something went wrong. Please try again or contact support if the problem persists.";
    }
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

// React hook for error handling
import { useCallback } from 'react';

export const useErrorHandler = () => {
  const handleError = useCallback((error, options = {}) => {
    return errorHandler.handleError(error, options);
  }, []);

  const handleApiError = useCallback((response, context) => {
    return errorHandler.handleApiError(response, context);
  }, []);

  const handleNetworkError = useCallback((error, context) => {
    return errorHandler.handleNetworkError(error, context);
  }, []);

  const handleValidationError = useCallback((errors, context) => {
    return errorHandler.handleValidationError(errors, context);
  }, []);

  const getUserMessage = useCallback((errorReport) => {
    return errorHandler.getUserMessage(errorReport);
  }, []);

  return {
    handleError,
    handleApiError,
    handleNetworkError,
    handleValidationError,
    getUserMessage,
    getErrorStats: () => errorHandler.getErrorStats()
  };
};

export default errorHandler;
