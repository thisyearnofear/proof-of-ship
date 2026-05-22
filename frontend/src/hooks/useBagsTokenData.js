/**
 * useBagsTokenData — reusable hook for Bags token market data
 *
 * Wraps the server-side Bags API proxy. Returns token stats from
 * the Bags SDK's state service (lifetime fees, creators, claim events).
 *
 * usage: const { lifetimeFees, creators, claimEvents, loading, error } = useBagsTokenData(tokenMint)
 */

import { useState, useEffect } from 'react';

const CACHE_TTL = 60 * 1000; // 1 minute
const cache = new Map();

export default function useBagsTokenData(tokenMint) {
  const [lifetimeFees, setLifetimeFees] = useState(null);
  const [creators, setCreators] = useState([]);
  const [claimEvents, setClaimEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tokenMint) {
      setLifetimeFees(null);
      setCreators([]);
      setClaimEvents([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      // Check cache
      const cacheKey = `bags:${tokenMint}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        if (!cancelled) {
          setLifetimeFees(cached.data.lifetimeFees);
          setCreators(cached.data.creators || []);
          setClaimEvents(cached.data.claimEvents || []);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/bags/market?mint=${encodeURIComponent(tokenMint)}`);
        const data = await res.json();

        if (!cancelled) {
          setLifetimeFees(data.lifetimeFees ?? null);
          setCreators(data.creators || []);
          setClaimEvents(data.claimEvents || []);

          cache.set(cacheKey, { data, ts: Date.now() });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [tokenMint]);

  return { lifetimeFees, creators, claimEvents, loading, error };
}
