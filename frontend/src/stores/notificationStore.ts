/**
 * Notification Store
 *
 * Lightweight in-app notification center using useSyncExternalStore.
 * Notifications are derived from Firestore `activities` collection
 * (project_submitted, milestone_verified, payout_processed, follow events)
 * and leaderboard rank changes.
 *
 * Follows the same pattern as authStore/profileStore/walletStore.
 */

import { useSyncExternalStore } from "react";

interface AppNotification {
  id: string;
  type: "rank_change" | "badge_earned" | "new_follower" | "milestone" | "payout" | "project_submitted";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  href?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
}

let state: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: true,
};

const listeners = new Set<() => void>();

function setState(next: Partial<NotificationState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

// ── Actions ──────────────────────────────────────────────────────────────────

const notificationActions = {
  setNotifications(notifications: AppNotification[]) {
    const unreadCount = notifications.filter((n) => !n.read).length;
    setState({ notifications, unreadCount, loading: false });
  },

  markAsRead(id: string) {
    const notifications = state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    const unreadCount = notifications.filter((n) => !n.read).length;
    setState({ notifications, unreadCount });
  },

  markAllAsRead() {
    const notifications = state.notifications.map((n) => ({ ...n, read: true }));
    setState({ notifications, unreadCount: 0 });
  },

  clear() {
    setState({ notifications: [], unreadCount: 0, loading: false });
  },

  setLoading(loading: boolean) {
    setState({ loading });
  },
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    ...snapshot,
    markAsRead: notificationActions.markAsRead,
    markAllAsRead: notificationActions.markAllAsRead,
    clear: notificationActions.clear,
  };
}

export { notificationActions };
export type { AppNotification };
