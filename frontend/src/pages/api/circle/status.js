/**
 * Circle API Status Check
 * Verifies that Circle API is properly configured and accessible
 */

import { serviceManager } from "../../../services/ServiceManager";
import { ApiResponse } from "../../../utils/apiResponse";
import { withApiMiddleware } from "../../../utils/apiMiddleware";

/**
 * Handler for the status API endpoint
 */
async function statusHandler(req, res) {
  try {
    // Get service status from service manager
    const serviceStatus = serviceManager.getServiceStatus();
    const circleService = serviceManager.getCircleService();

    // Check if Circle service is available
    if (!circleService.isConfigured()) {
      return res
        .status(500)
        .json(
          ApiResponse.error(
            "Circle API not properly configured",
            "Status Check"
          ).toJSON()
        );
    }

    // Test API connection
    const pingResult = await circleService.ping();

    // Return success response with service status
    return res.status(200).json(
      ApiResponse.success(
        {
          serviceStatus: serviceStatus.circle,
          ping: pingResult.data?.message || "OK",
          services: serviceStatus,
        },
        "Circle Status Check"
      ).toJSON()
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        ApiResponse.error(
          error.message || "Circle API status check failed",
          "Status Check"
        ).toJSON()
      );
  }
}

// Apply middleware with GET method only and rate limiting
export default withApiMiddleware(statusHandler, {
  allowedMethods: ["GET"],
  rateLimit: 5,
  rateLimitKey: "CIRCLE_STATUS_API",
});
