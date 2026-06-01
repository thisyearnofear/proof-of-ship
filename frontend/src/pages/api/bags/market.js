/**
 * Bags Market API Proxy
 *
 * Server-side proxy for Bags SDK state data.
 * Uses the server-side API key (BAGS_SERVER_API_KEY) if available,
 * falls back to mock data for development.
 *
 * GET /api/bags/market?mint=<tokenMint>
 * Response: { lifetimeFees, creators, claimEvents }
 */

/**
 * Fetch live Bags token data via the SDK (imported dynamically).
 * Falls back to empty data if the SDK is unavailable.
 */
async function fetchBagsData(mint, apiKey, rpcUrl) {
  const { PublicKey } = await import('@solana/web3.js');
  const { getSolanaConnection } = await import('@/lib/chains/solanaConnection');

  let mintPubkey;
  try {
    mintPubkey = new PublicKey(mint);
  } catch {
    return { error: 'Invalid mint address' };
  }

  const connection = getSolanaConnection({ rpcUrl });

  // Dynamic import — the SDK is ESM-only but Next.js handles this
  const { BagsSDK } = await import('@bagsfm/bags-sdk');
  const sdk = new BagsSDK(apiKey, connection);

  const [lifetimeFees, creators, claimEvents] = await Promise.all([
    sdk.state.getTokenLifetimeFees(mintPubkey).catch(() => null),
    sdk.state.getTokenCreators(mintPubkey).catch(() => []),
    sdk.state.getTokenClaimEvents(mintPubkey, { limit: 10 }).catch(() => []),
  ]);

  return { lifetimeFees, creators, claimEvents };
}

export default async function handler(req, res) {
  const { mint } = req.query;

  if (!mint) {
    return res.status(400).json({ error: 'Mint required' });
  }

  const apiKey = process.env.BAGS_SERVER_API_KEY || process.env.NEXT_PUBLIC_BAGS_API_KEY;
  const rpcUrl = process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

  if (!apiKey) {
    // Return empty data gracefully
    return res.status(200).json({
      lifetimeFees: null,
      creators: [],
      claimEvents: [],
      _note: 'Bags SDK not configured',
    });
  }

  try {
    const data = await fetchBagsData(mint, apiKey, rpcUrl);

    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Bags market data fetch error:', error.message);
    // Return empty data instead of failing — the UI handles null gracefully
    return res.status(200).json({
      lifetimeFees: null,
      creators: [],
      claimEvents: [],
    });
  }
}
