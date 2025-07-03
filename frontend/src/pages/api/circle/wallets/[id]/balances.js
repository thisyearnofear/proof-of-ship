/**
 * Circle API Wallet Balances Endpoint
 * Retrieves token balances for a specific wallet
 *
 * Supports:
 * - GET: Get token balances for a specific wallet
 */

import {
  initializeCircleSDK,
  formatCircleError,
  formatTokenAmount
} from '../../../../../utils/circleApi';

import {
  withApiMiddleware,
  parseQueryParams
} from '../../../../../utils/apiMiddleware';

/**
 * Handler for the wallet balances endpoint
 */
async function walletBalancesHandler(req, res) {
  // Get wallet ID from the request URL
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Wallet ID is required'
    });
  }
  
  // Parse other query parameters
  const params = parseQueryParams(req.query, {
    stringParams: ['tokenId']
  });
  
  // Initialize Circle SDK
  const circle = initializeCircleSDK();
  
  try {
    // Get balances for this wallet
    const response = await circle.wallets.listWalletBalances({
      walletId: id,
      ...(params.tokenId ? { tokenId: params.tokenId } : {})
    });
    
    if (!response.data) {
      throw new Error('Invalid response from Circle API');
    }
    
    // Format the balances to include additional information
    const balances = response.data.balances || [];
    
    // Add formatted amounts and additional display information
    const formattedBalances = balances.map(balance => {
      // Get token symbol
      const symbol = balance.token?.symbol || 'UNKNOWN';
      
      // Calculate display amount using our utility function
      const amount = balance.amount || '0';
      const displayAmount = formatTokenAmount(amount, symbol);
      
      return {
        ...balance,
        displayAmount,
        formattedAmount: `${displayAmount} ${symbol}`,
        blockchain: balance.blockchain || 'ETH'
      };
    });
    
    // Calculate total balances
    const totalBalances = formattedBalances.reduce((acc, balance) => {
      // Group by currency
      const symbol = balance.token?.symbol || 'UNKNOWN';
      if (!acc[symbol]) {
        acc[symbol] = 0;
      }
      acc[symbol] += parseFloat(balance.displayAmount || 0);
      return acc;
    }, {});
    
    return res.status(200).json({
      success: true,
      data: {
        walletId: id,
        balances: formattedBalances,
        totalBalances,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const errorResponse = formatCircleError(error);
    return res.status(errorResponse.status).json(errorResponse);
  }
}

// Apply API middleware with appropriate configuration
export default withApiMiddleware(walletBalancesHandler, {
  allowedMethods: ['GET'],
  rateLimit: 20,
  rateLimitKey: 'CIRCLE_WALLET_BALANCES_API'
});