import { useState, useEffect } from 'react';

/**
 * Hook to fetch active Torque incentive programs.
 * Returns { incentives, loading } — gracefully degrades when Torque is unconfigured.
 */
export function useTorqueIncentives() {
  const [incentives, setIncentives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/torque/incentives');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setIncentives(data.incentives || []);
      } catch {
        // silently ignore — Torque is optional
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { incentives, loading };
}
