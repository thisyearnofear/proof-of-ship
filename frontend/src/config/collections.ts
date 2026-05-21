/**
 * Firestore Collection Name Constants
 * 
 * Centralizes all Firestore collection references to prevent typos
 * and make collection name changes easier to maintain.
 */

export const COLLECTIONS = {
  // Project collections (per ecosystem)
  PROJECTS: {
    BASE: 'projects_base',
    CELO: 'projects_celo',
    ARBITRUM: 'projects_arbitrum',
    ETHEREUM: 'projects_ethereum',
    LINEA: 'projects_linea',
    OPTIMISM: 'projects_optimism',
    SOLANA: 'projects_solana',
    ARC: 'projects_arc',
  } as const,

  // Generic project collection
  PROJECTS_GENERIC: 'projects',

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
  | typeof COLLECTIONS.PROJECTS[keyof typeof COLLECTIONS.PROJECTS]
  | typeof COLLECTIONS.PROJECTS_GENERIC
  | typeof COLLECTIONS.ADMIN_QUEUE
  | typeof COLLECTIONS.USER_PROFILES
  | typeof COLLECTIONS.VERIFICATION_REQUESTS
  | typeof COLLECTIONS.CREDIT_LINES
  | typeof COLLECTIONS.BACKINGS
  | typeof COLLECTIONS.MILESTONES
  | typeof COLLECTIONS.NOTIFICATIONS
  | typeof COLLECTIONS.ANALYTICS
  | typeof COLLECTIONS.EVENTS;

/**
 * Get collection name for a specific ecosystem
 */
export const getProjectCollection = (ecosystem: string): string => {
  const normalized = ecosystem.toLowerCase();
  return COLLECTIONS.PROJECTS[normalized as keyof typeof COLLECTIONS.PROJECTS] 
    || `${COLLECTIONS.PROJECTS_GENERIC}_${normalized}`;
};

/**
 * Check if a collection name is a valid project collection
 */
export const isProjectCollection = (collection: string): boolean => {
  return Object.values(COLLECTIONS.PROJECTS).includes(collection as any)
    || collection === COLLECTIONS.PROJECTS_GENERIC;
};

/**
 * Get all ecosystem project collection names
 */
export const getAllProjectCollections = (): string[] => {
  return [...Object.values(COLLECTIONS.PROJECTS), COLLECTIONS.PROJECTS_GENERIC];
};
