/**
 * useWinnerStatus — single source of truth for winner verification state
 *
 * Enhances the existing auth + firestore pattern. Replaces scattered manual
 * winner-verification checks with a unified hook. DRY.
 *
 * Returns: { isVerified, wins, pendingClaim, loading, error, submitClaim }
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/stores/authStore';

const STATUS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let cachedStatus = null;
let cachedAt = 0;

export default function useWinnerStatus() {
  const { currentUser } = useUser();
  const [isVerified, setIsVerified] = useState(false);
  const [wins, setWins] = useState([]);
  const [pendingClaim, setPendingClaim] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load status from API on mount / user change
  useEffect(() => {
    if (!currentUser) {
      setIsVerified(false);
      setWins([]);
      setPendingClaim(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchStatus() {
      setLoading(true);
      setError(null);

      // Return cached data if fresh
      if (cachedStatus && Date.now() - cachedAt < STATUS_CACHE_TTL) {
        if (!cancelled) {
          setIsVerified(cachedStatus.isVerified);
          setWins(cachedStatus.wins);
          setPendingClaim(cachedStatus.pendingClaim);
          setLoading(false);
        }
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        const res = await fetch('/api/winner-verification', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 404) {
            // Not verified yet — that's fine
            if (!cancelled) {
              setIsVerified(false);
              setWins([]);
              setPendingClaim(false);
            }
            return;
          }
          throw new Error(`Status check failed: ${res.status}`);
        }

        const data = await res.json();

        cachedStatus = {
          isVerified: data.verified,
          wins: data.wins || [],
          pendingClaim: data.hasPendingClaim,
        };
        cachedAt = Date.now();

        if (!cancelled) {
          setIsVerified(data.verified);
          setWins(data.wins || []);
          setPendingClaim(data.hasPendingClaim);
        }
      } catch (err) {
        console.warn('Winner status check failed:', err);
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStatus();
    return () => { cancelled = true; };
  }, [currentUser]);

  const submitClaim = useCallback(async ({ hackathonName, announcementUrl, githubRepo, outcome }) => {
    if (!currentUser) {
      return { success: false, error: 'Must be logged in' };
    }

    try {
      const res = await fetch('/api/winner-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonName, announcementUrl, githubRepo, outcome }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to submit claim' };
      }

      // Invalidate cache so the next status fetch picks up the pending claim
      cachedStatus = null;
      cachedAt = 0;
      setPendingClaim(true);

      return { success: true, claimId: data.claimId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentUser]);

  return { isVerified, wins, pendingClaim, loading, error, submitClaim };
}
