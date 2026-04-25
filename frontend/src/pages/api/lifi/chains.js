/**
 * LiFi Chains Proxy API
 * Server-side proxy to avoid CORS issues when fetching LiFi chains from the browser
 */

import { withApiMiddleware } from '@/utils/apiMiddleware';

async function chainsHandler(req, res) {
  try {
    // Use LiFi's public API (no API key required for basic chain list)
    const response = await fetch('https://li.fi/v1/chains', {
      headers: {
        'Accept': 'application/json',
      },
      // Follow redirects to handle LiFi's routing
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`LiFi API returned ${response.status}`);
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('LiFi chains proxy error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch chains from LiFi',
      details: error.message,
    });
  }
}

export default withApiMiddleware(chainsHandler, {
  allowedMethods: ['GET'],
  rateLimit: 60, // Allow more requests since this is a simple proxy
  rateLimitKey: 'LIFI_CHAINS_API'
});