/**
 * Circle API formatting helpers.
 * Legacy Circle SDK initialization has been removed; use RealCircleService for API access.
 */

export function formatCircleError(error) {
  return {
    success: false,
    error: error.message || 'An error occurred with the Circle API',
    details: error.response?.data || {},
    status: error.response?.status || 500
  };
}

export function formatTokenAmount(amount, tokenSymbol = 'USDC') {
  const decimals = {
    USDC: 6,
    ETH: 18,
    MATIC: 18,
    AVAX: 18,
    ARB: 18
  }[String(tokenSymbol).toUpperCase()] || 6;

  const numericAmount = parseFloat(amount) / Math.pow(10, decimals);
  return numericAmount.toFixed(decimals === 6 ? 2 : 4);
}
