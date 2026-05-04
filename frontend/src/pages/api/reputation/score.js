/**
 * Reputation Score API
 *
 * GET /api/reputation/score?address=<solana_address>
 * POST /api/reputation/score { addresses: string[] }
 *
 * Returns FairScale reputation data for Solana wallet addresses.
 * Single address returns a single result; POST with array returns batch results.
 * Uses FairScale Human Score API when FAIRSCALE_API_KEY is set,
 * falls back to deterministic demo scores otherwise.
 *
 * Tracks: Solana ecosystem reputation infrastructure
 */

import fairScoreService from '../../../services/FairScoreService';
import { withApiMiddleware } from '../../../utils/apiMiddleware';

async function handler(req, res) {
  const { method, query, body } = req;

  try {
    if (method === 'GET') {
      const address = (query.address || '').trim();

      if (!address) {
        return res.status(400).json({ error: 'Missing address parameter' });
      }

      if (address.length < 32 || address.length > 44) {
        return res.status(400).json({ error: 'Invalid Solana address' });
      }

      const result = await fairScoreService.getScore(address);
      return res.status(200).json({ result });
    }

    if (method === 'POST') {
      const addresses = body?.addresses;

      if (!Array.isArray(addresses) || addresses.length === 0) {
        return res.status(400).json({ error: 'Missing addresses array' });
      }

      const valid = addresses
        .filter(a => typeof a === 'string' && a.length >= 32 && a.length <= 44)
        .slice(0, 25);

      if (valid.length === 0) {
        return res.status(400).json({ error: 'No valid Solana addresses' });
      }

      const results = await fairScoreService.getScores(valid);
      const obj = {};
      for (const [k, v] of results) {
        obj[k] = v;
      }
      return res.status(200).json({ results: obj });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[Reputation API] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withApiMiddleware(handler, {
  allowedMethods: ['GET', 'POST'],
  rateLimit: 30,
  rateLimitKey: 'REPUTATION_SCORE',
});
