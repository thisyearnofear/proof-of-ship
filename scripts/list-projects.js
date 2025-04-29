/**
 * This script lists all projects in Firestore
 * 
 * To run:
 * 1. Set up your Firebase credentials in .env.local
 * 2. Run: node scripts/list-projects.js
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

async function listProjects() {
  try {
    // Get all projects from Firestore
    const projectsSnapshot = await db.collection('projects').get();
    
    if (projectsSnapshot.empty) {
      console.log('No projects found in Firestore');
      return;
    }
    
    console.log('Projects in Firestore:');
    projectsSnapshot.forEach(doc => {
      const projectData = doc.data();
      console.log(`- Project Slug: ${doc.id}`);
      console.log(`  Name: ${projectData.name || 'N/A'}`);
      console.log(`  Contracts: ${(projectData.contracts || []).length}`);
      console.log(`  Owners: ${(projectData.owners || []).length}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error listing projects:', error);
    process.exit(1);
  }
}

// Run the function
listProjects().then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(err => {
  console.error('Script execution failed:', err);
  process.exit(1);
});
