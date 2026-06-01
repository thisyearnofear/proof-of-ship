/**
 * Client-safe USDC/currency formatting helpers.
 *
 * Extracted from lib/usdcPayments.js so client components can import them
 * without dragging the server-only RealCircleService (firebase-admin)
 * chain into the browser bundle.
 *
 * Keep this file dependency-free — no service, store, or node-only imports.
 */

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatUSDC = (amount) => usdFormatter.format(amount);

export const getFundingTier = (creditScore) => {
  if (creditScore >= 800) return { tier: 'Excellent', color: 'green' };
  if (creditScore >= 700) return { tier: 'Good', color: 'blue' };
  if (creditScore >= 600) return { tier: 'Fair', color: 'yellow' };
  if (creditScore >= 500) return { tier: 'Poor', color: 'orange' };
  return { tier: 'Very Poor', color: 'red' };
};
