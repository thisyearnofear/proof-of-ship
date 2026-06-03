/**
 * Hook for fetching verification dashboard data
 * Aggregates hackathons, pending milestones, and hackathon group progress
 */

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useUser } from '@/stores/authStore';
import { useBuilderCredit } from '@/stores/walletStore';
import { realGitHubService } from '@/services/RealGitHubService';

export function useVerificationData() {
  const { currentUser } = useUser();
  const { account } = useBuilderCredit();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignedHackathons, setAssignedHackathons] = useState([]);
  const [pendingMilestones, setPendingMilestones] = useState([]);
  const [hackathonGroups, setHackathonGroups] = useState([]);
  const [evidence, setEvidence] = useState([]);

  const fetchData = useCallback(async () => {
    // Without the registry contract wired in the hydrator we can only render empty
    // state; bail early so callers see loading=false with no rows.
    if (!currentUser || !account) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // The hackathon registry contract is not wired in the hydrator yet.
      // Without it, on-chain verifier status cannot be resolved.
      // This hook returns empty state until the contract is wired.
      setAssignedHackathons([]);
      setPendingMilestones([]);
      setHackathonGroups([]);
    } catch (err) {
      console.error('Error fetching verification data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, account]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    assignedHackathons,
    pendingMilestones,
    hackathonGroups,
    evidence,
    refresh: fetchData,
  };
}
