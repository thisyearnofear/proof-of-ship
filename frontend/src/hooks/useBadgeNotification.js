/**
 * useBadgeNotification
 *
 * Detects when a builder earns new badges by comparing current badge state
 * against a cached snapshot stored in localStorage. Shows toast notifications
 * for newly earned badges.
 *
 * Usage:
 *   const newBadges = useBadgeNotification({
 *     computeFn: computeBuilderBadges,
 *     data: portfolio,
 *     deps: [portfolio],
 *     cacheKey: 'badges-portfolio',
 *   });
 *
 * @returns {object[]} Array of newly earned badge objects (empty if none new)
 */

import { useEffect, useRef, useState } from "react";
import { useToastActions } from "@/components/common/Toast";

const CACHE_PREFIX = "pos_badges_cache_";

/**
 * @param {object} options
 * @param {function} options.computeFn — Function that computes badges from data
 * @param {*} options.data — Data to pass to computeFn
 * @param {string} options.cacheKey — Unique localStorage key for this badge type
 * @param {boolean} [options.enabled] — Whether notifications are active
 */
export default function useBadgeNotification({
  computeFn,
  data,
  cacheKey,
  enabled = true,
}) {
  const [newBadges, setNewBadges] = useState([]);
  const toast = useToastActions();
  const notifiedIds = useRef(new Set());

  useEffect(() => {
    if (!enabled || !computeFn || !data) return;

    // Compute current badges
    const currentBadges = computeFn(data);

    if (!Array.isArray(currentBadges) || currentBadges.length === 0) {
      // No badges to compare — just cache and bail
      try {
        localStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify([]));
      } catch { /* noop */ }
      return;
    }

    // Get cached badge IDs
    let cachedIds = [];
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + cacheKey);
      if (raw) {
        const cached = JSON.parse(raw);
        cachedIds = Array.isArray(cached) ? cached : [];
      }
    } catch {
      cachedIds = [];
    }

    // Find badges not in the cached set
    const currentIds = currentBadges.map((b) => b.id);
    const newlyEarned = currentBadges.filter(
      (badge) => !cachedIds.includes(badge.id) && !notifiedIds.current.has(`${cacheKey}-${badge.id}`)
    );

    if (newlyEarned.length > 0) {
      // Show toast for each new badge (batch the first as success)
      const label = newlyEarned.length === 1
        ? newlyEarned[0].label
        : `${newlyEarned.length} new badges`;
      const desc = newlyEarned.length === 1
        ? (newlyEarned[0].description || "Badge earned!")
        : "";

      toast.success(`🏅 ${label}${desc ? ` — ${desc}` : ""}`);

      // Mark as notified so we don't re-toast on re-render
      newlyEarned.forEach((b) => {
        notifiedIds.current.add(`${cacheKey}-${b.id}`);
      });

      setNewBadges(newlyEarned);
    } else {
      setNewBadges([]);
    }

    // Update cache with current badge IDs
    try {
      localStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(currentIds));
    } catch { /* noop */ }
  }, [enabled, computeFn, data, cacheKey]);

  return newBadges;
}
