/**
 * useBuilderXp — Computes builder XP/level/streak from portfolio data.
 *
 * Fetches the portfolio API (which includes hackathon proof, stats, and
 * recent activity) and derives the XP breakdown via computeBuilderXp.
 *
 * @param {string|null} username — GitHub username or UID
 * @returns {{ xp: object|null, loading: boolean }}
 */
import { useEffect, useState } from "react";
import { computeBuilderXp } from "@/lib/gamification/builderXp";

export default function useBuilderXp(username) {
  const [xp, setXp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchXp() {
      try {
        const res = await fetch(`/api/portfolio/${encodeURIComponent(username)}`);
        if (!res.ok) {
          if (!cancelled) setXp(null);
          return;
        }
        const portfolio = await res.json();
        if (cancelled) return;
        setXp(computeBuilderXp(portfolio));
      } catch {
        if (!cancelled) setXp(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchXp();
    return () => { cancelled = true; };
  }, [username]);

  return { xp, loading };
}
