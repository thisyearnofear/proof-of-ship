/**
 * Hook for fetching expedition data (projects for backers)
 *
 * Loads projects from ecosystem-specific Firestore collections (projects_solana,
 * projects_celo, etc.) which contain real submission data: descriptions, GitHub
 * URLs, categories, and ecosystem tags. The generic `projects` collection is
 * sparse (created by the create-project script) and only used as a fallback.
 *
 * A quality gate filters out skeleton projects so backers only see substantive
 * submissions worth evaluating.
 */

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { COLLECTIONS } from '@/config/collections';
import { enhanceProject } from '@/utils/expeditionMetrics';

const ECOSYSTEMS = ['solana', 'celo', 'arc', 'base', 'linea', 'arbitrum', 'ethereum', 'optimism'];

/**
 * Quality gate — determines whether a project is worth showing to backers.
 * Requires substantive data, not just a name from the create-project script.
 */
function isBackerReady(project) {
  const name = (project.name || '').trim();
  const description = (project.description || '').trim();
  const hasGithub = !!(project.githubUrl || (project.owner && project.repo));
  const hasEcosystem = !!(project.ecosystem || '').trim();
  const hasCategory = !!(project.category || '').trim();
  const status = (project.status || 'submitted').trim();

  // Must have a name
  if (!name) return false;

  // Must have a meaningful description (not empty, not just a slug)
  if (description.length < 15) return false;

  // Must be assigned to an ecosystem
  if (!hasEcosystem) return false;

  // Must have at least a GitHub URL or owner/repo for code verification
  if (!hasGithub) return false;

  // Exclude projects that are winding down (protected deletion period)
  if (status === 'winding_down') return false;

  // Bonus: category presence indicates a more complete submission
  // but we don't require it — some real projects omit it
  return true;
}

export function useExpeditionData() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load from all ecosystem collections in parallel
      const results = await Promise.allSettled(
        ECOSYSTEMS.map(async (eco) => {
          const collectionName = `projects_${eco}`;
          try {
            const ref = collection(db, collectionName);
            const q = eco === 'base'
              ? query(ref, where('status', '==', 'approved'))
              : query(ref);
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              ecosystem: eco, // ensure ecosystem is always set
            }));
          } catch (err) {
            console.warn(`Failed to load ${collectionName}:`, err.message);
            return [];
          }
        })
      );

      // Flatten all ecosystem projects
      const allRaw = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

      // Deduplicate by slug (same project may exist in generic + ecosystem collection)
      const seen = new Map();
      for (const p of allRaw) {
        const key = p.slug || p.id;
        if (!seen.has(key)) {
          seen.set(key, p);
        } else {
          // Prefer the one with more data (longer description)
          const existing = seen.get(key);
          if ((p.description || '').length > (existing.description || '').length) {
            seen.set(key, p);
          }
        }
      }

      // Apply quality gate
      const qualityProjects = [...seen.values()].filter(isBackerReady);

      // Enhance with derived metrics
      const enhanced = qualityProjects.map(p => enhanceProject(p));

      // Sort by health descending as default
      enhanced.sort((a, b) => (b.health || 0) - (a.health || 0));

      setProjects(enhanced);
    } catch (err) {
      console.error('Error loading expedition data:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    projects,
    loading,
    error,
    refresh,
    hasMore: false,
    loadMore: () => {},
  };
}
