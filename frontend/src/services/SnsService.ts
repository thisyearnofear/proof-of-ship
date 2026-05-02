/**
 * SNS (Solana Name Service) Service
 *
 * Resolves .sol domain names for Solana wallet addresses and vice versa.
 * Used throughout Proof of Ship to display human-readable builder and backer
 * identities instead of raw Base58 addresses.
 *
 * Tracks: Superteam SNS Identity Track
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getDomainKeySync, NameRegistryState, getDomainKeysWithReverses, getAllDomains } from '@bonfida/spl-name-service';
import { getSolanaConnection } from '@/contexts/wallet/constants';

// Cache: address -> .sol name (avoids repeated RPC calls)
const nameCache: Map<string, { name: string | null; ts: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Well-known agent identity mappings for Proof of Ship snap-server agents
const AGENT_SOL_NAMES: Record<string, string> = {
  scout: 'pos-scout.sol',
  underwrite: 'pos-underwrite.sol',
  verify: 'pos-verify.sol',
  rebalance: 'pos-rebalance.sol',
};

class SnsService {
  private connection: Connection;

  constructor() {
    this.connection = getSolanaConnection();
  }

  /**
   * Resolve a Solana address to its .sol domain name.
   * Uses the official SNS reverse lookup API (getDomainKeysWithReverses)
   * to find all .sol domains owned by the address, then returns the primary.
   * Returns null if no .sol name is registered for that address.
   */
  async resolveAddressToName(address: string): Promise<string | null> {
    if (!address) return null;

    const cacheKey = address.toLowerCase();
    const cached = nameCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.name;
    }

    try {
      const pubkey = new PublicKey(address);
      // Use the official SNS API: gets all .sol domains for this owner
      // and resolves their human-readable names via reverse lookup accounts.
      const domains = await getDomainKeysWithReverses(this.connection, pubkey);

      // Return the first resolved domain name (primary domain)
      const resolvedName = domains.length > 0 && domains[0].domain
        ? domains[0].domain
        : null;

      nameCache.set(cacheKey, { name: resolvedName, ts: Date.now() });
      return resolvedName;
    } catch (err) {
      console.warn('[SNS] Failed to resolve address:', address, err);
      nameCache.set(cacheKey, { name: null, ts: Date.now() });
      return null;
    }
  }

  /**
   * Resolve a .sol domain name to its Solana address.
   * Returns null if the name doesn't exist or can't be resolved.
   */
  async resolveNameToAddress(domain: string): Promise<string | null> {
    if (!domain) return null;
    const cleanDomain = domain.endsWith('.sol') ? domain.replace('.sol', '') : domain;

    try {
      const { pubkey } = getDomainKeySync(cleanDomain);
      const registry = await NameRegistryState.retrieve(this.connection, pubkey);
      if (registry && registry.owner) {
        return registry.owner.toBase58();
      }
      return null;
    } catch (err) {
      console.warn('[SNS] Failed to resolve name:', cleanDomain, err);
      return null;
    }
  }

  /**
   * Get the display identity for a Solana address.
   * Returns the .sol name if available, otherwise falls back to a truncated address.
   */
  async getDisplayIdentity(address: string): Promise<string> {
    if (!address) return '';
    const name = await this.resolveAddressToName(address);
    if (name) return name;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  /**
   * Get the agent .sol identity name.
   * Returns the well-known .sol name for a given agent type.
   */
  getAgentIdentity(agentType: string): string {
    return AGENT_SOL_NAMES[agentType] || `${agentType}.agent.sol`;
  }

  /**
   * Resolve the identity for an agent address (used in snap-server).
   * Returns the agent's .sol name from the well-known mapping.
   */
  getAgentDisplayIdentity(agentType: string): string {
    return this.getAgentIdentity(agentType);
  }

  /**
   * Clear the resolution cache (useful after new registrations).
   */
  clearCache(): void {
    nameCache.clear();
  }

  /**
   * Batch resolve multiple addresses to .sol names.
   * Returns a map of address -> name (null if no .sol name found).
   */
  async batchResolve(addresses: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();
    const uncached: string[] = [];

    for (const addr of addresses) {
      const cached = nameCache.get(addr.toLowerCase());
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        results.set(addr, cached.name);
      } else {
        uncached.push(addr);
      }
    }

    // Resolve uncached addresses in parallel
    const resolved = await Promise.allSettled(
      uncached.map((addr) => this.resolveAddressToName(addr))
    );

    uncached.forEach((addr, i) => {
      const result = resolved[i];
      const name = result.status === 'fulfilled' ? result.value : null;
      results.set(addr, name);
    });

    return results;
  }
}

export const snsService = new SnsService();
export default snsService;
