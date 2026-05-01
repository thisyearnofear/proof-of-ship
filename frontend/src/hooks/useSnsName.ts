/**
 * useSnsName - React hook for resolving .sol domain names from wallet addresses.
 *
 * Wraps SnsService with caching, loading state, and automatic cleanup.
 * Use throughout the UI to display human-readable identities.
 */

import { useState, useEffect, useRef } from 'react';
import { snsService } from '@/services/SnsService';

interface UseSnsNameResult {
  /** The resolved .sol name, or null if not found / still loading */
  snsName: string | null;
  /** Whether the resolution is in progress */
  loading: boolean;
  /** The display string: .sol name if available, truncated address otherwise */
  displayName: string;
  /** Any error during resolution */
  error: string | null;
}

/**
 * Resolve a single Solana address to its .sol name.
 * @param address - Solana wallet address (Base58 string). Pass null/undefined to skip.
 * @param fallback - Fallback display string if no .sol name is found (default: truncated address)
 */
export function useSnsName(address: string | null | undefined, fallback?: string): UseSnsNameResult {
  const [snsName, setSnsName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(0); // incrementing ID to discard stale responses

  useEffect(() => {
    if (!address) {
      setSnsName(null);
      setLoading(false);
      setError(null);
      return;
    }

    const id = ++abortRef.current;
    setLoading(true);
    setError(null);

    snsService.resolveAddressToName(address)
      .then((name) => {
        if (id === abortRef.current) {
          setSnsName(name);
        }
      })
      .catch((err) => {
        if (id === abortRef.current) {
          setError(err.message || 'Resolution failed');
        }
      })
      .finally(() => {
        if (id === abortRef.current) {
          setLoading(false);
        }
      });
  }, [address]);

  const truncated = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';
  const displayName = snsName || fallback || truncated;

  return { snsName, loading, displayName, error };
}

/**
 * Resolve multiple addresses at once.
 * Returns a map of address -> resolved name.
 */
export function useBatchSnsNames(addresses: string[]): {
  names: Map<string, string | null>;
  loading: boolean;
} {
  const [names, setNames] = useState<Map<string, string | null>>(new Map());
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(0);

  useEffect(() => {
    if (addresses.length === 0) {
      setNames(new Map());
      return;
    }

    const id = ++abortRef.current;
    setLoading(true);

    snsService.batchResolve(addresses)
      .then((results) => {
        if (id === abortRef.current) {
          setNames(results);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (id === abortRef.current) {
          setLoading(false);
        }
      });
  }, [addresses.join(',')]);

  return { names, loading };
}

export default useSnsName;
