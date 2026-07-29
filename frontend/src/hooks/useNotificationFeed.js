/**
 * useNotificationFeed — Fetches in-app notifications for the current user.
 *
 * Derives notifications from the platform activity feed + follow events,
 * filtering to items relevant to the current user. Polls every 60 seconds.
 */

import { useEffect, useRef } from "react";
import { useUser } from "@/stores/authStore";
import { notificationActions } from "@/stores/notificationStore";

const POLL_INTERVAL = 60_000; // 60 seconds

export default function useNotificationFeed() {
  const { currentUser } = useUser();
  const userIdRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      notificationActions.setNotifications([]);
      return;
    }

    // Reset read state when user changes
    if (userIdRef.current !== currentUser.uid) {
      userIdRef.current = currentUser.uid;
      notificationActions.setLoading(true);
    }

    let cancelled = false;

    async function fetchNotifications() {
      try {
        // Fetch platform activity feed
        const res = await fetch("/api/activity/feed?limit=30");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const activities = data.activities || data || [];

        // Filter to user-relevant notifications
        const notifications = activities
          .filter((a) => isRelevantToUser(a, currentUser.uid))
          .map(transformActivity)
          .filter(Boolean)
          .slice(0, 20);

        if (!cancelled) {
          notificationActions.setNotifications(notifications);
        }
      } catch {
        if (!cancelled) notificationActions.setNotifications([]);
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser]);

  return null;
}

function isRelevantToUser(activity, userId) {
  // Show activities related to the user's projects or direct actions
  if (activity.userHandle === userId || activity.userId === userId) return true;
  if (activity.type === "follow" && activity.followedId === userId) return true;
  // For project submissions, show if the user is the submitter
  if (activity.type === "project_submitted" && activity.userHandle === userId) return true;
  // Show all milestone/payout events (they're rare and interesting)
  if (activity.type === "milestone_verified" || activity.type === "payout_processed") return true;
  return false;
}

function transformActivity(activity) {
  if (!activity) return null;

  const id = activity.id || `${activity.type}-${activity.timestamp}`;
  const timestamp = activity.timestamp || activity.createdAt || new Date().toISOString();

  switch (activity.type) {
    case "project_submitted":
      return {
        id,
        type: "project_submitted",
        title: "Project shipped!",
        description: activity.description || "A new project was submitted",
        timestamp,
        read: false,
        href: activity.projectSlug ? `/projects/${activity.ecosystem || "base"}/${activity.projectSlug}` : null,
      };

    case "milestone_verified":
      return {
        id,
        type: "milestone",
        title: "Milestone verified",
        description: activity.description || "A project milestone was verified",
        timestamp,
        read: false,
        href: activity.projectSlug ? `/projects/${activity.ecosystem || "base"}/${activity.projectSlug}` : null,
      };

    case "payout_processed":
      return {
        id,
        type: "payout",
        title: "Payout secured!",
        description: activity.description || "A hackathon payout was processed",
        timestamp,
        read: false,
        href: activity.projectSlug ? `/projects/${activity.ecosystem || "base"}/${activity.projectSlug}` : null,
      };

    case "follow":
      return {
        id,
        type: "new_follower",
        title: "New follower",
        description: activity.message || "Someone followed you",
        timestamp,
        read: false,
        href: null,
      };

    default:
      return null;
  }
}
