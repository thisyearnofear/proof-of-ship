/**
 * FairScore Service
 *
 * Integrates FairScale's Solana reputation API for wallet-level trust signals.
 * Shows backers a pre-commitment trust signal for builders based on real
 * on-chain activity.
 *
 * API spec: https://swagger.api.fairscale.xyz
 * Endpoint: GET /score?wallet=<address> on api2.fairscale.xyz
 * Response: fairscore (combined), fairscore_base (wallet-only), social_score,
 *           tier (bronze/silver/gold/platinum), badges, features (15 signals)
 */

const FAIRSCALE_API = 'https://api2.fairscale.xyz';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry {
  data: FairScoreResult;
  ts: number;
}

const scoreCache = new Map<string, CacheEntry>();

interface TierMeta {
  label: string;
  color: string;
}

export interface FairScoreResult {
  address: string;
  score: number | null;
  tier: string;
  tierColor: string;
  fairscoreBase: number | null;
  socialScore: number | null;
  badges: string[];
  features: Record<string, any> | null;
  isDemo: boolean;
}

interface FairScaleApiResponse {
  fairscore?: number;
  fair_score?: number;
  fairscore_base?: number;
  social_score?: number;
  tier?: string;
  badges?: string[];
  features?: Record<string, any>;
}

const TIER_MAP: Record<string, TierMeta> = {
  platinum: { label: 'Excellent', color: 'green' },
  gold:     { label: 'Good', color: 'blue' },
  silver:   { label: 'Neutral', color: 'gray' },
  bronze:   { label: 'Questionable', color: 'orange' },
};

function mapTier(tier: string): TierMeta {
  return TIER_MAP[tier] || { label: 'Unknown', color: 'gray' };
}

class FairScoreService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = typeof window === 'undefined'
      ? process.env.FAIRSCALE_API_KEY
      : process.env.NEXT_PUBLIC_FAIRSCALE_API_KEY;
  }

  /**
   * Get FairScore for a single Solana wallet address.
   */
  async getScore(address: string): Promise<FairScoreResult> {
    if (!address) return this._emptyResult(address);

    const cached = scoreCache.get(address);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.data;
    }

    let result: FairScoreResult;
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
   */
  async getScores(addresses: string[]): Promise<Map<string, FairScoreResult>> {
    const results = new Map<string, FairScoreResult>();
    const uncached: string[] = [];

    for (const addr of addresses) {
      const cached = scoreCache.get(addr);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        results.set(addr, cached.data);
      } else {
        uncached.push(addr);
      }
    }

    if (uncached.length === 0) return results;

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
  getTier(score: number | null | undefined): TierMeta {
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
  clearCache(): void {
    scoreCache.clear();
  }

  private async _fetchFromAPI(address: string): Promise<FairScoreResult> {
    try {
      const url = `${FAIRSCALE_API}/score?wallet=${encodeURIComponent(address)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'fairkey': this.apiKey! },
      });

      if (!res.ok) {
        console.warn(`[FairScale] API returned ${res.status}`);
        return this._generateFromSignals(address);
      }

      const data: FairScaleApiResponse = await res.json();

      const score = data.fairscore ?? data.fair_score ?? null;
      const tierMeta = mapTier(data.tier || '');

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
    } catch (err: any) {
      console.warn('[FairScale] API call failed:', err.message);
      return this._generateFromSignals(address);
    }
  }

  private _generateFromSignals(address: string): FairScoreResult {
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

  private _emptyResult(address: string): FairScoreResult {
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
