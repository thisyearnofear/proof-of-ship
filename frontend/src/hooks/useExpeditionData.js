/**
 * Hook for fetching expedition data (projects for backers)
 * Combines project data with financial and health metrics.
 *
 * Reads from the generic `projects` Firestore collection with pagination.
 * All metrics are derived from real Firestore fields — no random/mock data.
 */

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, limit, startAfter } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { COLLECTIONS } from '@/config/collections';

const PAGE_SIZE = 30;

import {
  calculateHealth,
  calculateConfidence,
  deriveMultiplier,
  deriveLastCheckIn,
  enhanceProject,
} from '@/utils/expeditionMetrics';

export function useExpeditionData() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastDoc(null);

    try {
      const projectsRef = collection(db, COLLECTIONS.PROJECTS_GENERIC);
      const q = query(projectsRef, limit(PAGE_SIZE));
      const snapshot = await getDocs(q);

      const rawProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length >= PAGE_SIZE);
      setProjects(rawProjects.map(enhanceProject));
    } catch (err) {
      console.error('Error loading expedition data:', err);
      setError(err.message || 'Failed to load expedition data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!lastDoc || !hasMore || loading) return;

    setLoading(true);
    try {
      const projectsRef = collection(db, COLLECTIONS.PROJECTS_GENERIC);
      const q = query(projectsRef, startAfter(lastDoc), limit(PAGE_SIZE));
      const snapshot = await getDocs(q);

      const rawProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length >= PAGE_SIZE);
      setProjects(prev => [...prev, ...rawProjects.map(enhanceProject)]);
    } catch (err) {
      console.error('Error loading more expedition data:', err);
    } finally {
      setLoading(false);
    }
  }, [lastDoc, hasMore, loading]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    projects,
    loading,
    error,
    refresh,
    hasMore,
    loadMore,
  };
}
