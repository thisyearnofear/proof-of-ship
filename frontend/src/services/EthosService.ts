/**
 * EthosService - Service for interacting with Ethos Network API
 * Fetches credibility scores and user reputation data
 */

const ETHOS_API_BASE = 'https://api.ethos.network/api/v2';
const ETHOS_CLIENT_HEADER = 'proof-of-ship@1.0.0';

// In-memory cache for Ethos scores to minimize API calls
const scoreCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface UserKey {
  address: string;
  // blockchain: string;
}

interface EthosUser {
  // ethn
  score?: number;
  userkeys?: string[];
  // score_decay?: number;
  // token_granted: Record<string, any>;
  // eth_balance_history: Record<string, any>;
  // original_score: number;
  // internal_score: number;
  // internal_score_updated_block: number;
  // updated_block: number;
  [key: string]: any;
}

interface ScoreTier {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

class EthosService {
  /**
   * Fetch Ethos credibility score(s) for wallet address(es)
   */
  async getScoresByAddress(addresses: string | string[]): Promise<EthosUser | EthosUser[] | null> {
    const isArray = Array.isArray(addresses);
    const addressList = isArray ? addresses : [addresses];
    
    const validAddresses = addressList.filter((addr): addr is string => 
      typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr)
    );

    if (validAddresses.length === 0) {
      return isArray ? [] : null;
    }

    const now = Date.now();
    const uncachedAddresses: string[] = [];
    const results: Record<string, EthosUser | null> = {};

    for (const addr of validAddresses) {
      const cached = scoreCache.get(addr.toLowerCase());
      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        results[addr.toLowerCase()] = cached.data;
      } else {
        uncachedAddresses.push(addr);
      }
    }

    if (uncachedAddresses.length > 0) {
      try {
        const response = await fetch(`${ETHOS_API_BASE}/users/by/address`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Ethos-Client': ETHOS_CLIENT_HEADER,
          },
          body: JSON.stringify({ addresses: uncachedAddresses }),
        });

        if (!response.ok) {
          console.warn(`Ethos API returned ${response.status} for addresses:`, uncachedAddresses);
          uncachedAddresses.forEach(addr => {
            scoreCache.set(addr.toLowerCase(), { data: null, timestamp: now });
            results[addr.toLowerCase()] = null;
          });
        } else {
          const data = await response.json();
          
          if (Array.isArray(data)) {
            data.forEach((user: EthosUser) => {
              if (user) {
                const userkeys: string[] = user.userkeys || [];
                userkeys.forEach((key: string) => {
                  if (key.startsWith('0x')) {
                    scoreCache.set(key.toLowerCase(), { data: user, timestamp: now });
                    results[key.toLowerCase()] = user;
                  }
                });
              }
            });
          }

          uncachedAddresses.forEach(addr => {
            if (!results[addr.toLowerCase()]) {
              scoreCache.set(addr.toLowerCase(), { data: null, timestamp: now });
              results[addr.toLowerCase()] = null;
            }
          });
        }
      } catch (error) {
        console.error('Error fetching Ethos scores:', error);
        uncachedAddresses.forEach(addr => {
          scoreCache.set(addr.toLowerCase(), { data: null, timestamp: now });
          results[addr.toLowerCase()] = null;
        });
      }
    }

    if (isArray) {
      return validAddresses.map(addr => results[addr.toLowerCase()] || null);
    } else {
      return results[validAddresses[0].toLowerCase()] || null;
    }
  }

  /**
   * Get score tier based on score value
   */
  getScoreTier(score: number | null | undefined): ScoreTier {
    if (score === null || score === undefined) {
      return {
        label: 'New to Ethos',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300',
      };
    }

    if (score >= 2000) {
      return {
        label: 'Excellent',
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300',
      };
    } else if (score >= 1600) {
      return {
        label: 'Good',
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-300',
      };
    } else if (score >= 1200) {
      return {
        label: 'Neutral',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300',
      };
    } else if (score >= 800) {
      return {
        label: 'Questionable',
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-300',
      };
    } else {
      return {
        label: 'Untrustworthy',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-300',
      };
    }
  }

  /**
   * Get Ethos profile URL for a user
   */
  getProfileUrl(usernameOrAddress: string | null | undefined): string | null {
    if (!usernameOrAddress) return null;
    
    if (usernameOrAddress.startsWith('0x')) {
      return `https://app.ethos.network/profile/address/${usernameOrAddress}`;
    }
    
    return `https://app.ethos.network/profile/${usernameOrAddress}`;
  }

  /**
   * Clear the cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    scoreCache.clear();
  }
}

const ethosService = new EthosService();
export default ethosService;
