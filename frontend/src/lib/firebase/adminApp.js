/**
 * Firebase Admin - Legacy re-export
 * 
 * @deprecated Use @/lib/firebase/serverOnly for new code
 * This file exists for backward compatibility with existing imports.
 * All server-side code should import from serverOnly.js instead.
 * 
 * @see serverOnly.js - Canonical server-only Firebase admin
 */

// Re-export from serverOnly for backward compatibility
export { default, db, auth } from './serverOnly';
