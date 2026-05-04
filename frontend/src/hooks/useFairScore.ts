/**
 * useFairScore - React hook for fetching FairScale reputation scores.
 *
 * Wraps FairScoreService with caching, loading state, and automatic cleanup.
 * Use to display trust signals for Solana wallet addresses.
 */

import { useState, useEffect, useRef } from 'react';
import fairScoreService from '@/services/FairScoreService';

interface FairScoreResult {
  address: string;
  score: number | null;
  tier: string;
  tierColor: string;
  badges: string[];
  features: any;
  isDemo: boolean;
}

interface UseFairScoreResult {
  /** The FairScore data, or null if not loaded */
  data: FairScoreResult | null;
  /** Whether the fetch is in progress */
  loading: boolean;
  /** Any error during fetch */
  error: string | null;
}

/**
 * Fetch FairScore for a single Solana address.
 * @param address - Solana wallet address. Pass null/undefined to skip.
 */
export function useFairScore(address: string | null | undefined): UseFairScoreResult {
  const [data, setData] = useState<FairScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!address) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fairScoreService.getScore(address)
      .then(result => {
        if (!cancelled && mountedRef.current) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled && mountedRef.current) {
          setError(err.message || 'Failed to fetch score');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [address]);

  return { data, loading, error };
}

/**
 * Fetch FairScores for multiple Solana addresses.
 * @param addresses - Array of Solana wallet addresses.
 */
export function useFairScores(addresses: string[]): {
  data: Map<string, FairScoreResult>;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<Map<string, FairScoreResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!addresses || addresses.length === 0) {
      setData(new Map());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fairScoreService.getScores(addresses)
      .then(results => {
        if (!cancelled && mountedRef.current) {
          setData(results);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled && mountedRef.current) {
          setError(err.message || 'Failed to fetch scores');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [addresses.join(',')]);

  return { data, loading, error };
}
