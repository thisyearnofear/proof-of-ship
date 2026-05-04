/**
 * FairScore Service
 *
 * Integrates FairScale's Solana reputation API for wallet-level trust signals.
 * Shows backers a pre-commitment trust signal for builders based on real
 * on-chain activity: portfolio flow, capital conviction, tempo, bot-likelihood,
 * diversity, earned badges, and humanity signals.
 *
 * API spec: https://swagger.api.fairscale.xyz
 * Auth: fairkey header
 * Endpoint: GET /score?wallet=<address> on api2.fairscale.xyz
 * Response: fairscore (combined), fairscore_base (wallet-only), social_score,
 *           tier (bronze/silver/gold/platinum), badges, features (15 signals)
 *
 * When FAIRSCALE_API_KEY is set, calls the real API.
 * Otherwise, generates deterministic demo scores from address hash.
 */

const FAIRSCALE_API = 'https://api2.fairscale.xyz';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory cache: address -> { data, timestamp }
const scoreCache = new Map();

// Map FairScale's tier enum to human-readable labels and colors
const TIER_MAP = {
  platinum: { label: 'Excellent', color: 'green' },
  gold:     { label: 'Good', color: 'blue' },
  silver:   { label: 'Neutral', color: 'gray' },
  bronze:   { label: 'Questionable', color: 'orange' },
};

function mapTier(tier) {
  return TIER_MAP[tier] || { label: 'Unknown', color: 'gray' };
}

class FairScoreService {
  constructor() {
    this.apiKey = typeof window === 'undefined'
      ? process.env.FAIRSCALE_API_KEY
      : process.env.NEXT_PUBLIC_FAIRSCALE_API_KEY;
  }

  /**
   * Get FairScore for a single Solana wallet address.
   * @param {string} address - Solana wallet address (base58)
   * @returns {Promise<FairScoreResult>}
   */
  async getScore(address) {
    if (!address) return this._emptyResult(address);

    const cached = scoreCache.get(address);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.data;
    }

    let result;
    if (this.apiKey) {
      result = await this._fetchFromAPI(address);
    } else {
      result = this._generateFromSignals(address);
    }

    scoreCache.set(address, { data: result, ts: Date.now() });
    return result;
  }

  /**
   * Get FairScores for multiple addresses.
   * FairScale has no batch endpoint — parallel individual requests with concurrency cap.
   * @param {string[]} addresses - Array of Solana wallet addresses
   * @returns {Promise<Map<string, FairScoreResult>>}
   */
  async getScores(addresses) {
    const results = new Map();
    const uncached = [];

    for (const addr of addresses) {
      const cached = scoreCache.get(addr);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        results.set(addr, cached.data);
      } else {
        uncached.push(addr);
      }
    }

    if (uncached.length === 0) return results;

    // Parallel fetch with concurrency cap (avoid hammering API)
    const CONCURRENCY = 5;
    for (let i = 0; i < uncached.length; i += CONCURRENCY) {
      const batch = uncached.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(addr => this.apiKey ? this._fetchFromAPI(addr) : this._generateFromSignals(addr))
      );
      for (const r of batchResults) {
        results.set(r.address, r);
        scoreCache.set(r.address, { data: r, ts: Date.now() });
      }
    }

    return results;
  }

  /**
   * Get tier metadata for a score value.
   */
  getTier(score) {
    if (score === null || score === undefined) return { label: 'New', color: 'gray' };
    if (score >= 80) return { label: 'Excellent', color: 'green' };
    if (score >= 60) return { label: 'Good', color: 'blue' };
    if (score >= 40) return { label: 'Neutral', color: 'gray' };
    if (score >= 20) return { label: 'Questionable', color: 'orange' };
    return { label: 'Untrustworthy', color: 'red' };
  }

  /**
   * Clear the score cache.
   */
  clearCache() {
    scoreCache.clear();
  }

  /**
   * Fetch complete score from FairScale API.
   * GET /score?wallet=<address> with fairkey header.
   * @private
   */
  async _fetchFromAPI(address) {
    try {
      const url = `${FAIRSCALE_API}/score?wallet=${encodeURIComponent(address)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'fairkey': this.apiKey },
      });

      if (!res.ok) {
        console.warn(`[FairScale] API returned ${res.status}`);
        return this._generateFromSignals(address);
      }

      const data = await res.json();

      // FairScale returns: fairscore, fairscore_base, social_score, tier, badges, features
      const score = data.fairscore ?? data.fair_score ?? null;
      const tierMeta = mapTier(data.tier);

      return {
        address,
        score: score !== null ? Math.round(score) : null,
        tier: tierMeta.label,
        tierColor: tierMeta.color,
        fairscoreBase: data.fairscore_base ?? null,
        socialScore: data.social_score ?? null,
        badges: Array.isArray(data.badges) ? data.badges : [],
        features: data.features || null,
        isDemo: false,
      };
    } catch (err) {
      console.warn('[FairScale] API call failed:', err.message);
      return this._generateFromSignals(address);
    }
  }

  /**
   * Generate a score from address hash — deterministic demo/fallback.
   * @private
   */
  _generateFromSignals(address) {
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = ((hash << 5) - hash + address.charCodeAt(i)) | 0;
    }
    const absHash = Math.abs(hash);

    const score = 40 + (absHash % 46);
    const tier = this.getTier(score);

    return {
      address,
      score,
      tier: tier.label,
      tierColor: tier.color,
      fairscoreBase: null,
      socialScore: null,
      badges: [],
      features: null,
      isDemo: true,
    };
  }

  /**
   * Empty result for null/invalid addresses.
   * @private
   */
  _emptyResult(address) {
    return {
      address: address || '',
      score: null,
      tier: 'Unknown',
      tierColor: 'gray',
      fairscoreBase: null,
      socialScore: null,
      badges: [],
      features: null,
      isDemo: true,
    };
  }
}

const fairScoreService = new FairScoreService();
export default fairScoreService;
