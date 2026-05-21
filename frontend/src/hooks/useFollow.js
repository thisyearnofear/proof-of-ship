"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * useFollow — Hook for checking follow status and toggling follow.
 *
 * @param {string} targetUserId - The UID of the user to check/toggle follow for
 * @param {boolean} [initialFollowing] - Optional initial following state
 * @param {number} [initialCount] - Optional initial follower count (avoids flash from 0)
 * @returns {{ following: boolean, followerCount: number, loading: boolean, toggleFollow: () => Promise<void> }}
 */
export default function useFollow(targetUserId, initialFollowing = false, initialCount = 0, onToggle) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialCount);
  const [loading, setLoading] = useState(!!targetUserId);

  // Fetch initial follow status
  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/follows?targetUserId=${encodeURIComponent(targetUserId)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setFollowing(data.following);
            setFollowerCount(data.followerCount);
          }
        }
      } catch {
        // Silently fail — non-critical UI feature
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [targetUserId]);

  const toggleFollow = useCallback(async () => {
    // Optimistic update
    setFollowing((prev) => !prev);
    setFollowerCount((prev) => (following ? Math.max(0, prev - 1) : prev + 1));

    try {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      if (!res.ok) {
        // Rollback on failure
        setFollowing((prev) => !prev);
        setFollowerCount((prev) => (following ? prev + 1 : Math.max(0, prev - 1)));
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to toggle follow");
      }

      // Sync with server response
      const data = await res.json();
      setFollowing(data.following);
      setFollowerCount(data.followerCount);

      if (onToggle) onToggle(null, data.following);
    } catch (e) {
      console.error("Follow toggle error:", e);

      if (onToggle) onToggle(e, null);
    }
  }, [targetUserId, following, onToggle]);

  return { following, followerCount, loading, toggleFollow };
}

