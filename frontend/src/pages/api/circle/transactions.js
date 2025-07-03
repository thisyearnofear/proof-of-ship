/**
 * Circle API Transactions Endpoint
 * Handles creating and retrieving wallet transactions
 *
 * Supports:
 * - GET: Retrieve transaction status or list transactions
 * - POST: Create a new transaction
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
 * Main handler for transactions endpoints
 */
async function transactionsHandler(req, res) {
  // Initialize Circle SDK
  const circle = initializeCircleSDK();
  
  // Route based on HTTP method
  if (req.method === 'GET') {
    return await handleGetTransaction(req, res, circle);
  } else if (req.method === 'POST') {
    return await handleCreateTransaction(req, res, circle);
  }
}

/**
 * Handle GET requests for transaction status or listing transactions
 */
async function handleGetTransaction(req, res, circle) {
  // Parse query parameters
  const params = parseQueryParams(req.query, {
    stringParams: ['id', 'walletId', 'from', 'to'],
    numberParams: ['pageSize']
  });
  
  const { id, walletId, from, to, pageSize } = params;
  
  // If transaction ID is provided, get specific transaction
  if (id) {
    try {
      const response = await circle.wallets.getWalletTransaction({ id });
      
      return res.status(200).json({
        success: true,
        data: response.data.data
      });
    } catch (error) {
      const errorResponse = formatCircleError(error);
      return res.status(errorResponse.status).json(errorResponse);
    }
  }
  
  // Otherwise, list transactions with optional filters
  if (!walletId) {
    return res.status(400).json({
      success: false,
      error: 'walletId is required for listing transactions'
    });
  }
  
  try {
    const response = await circle.wallets.listWalletTransactions({
      walletId,
      from: from || undefined,
      to: to || undefined,
      pageSize: pageSize || undefined
    });
    
    return res.status(200).json({
      success: true,
      data: response.data.data
    });
  } catch (error) {
    const errorResponse = formatCircleError(error);
    return res.status(errorResponse.status).json(errorResponse);
  }
}

/**
 * Handle POST requests for creating new transactions
 */
async function handleCreateTransaction(req, res, circle) {
  try {
    // Validate required fields
    validateRequiredFields(req.body, [
      'walletId',
      'tokenId',
      'destinationAddress',
      'amount'
    ]);
    
    const {
      walletId,
      tokenId,
      destinationAddress,
      amount,
      idempotencyKey,
      feeLevel,
      metadata
    } = req.body;
    
    // Create a new transaction
    const response = await circle.wallets.createTransaction({
      idempotencyKey: idempotencyKey || generateIdempotencyKey('tx'),
      tokenId,
      walletId,
      destinationAddress,
      amount: {
        amount,
        currency: 'USD' // Assuming USDC
      },
      feeLevel: feeLevel || 'MEDIUM',
      metadata
    });
    
    return res.status(201).json({
      success: true,
      data: response.data.data
    });
  } catch (error) {
    const errorResponse = formatCircleError(error);
    return res.status(errorResponse.status).json(errorResponse);
  }
}

// Apply API middleware with appropriate configuration
export default withApiMiddleware(transactionsHandler, {
  allowedMethods: ['GET', 'POST'],
  rateLimit: 10,
  rateLimitKey: 'CIRCLE_TRANSACTIONS_API'
});