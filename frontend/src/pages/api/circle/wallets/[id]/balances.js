/**
 * Circle API Wallet Balances Endpoint
 * Retrieves token balances for a specific wallet using RealCircleService (W3S)
 */

import { realCircleService } from '../../../../../services/RealCircleService';
import {
  withApiMiddleware,
  parseQueryParams
} from '../../../../../utils/apiMiddleware';

async function walletBalancesHandler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Wallet ID is required'
    });
  }

  const params = parseQueryParams(req.query, {
    stringParams: ['tokenId']
  });

  try {
    const response = await realCircleService.getWalletBalances(id);
    const rawBalances = response.data?.tokenBalances || response.data?.balances || [];

    const filteredBalances = params.tokenId
      ? rawBalances.filter(balance => balance.token?.id === params.tokenId || balance.tokenId === params.tokenId)
      : rawBalances;

    const formattedBalances = filteredBalances.map(balance => {
      const symbol = balance.token?.symbol || balance.symbol || 'UNKNOWN';
      const amount = balance.amount || balance.balance || '0';
      // USDC has 6 decimals; ETH/MATIC have 18
      const decimals = symbol === 'USDC' ? 6 : 18;
      const numericAmount = parseFloat(amount) / Math.pow(10, decimals);
      const displayAmount = numericAmount.toFixed(decimals === 6 ? 2 : 4);

      return {
        ...balance,
        displayAmount,
        formattedAmount: `${displayAmount} ${symbol}`,
        blockchain: balance.blockchain || balance.chain || 'ETH'
      };
    });

    const totalBalances = formattedBalances.reduce((acc, balance) => {
      const symbol = balance.token?.symbol || balance.symbol || 'UNKNOWN';
      if (!acc[symbol]) acc[symbol] = 0;
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
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get wallet balances'
    });
  }
}

export default withApiMiddleware(walletBalancesHandler, {
  allowedMethods: ['GET'],
  rateLimit: 20,
  rateLimitKey: 'CIRCLE_WALLET_BALANCES_API'
});
