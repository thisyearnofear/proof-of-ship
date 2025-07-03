import * as admin from 'firebase-admin';

// Check if Firebase admin has been initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

// Export the admin instance and commonly used services
export default admin;
export const db = admin.firestore();
export const auth = admin.auth();
