/**
 * Hook for fetching active campaigns for discovery page
 * Caches results to prevent redundant queries
 * Single responsibility: Get open campaigns only
 */

import { useEffect, useState, useCallback } from 'react';
import useCampaigns from './useCampaigns';

const CACHE_KEY = 'activeCampaigns_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useActiveCampaigns() {
  const { getCampaigns } = useCampaigns();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFromCache = useCallback(() => {
    const cached = localStorage?.getItem(CACHE_KEY);
    if (!cached) return null;

    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    } catch (e) {
      console.warn('Cache parse error:', e);
    }
    return null;
  }, []);

  const saveToCache = useCallback((data) => {
    try {
      localStorage?.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('Cache save error:', e);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const openCampaigns = await getCampaigns({ status: 'open', sortBy: 'deadline' });
      setCampaigns(openCampaigns || []);
      saveToCache(openCampaigns);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [getCampaigns, saveToCache]);

  // Load on mount
  useEffect(() => {
    const cached = loadFromCache();
    if (cached) {
      setCampaigns(cached);
      setLoading(false);
    }
    refresh();
  }, [refresh, loadFromCache]);

  return {
    campaigns,
    loading,
    error,
    refresh,
  };
}
