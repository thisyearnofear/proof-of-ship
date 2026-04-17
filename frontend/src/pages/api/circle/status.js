import { ApiResponse } from "../../../utils/apiResponse";
import { withApiMiddleware } from "../../../utils/apiMiddleware";
import RealCircleService from "../../../services/RealCircleService";

const circleService = new RealCircleService();

async function statusHandler(req, res) {
  try {
    if (!circleService.isConfigured()) {
      return res.status(500).json(
        ApiResponse.error("Circle API not properly configured", "Status Check").toJSON()
      );
    }

    const pingResult = await circleService.ping();

    return res.status(200).json(
      ApiResponse.success({
        ping: pingResult.data?.message || "OK",
        configured: true,
      }, "Circle Status Check").toJSON()
    );
  } catch (error) {
    return res.status(500).json(
      ApiResponse.error(error.message || "Circle API status check failed", "Status Check").toJSON()
    );
  }
}

export default withApiMiddleware(statusHandler, {
  allowedMethods: ["GET"],
  rateLimit: 5,
  rateLimitKey: "CIRCLE_STATUS_API",
});
