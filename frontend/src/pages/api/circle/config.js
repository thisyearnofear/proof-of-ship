/**
 * Circle API Configuration Endpoint
 * Provides wallet configuration for frontend applications
 *
 * IMPORTANT: This endpoint securely provides configuration without exposing API keys
 */

import { getCircleEnvironment } from '../../../utils/circleApi';
import { withApiMiddleware } from '../../../utils/apiMiddleware';

/**
 * Handler for the configuration API endpoint
 */
async function configHandler(req, res) {
  // Get required configuration
  const apiKey = process.env.CIRCLE_API_KEY;
  const { walletSetId, entitySecret, environment, isProduction } = getCircleEnvironment();
  
  // Check for required configuration
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'Circle API key not configured'
    });
  }
  
  if (!walletSetId) {
    return res.status(500).json({
      success: false,
      error: 'Circle Wallet Set ID not configured'
    });
  }
  
  // Entity secret is optional but recommended
  const warnings = [];
  if (!entitySecret) {
    warnings.push('Circle Entity Secret not configured');
  }
  
  // Get supported tokens and blockchains from environment if available
  const supportedTokens = process.env.CIRCLE_SUPPORTED_TOKENS
    ? process.env.CIRCLE_SUPPORTED_TOKENS.split(',')
    : ['USDC', 'ETH', 'MATIC'];
    
  const supportedBlockchains = process.env.CIRCLE_SUPPORTED_BLOCKCHAINS
    ? process.env.CIRCLE_SUPPORTED_BLOCKCHAINS.split(',')
    : ['ETH', 'MATIC', 'AVAX', 'ARB'];
  
  // Prepare configuration for frontend
  // Note: We don't send API keys to the frontend
  const config = {
    walletSetId,
    entitySecretCiphertext: entitySecret,
    environment,
    supportedTokens,
    supportedBlockchains,
    tokenInfo: {
      USDC: {
        name: 'USD Coin',
        decimals: 6,
        chains: ['ETH', 'MATIC', 'AVAX', 'ARB'],
        isStablecoin: true
      },
      ETH: {
        name: 'Ethereum',
        decimals: 18,
        chains: ['ETH']
      },
      MATIC: {
        name: 'Polygon',
        decimals: 18,
        chains: ['MATIC']
      }
    },
    lastUpdated: new Date().toISOString()
  };
  
  // Add developerMode flag for non-production environments
  if (!isProduction) {
    config.developerMode = true;
  }
  
  // Return success response with environment status
  return res.status(200).json({
    success: true,
    data: config,
    warnings: warnings.length > 0 ? warnings : undefined
  });
}

// Apply API middleware with appropriate configuration
export default withApiMiddleware(configHandler, {
  allowedMethods: ['GET'],
  rateLimit: 5,
  rateLimitKey: 'CIRCLE_CONFIG_API'
});