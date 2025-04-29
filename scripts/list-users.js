/**
 * This script lists all users in Firestore
 * 
 * To run:
 * 1. Set up your Firebase credentials in .env.local
 * 2. Run: node scripts/list-users.js
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function listUsers() {
  try {
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in Firestore');
      return;
    }
    
    console.log('Users in Firestore:');
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      console.log(`- User ID: ${doc.id}`);
      console.log(`  Display Name: ${userData.displayName || 'N/A'}`);
      console.log(`  Email: ${userData.email || 'N/A'}`);
      console.log(`  GitHub Username: ${userData.githubUsername || 'N/A'}`);
      console.log(`  Permissions: ${(userData.permissions || []).length} projects`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
}

// Run the function
listUsers().then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(err => {
  console.error('Script execution failed:', err);
  process.exit(1);
});
