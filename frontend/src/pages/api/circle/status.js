/**
 * Circle API Status Check
 * Verifies that Circle API is properly configured and accessible
 */

import { initializeCircleSDK, formatCircleError, getCircleEnvironment } from '../../../utils/circleApi';
import { withApiMiddleware } from '../../../utils/apiMiddleware';

/**
 * Handler for the status API endpoint
 */
async function statusHandler(req, res) {
  // Check if API key is configured
  const apiKey = process.env.CIRCLE_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'Circle API key not configured',
      details: {
        apiKeyConfigured: false
      }
    });
  }
  
  // Get environment configuration
  const { environment, walletSetId, entitySecret } = getCircleEnvironment();
  
  // Test API connection by making a lightweight API call
  try {
    // Initialize Circle SDK
    const circle = initializeCircleSDK();
    
    // Make a test API call to check connectivity
    const pingResponse = await circle.ping.ping();
    
    // Return success response with environment status
    return res.status(200).json({
      success: true,
      data: {
        apiKeyConfigured: true,
        walletSetConfigured: !!walletSetId,
        entitySecretConfigured: !!entitySecret,
        environment,
        ping: pingResponse?.data?.message || 'OK',
        timestamp: new Date().toISOString()
      }
    });
  } catch (apiError) {
    // Format the API error
    const errorResponse = formatCircleError(apiError);
    
    // Add additional context for status endpoint
    errorResponse.details = {
      ...errorResponse.details,
      apiKeyConfigured: true,
      walletSetConfigured: !!walletSetId,
      entitySecretConfigured: !!entitySecret,
      environment
    };
    
    return res.status(errorResponse.status).json(errorResponse);
  }
}

// Apply middleware with GET method only and rate limiting
export default withApiMiddleware(statusHandler, {
  allowedMethods: ['GET'],
  rateLimit: 5,
  rateLimitKey: 'CIRCLE_STATUS_API'
});