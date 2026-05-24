/**
 * Circle API Transactions Endpoint
 * Handles creating and retrieving wallet transactions
 * Migrated from @circle-fin/circle-sdk to RealCircleService (W3S)
 *
 * Supports:
 * - GET: Retrieve transaction status
 * - POST: Create a new transaction
 */

import { realCircleService } from "../../../services/RealCircleService";
import {
  withApiMiddleware,
  validateRequiredFields,
  parseQueryParams
} from "../../../utils/apiMiddleware";

/**
 * Main handler for transactions endpoints
 */
async function transactionsHandler(req, res) {
  if (req.method === 'GET') {
    return await handleGetTransaction(req, res);
  } else if (req.method === 'POST') {
    return await handleCreateTransaction(req, res);
  }
}

/**
 * Handle GET requests for transaction status
 */
async function handleGetTransaction(req, res) {
  const params = parseQueryParams(req.query, {
    stringParams: ['id'],
  });

  const { id } = params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Transaction id is required'
    });
  }

  try {
    const result = await realCircleService.getTransactionStatus(id);

    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get transaction'
    });
  }
}

/**
 * Handle POST requests for creating new transactions
 */
async function handleCreateTransaction(req, res) {
  try {
    validateRequiredFields(req.body, [
      'walletId',
      'destinationAddress',
      'amount'
    ]);

    const {
      walletId,
      tokenId,
      destinationAddress,
      amount,
      feeLevel,
      contractAddress,
      calldata,
    } = req.body;

    const result = await realCircleService.createTransaction({
      walletId,
      tokenId,
      destinationAddress,
      amount,
      feeLevel,
      contractAddress,
      calldata,
    });

    return res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create transaction'
    });
  }
}

// Apply API middleware with appropriate configuration
export default withApiMiddleware(transactionsHandler, {
  allowedMethods: ['GET', 'POST'],
  rateLimit: 10,
  rateLimitKey: 'CIRCLE_TRANSACTIONS_API'
});