/**
 * Circle API Single Wallet Endpoint
 * Handles operations on a specific wallet by ID using RealCircleService
 */

import { realCircleService } from '../../../../services/RealCircleService';
import {
  withApiMiddleware,
  validateRequiredFields
} from '../../../../utils/apiMiddleware';

async function singleWalletHandler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Wallet ID is required'
    });
  }

  if (req.method === 'GET') {
    return handleGetWallet(res, id);
  }

  if (req.method === 'PATCH') {
    return handleUpdateWallet(req, res, id);
  }

  if (req.method === 'DELETE') {
    return handleDeleteWallet(res);
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGetWallet(res, id) {
  try {
    const response = await realCircleService.getWalletById(id);
    return res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get wallet'
    });
  }
}

async function handleUpdateWallet(req, res, id) {
  try {
    validateRequiredFields(req.body, ['metadata']);
    return res.status(501).json({
      success: false,
      error: 'Wallet metadata updates are not supported by RealCircleService yet',
      data: { walletId: id, metadata: req.body.metadata }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update wallet metadata'
    });
  }
}

async function handleDeleteWallet(res) {
  return res.status(501).json({
    success: false,
    error: 'Wallet deletion is not supported'
  });
}

export default withApiMiddleware(singleWalletHandler, {
  allowedMethods: ['GET', 'PATCH', 'DELETE'],
  rateLimit: 10,
  rateLimitKey: 'CIRCLE_SINGLE_WALLET_API'
});
