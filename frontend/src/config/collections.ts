/**
 * Firestore Collection Name Constants
 * 
 * Centralizes all Firestore collection references to prevent typos
 * and make collection name changes easier to maintain.
 */

export const COLLECTIONS = {
  // Single project collection with ecosystem field
  PROJECTS: 'projects',

  // Admin queue
  ADMIN_QUEUE: 'admin_queue',

  // User profiles (matches Firestore rules: /users/{userId})
  USERS: 'users',

  // Verification requests
  VERIFICATION_REQUESTS: 'verification_requests',

  // Credit system
  CREDIT_LINES: 'credit_lines',
  BACKINGS: 'backings',
  MILESTONES: 'milestones',

  // Notifications
  NOTIFICATIONS: 'notifications',

  // Analytics
  ANALYTICS: 'analytics',
  EVENTS: 'events',
} as const;

export type CollectionName = 
  | typeof COLLECTIONS.PROJECTS
  | typeof COLLECTIONS.ADMIN_QUEUE
  | typeof COLLECTIONS.USERS
  | typeof COLLECTIONS.VERIFICATION_REQUESTS
  | typeof COLLECTIONS.CREDIT_LINES
  | typeof COLLECTIONS.BACKINGS
  | typeof COLLECTIONS.MILESTONES
  | typeof COLLECTIONS.NOTIFICATIONS
  | typeof COLLECTIONS.ANALYTICS
  | typeof COLLECTIONS.EVENTS;

/**
 * Check if a collection name is a valid project collection
 */
export const isProjectCollection = (collection: string): boolean => {
  return collection === COLLECTIONS.PROJECTS;
};
