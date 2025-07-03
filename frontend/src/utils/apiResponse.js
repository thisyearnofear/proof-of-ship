/**
 * API Response Handler
 * Centralized response formatting and error handling
 */

import { getTimestamp } from "./common";

export class ApiResponse {
  constructor(success = false, data = null, error = null, context = "") {
    this.success = success;
    this.data = data;
    this.error = error;
    this.context = context;
    this.timestamp = getTimestamp();
  }

  static success(data, context = "") {
    return new ApiResponse(true, data, null, context);
  }

  static error(error, context = "") {
    const errorMessage = error instanceof Error ? error.message : error;
    return new ApiResponse(false, null, errorMessage, context);
  }

  static fromServiceResponse(response, context = "") {
    if (response.success) {
      return ApiResponse.success(response.data, context);
    } else {
      return ApiResponse.error(response.error, context);
    }
  }

  toJSON() {
    return {
      success: this.success,
      data: this.data,
      error: this.error,
      context: this.context,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Standardized API endpoint wrapper
 */
export const withApiResponse = (handler) => {
  return async (req, res) => {
    try {
      const result = await handler(req, res);

      if (result instanceof ApiResponse) {
        return res.status(result.success ? 200 : 500).json(result.toJSON());
      }

      // If handler returns a direct response, assume it's handled
      return result;
    } catch (error) {
      console.error("API Handler Error:", error);

      const errorResponse = ApiResponse.error(
        error.message || "Internal server error",
        "API Handler"
      );

      return res.status(500).json(errorResponse.toJSON());
    }
  };
};

/**
 * Create consistent error responses
 */
export const createErrorResponse = (error, context = "", statusCode = 500) => {
  const response = ApiResponse.error(error, context);
  return {
    response,
    statusCode,
  };
};

/**
 * Create consistent success responses
 */
export const createSuccessResponse = (data, context = "", statusCode = 200) => {
  const response = ApiResponse.success(data, context);
  return {
    response,
    statusCode,
  };
};

/**
 * Validate API request body
 */
export const validateRequestBody = (body, requiredFields = []) => {
  const missing = requiredFields.filter((field) => !body[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }

  return true;
};

/**
 * Validate API query parameters
 */
export const validateQueryParams = (query, requiredParams = []) => {
  const missing = requiredParams.filter((param) => !query[param]);

  if (missing.length > 0) {
    throw new Error(`Missing required query parameters: ${missing.join(", ")}`);
  }

  return true;
};

/**
 * Parse and validate pagination parameters
 */
export const parsePaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 100); // Max 100 items per page
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
};

/**
 * Create paginated response
 */
export const createPaginatedResponse = (data, pagination, totalCount) => {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

export default ApiResponse;
