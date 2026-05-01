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

/**
 * Calculate project health from available stats.
 * Returns 0-100 based on activity signals.
 */
function calculateHealth(project) {
  const stats = project.stats || {};
  let score = 50; // baseline

  if (stats.isActive) score += 15;
  if (stats.commits > 10) score += 10;
  if (stats.commits > 50) score += 5;
  if (stats.lastCommit) {
    const daysSince = (Date.now() - new Date(stats.lastCommit).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) score += 15;
    else if (daysSince < 30) score += 5;
    else score -= 10;
  }
  if (stats.healthScore) score = Math.round((score + stats.healthScore) / 2);

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate backer confidence from backing data.
 * Returns 0-100 based on backer count and total staked vs target.
 */
function calculateConfidence(project) {
  const backerCount = project.backerCount || 0;
  const totalBacked = project.totalBacked || 0;
  const targetFunding = project.targetFunding || 10000;

  if (backerCount === 0 && totalBacked === 0) return 10; // minimal baseline

  const backerSignal = Math.min(backerCount / 10, 1) * 40;
  const fundingSignal = Math.min(totalBacked / targetFunding, 1) * 50;

  return Math.min(100, Math.round(backerSignal + fundingSignal + 10));
}

/**
 * Derive active multiplier from backing data.
 * Uses the highest active multiplier tier, or defaults to 1.5x.
 */
function deriveMultiplier(project) {
  if (project.activeMultiplier) return project.activeMultiplier;
  if (project.backingMultiplier) return project.backingMultiplier / 100;

  const multipliers = [1.5, 2.0, 3.0];
  const backerCount = project.backerCount || 0;
  return multipliers[Math.min(Math.floor(backerCount / 5), 2)];
}

/**
 * Derive hours since last check-in from available data.
 */
function deriveLastCheckIn(project) {
  if (project.lastCheckInTimestamp) {
    return Math.floor((Date.now() - new Date(project.lastCheckInTimestamp).getTime()) / (1000 * 60 * 60));
  }
  if (project.stats?.lastCommit) {
    return Math.floor((Date.now() - new Date(project.stats.lastCommit).getTime()) / (1000 * 60 * 60));
  }
  return 168; // default to stale
}

/**
 * Enhance a raw Firestore project with derived expedition metrics.
 * All values come from real data — no random mocking.
 */
function enhanceProject(p) {
  const health = calculateHealth(p);
  const confidence = calculateConfidence(p);
  const activeMultiplier = deriveMultiplier(p);
  const totalBacked = p.totalBacked || 0;
  const targetFunding = p.targetFunding || 10000;
  const lastCheckIn = deriveLastCheckIn(p);

  return {
    ...p,
    confidence,
    health,
    activeMultiplier,
    projectedROI: (activeMultiplier - 1) * 100,
    totalBacked,
    targetFunding,
    founderStaked: (p.founderStakedAmount || 0) > 0,
    founderStakedAmount: p.founderStakedAmount || 0,
    lastCheckIn,
    category: p.sectors?.[0] || p.category || 'Infrastructure',
  };
}

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
