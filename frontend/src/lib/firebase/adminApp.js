import * as admin from 'firebase-admin';

// Check if Firebase admin has been initialized
if (!admin.apps.length) {
  try {
    // Check if service account credentials are provided via env vars
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'proofofship',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // Use Application Default Credentials (works on Firebase Hosting, Cloud Run, etc.)
      // For local dev, run: gcloud auth application-default login
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'proofofship',
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

// Export the admin instance and commonly used services
export default admin;
export const db = admin.firestore();
export const auth = admin.auth();
