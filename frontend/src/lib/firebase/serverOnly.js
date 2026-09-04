/**
 * Server-only Firebase Admin initialization
 * 
 * IMPORTANT: This file should NEVER be imported from client-side code.
 * Use this only in:
 *   - /api/ routes (serverless functions)
 *   - /scripts/ directory
 *   - Build-time scripts
 * 
 * To enforce this, use the 'server-only' package:
 *   import 'server-only';
 * 
 * For Vercel: This works natively with serverless functions
 * For Firebase: Move to Cloud Functions for server-side only
 */

import * as admin from 'firebase-admin';

// Check if already initialized to avoid duplicate initialization
if (!admin.apps.length) {
  try {
    // In production (Vercel, Firebase Cloud Functions, etc.)
    // credentials come from environment or service account
    // Normalize private key: handle escaped newlines and base64 encoding
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').trim()
      : undefined;
    if (privateKey && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'pledgebond',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
    } else {
      // Development / Firebase Hosting edge cases
      // Uses Application Default Credentials
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'pledgebond',
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error.message);
    // Don't throw in development - allow graceful degradation
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export default admin;
export const db = admin.firestore();
export const auth = admin.auth();