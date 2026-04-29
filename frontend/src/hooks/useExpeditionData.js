/**
 * Hook for fetching expedition data (projects for backers)
 * Combines project data with financial and health metrics
 */

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

export function useExpeditionData() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch projects from Firestore (use lowercase to match firestore.rules)
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef);
      const snapshot = await getDocs(q);
      
      const rawProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Enhance with ROI and Health metrics for the Backer Expedition
      const enhanced = rawProjects.map(p => {
        // Calculate Confidence: (Backers / Target) * (Total Staked / Target)
        // Mocking some values if they don't exist
        const backerCount = p.backerCount || Math.floor(Math.random() * 20) + 5;
        const targetBackers = p.targetBackers || 50;
        const confidence = Math.min((backerCount / targetBackers) * 100 + (Math.random() * 10), 100);

        // Calculate Health: Derived from stats if available
        const health = p.stats?.healthScore || (Math.random() * 40 + 60);

        // ROI Multipliers (1.5x, 2x, 3x)
        const multipliers = [1.5, 2.0, 3.0];
        const activeMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
        
        // Mock financial metrics
        const totalBacked = p.totalBacked || (Math.floor(Math.random() * 5000) + 1000);
        const targetFunding = p.targetFunding || 10000;
        
        // Product Design: Skin-in-the-Game Signal
        // Mocking: If project has developer and some backing, 60% chance they staked on themselves
        const founderStakedAmount = p.developer ? (Math.random() > 0.4 ? Math.floor(Math.random() * 500) + 100 : 0) : 0;
        
        // Mocking: Last check-in in hours (0-168 hours / 1 week)
        const lastCheckIn = Math.floor(Math.random() * 168);
        
        return {
          ...p,
          confidence,
          health,
          activeMultiplier,
          projectedROI: (activeMultiplier - 1) * 100, // percentage gain
          totalBacked,
          targetFunding,
          founderStaked: founderStakedAmount > 0,
          founderStakedAmount,
          lastCheckIn,
          category: p.sectors?.[0] || 'Infrastructure',
        };
      });

      setProjects(enhanced);
    } catch (err) {
      console.error('Error loading expedition data:', err);
      setError(err.message || 'Failed to load expedition data');
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
  };
}
