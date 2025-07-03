/**
 * Circle API Wallets Endpoint
 * Handles wallets creation and management
 *
 * Supports:
 * - GET: List wallets or get a specific wallet
 * - POST: Create new wallets
 */

import {
  initializeCircleSDK,
  formatCircleError,
  generateIdempotencyKey
} from '../../../utils/circleApi';

import {
  withApiMiddleware,
  validateRequiredFields,
  parseQueryParams
} from '../../../utils/apiMiddleware';

/**
 * Main handler for wallets endpoints
 */
async function walletsHandler(req, res) {
  // Initialize Circle SDK
  const circle = initializeCircleSDK();
  
  // Route based on HTTP method
  if (req.method === 'GET') {
    return await handleGetWallets(req, res, circle);
  } else if (req.method === 'POST') {
    return await handleCreateWallets(req, res, circle);
  }
}

/**
 * Handle GET requests for listing wallets or getting a specific wallet
 */
async function handleGetWallets(req, res, circle) {
  // Parse query parameters
  const params = parseQueryParams(req.query, {
    stringParams: ['id', 'walletSetId', 'from', 'to', 'pageAfter'],
    numberParams: ['pageSize']
  });
  
  const { id, walletSetId, from, to, pageSize, pageAfter } = params;
  
  // If a specific wallet ID is requested
  if (id) {
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
  
  // Otherwise, list wallets with optional filters
  try {
    const response = await circle.wallets.listWallets({
      walletSetId,
      from: from || undefined,
      to: to || undefined,
      pageSize: pageSize || undefined,
      pageAfter: pageAfter || undefined
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
 * Handle POST requests for creating new wallets
 */
async function handleCreateWallets(req, res, circle) {
  try {
    // Get environment config for default wallet set ID
    const defaultWalletSetId = process.env.CIRCLE_WALLET_SET_ID;
    
    // Validate required fields - walletSetId is optional if available in env
    const requiredFields = ['idempotencyKey'];
    if (!defaultWalletSetId) {
      requiredFields.push('walletSetId');
    }
    
    validateRequiredFields(req.body, requiredFields);
    
    const {
      idempotencyKey,
      walletSetId,
      entitySecretCiphertext,
      blockchains,
      count,
      metadata
    } = req.body;
    
    // Create wallets
    const response = await circle.wallets.createWallets({
      idempotencyKey: idempotencyKey || generateIdempotencyKey('wallet'),
      walletSetId: walletSetId || defaultWalletSetId,
      entitySecretCiphertext: entitySecretCiphertext || process.env.CIRCLE_ENTITY_SECRET,
      blockchains: blockchains || ['ETH'],
      count: count || 1,
      metadata
    });
    
    return res.status(201).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    const errorResponse = formatCircleError(error);
    return res.status(errorResponse.status).json(errorResponse);
  }
}

// Apply API middleware with appropriate configuration
export default withApiMiddleware(walletsHandler, {
  allowedMethods: ['GET', 'POST'],
  rateLimit: 10,
  rateLimitKey: 'CIRCLE_WALLETS_API'
});