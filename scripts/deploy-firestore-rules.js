/**
 * This script deploys Firestore security rules
 * 
 * To run:
 * 1. Set up your Firebase credentials in .env.local
 * 2. Run: node scripts/deploy-firestore-rules.js
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

async function deployRules() {
  try {
    console.log('Reading Firestore rules...');
    const rulesPath = path.join(__dirname, '../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    
    console.log('Deploying Firestore rules...');
    
    // Use the Firebase Admin SDK to deploy rules
    // Note: This is a simplified example. In a real-world scenario, you would use the Firebase CLI
    console.log('Rules deployment requires the Firebase CLI. Please run:');
    console.log('firebase deploy --only firestore:rules');
    
    console.log('\nFirestore rules content:');
    console.log(rules);
    
  } catch (error) {
    console.error('Error deploying Firestore rules:', error);
  }
}

// Run the function
deployRules().then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(err => {
  console.error('Script execution failed:', err);
  process.exit(1);
});
