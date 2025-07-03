/**
 * Circle API Single Wallet Endpoint
 * Handles operations on a specific wallet by ID
 *
 * Supports:
 * - GET: Get a specific wallet by ID
 * - PATCH: Update wallet metadata
 * - DELETE: Delete a wallet (if supported by Circle API)
 */

import {
  initializeCircleSDK,
  formatCircleError
} from '../../../../utils/circleApi';

import {
  withApiMiddleware,
  validateRequiredFields
} from '../../../../utils/apiMiddleware';

/**
 * Main handler for single wallet operations
 */
async function singleWalletHandler(req, res) {
  // Get wallet ID from the request URL
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Wallet ID is required'
    });
  }
  
  // Initialize Circle SDK
  const circle = initializeCircleSDK();
  
  // Route based on HTTP method
  if (req.method === 'GET') {
    return await handleGetWallet(req, res, circle, id);
  } else if (req.method === 'PATCH') {
    return await handleUpdateWallet(req, res, circle, id);
  } else if (req.method === 'DELETE') {
    return await handleDeleteWallet(req, res, circle, id);
  }
}

/**
 * Handle GET request for a specific wallet
 */
async function handleGetWallet(req, res, circle, id) {
  try {
    const response = await circle.wallets.getWallet({ id });
    
    return res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    const errorResponse = formatCircleError(error);
    return res.status(errorResponse.status).json(errorResponse);
  }
}

/**
 * Handle PATCH request to update wallet metadata
 */
async function handleUpdateWallet(req, res, circle, id) {
  try {
    validateRequiredFields(req.body, ['metadata']);
    
    const { metadata } = req.body;
    
    const response = await circle.wallets.updateWalletMetadata({
      walletId: id,
      metadata
    });
    
    return res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    const errorResponse = formatCircleError(error);
    return res.status(errorResponse.status).json(errorResponse);
  }
}

/**
 * Handle DELETE request to delete a wallet
 * Note: This may not be supported by Circle API in all environments
 */
async function handleDeleteWallet(req, res, circle, id) {
  try {
    // Check if deletion is supported in the current environment
    // This is a safety check as wallet deletion may have significant consequences
    
    // For now, we'll return a not implemented response
    // If Circle API supports wallet deletion in the future, this can be updated
    return res.status(501).json({
      success: false,
      error: 'Wallet deletion is not supported'
    });
    
    // If Circle adds wallet deletion support, implementation would look like:
    /*
    const response = await circle.wallets.deleteWallet({
      id
    });
    
    return res.status(200).json({
      success: true,
      data: response.data
    });
    */
  } catch (error) {
    const errorResponse = formatCircleError(error);
    return res.status(errorResponse.status).json(errorResponse);
  }
}

// Apply API middleware with appropriate configuration
export default withApiMiddleware(singleWalletHandler, {
  allowedMethods: ['GET', 'PATCH', 'DELETE'],
  rateLimit: 10,
  rateLimitKey: 'CIRCLE_SINGLE_WALLET_API'
});