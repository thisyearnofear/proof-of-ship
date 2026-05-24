/**
 * Circle API Configuration Endpoint
 * Provides wallet configuration for frontend applications
 */

import { realCircleService } from '../../../services/RealCircleService';
import { withApiMiddleware } from '../../../utils/apiMiddleware';

async function configHandler(req, res) {
  const { walletSetId, environment, configured, clientConfigured } = realCircleService.getConfig().data;

  if (!clientConfigured) {
    return res.status(500).json({
      success: false,
      error: 'Circle client not configured'
    });
  }

  const supportedTokens = process.env.CIRCLE_SUPPORTED_TOKENS
    ? process.env.CIRCLE_SUPPORTED_TOKENS.split(',')
    : ['USDC', 'ETH', 'MATIC'];

  const supportedBlockchains = process.env.CIRCLE_SUPPORTED_BLOCKCHAINS
    ? process.env.CIRCLE_SUPPORTED_BLOCKCHAINS.split(',')
    : ['ARC', 'ETH', 'MATIC', 'AVAX', 'ARB'];

  const warnings = [];
  if (!walletSetId) {
    warnings.push('Circle Wallet Set ID not configured');
  }

  const config = {
    walletSetId,
    entitySecretConfigured: !!process.env.CIRCLE_ENTITY_SECRET,
    environment,
    configured,
    clientConfigured,
    supportedTokens,
    supportedBlockchains,
    tokenInfo: {
      USDC: {
        name: 'USD Coin',
        decimals: 6,
        chains: ['ARC', 'ETH', 'MATIC', 'AVAX', 'ARB'],
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
    lastUpdated: new Date().toISOString(),
    developerMode: environment !== 'production'
  };

  return res.status(200).json({
    success: true,
    data: config,
    warnings: warnings.length > 0 ? warnings : undefined
  });
}

export default withApiMiddleware(configHandler, {
  allowedMethods: ['GET'],
  rateLimit: 60,
  rateLimitKey: 'CIRCLE_CONFIG_API'
});
