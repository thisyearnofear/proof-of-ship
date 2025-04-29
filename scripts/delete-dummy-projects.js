/**
 * This script deletes dummy projects from Firestore
 * 
 * To run:
 * 1. Set up your Firebase credentials in .env.local
 * 2. Run: node scripts/delete-dummy-projects.js
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

async function deleteDummyProjects() {
  try {
    // List of dummy project slugs to delete
    const dummyProjects = [
      'project-alpha',
      'project-beta'
    ];
    
    console.log(`Deleting ${dummyProjects.length} dummy projects...`);
    
    // Delete each project
    for (const slug of dummyProjects) {
      const projectRef = db.collection('projects').doc(slug);
      const projectDoc = await projectRef.get();
      
      if (projectDoc.exists) {
        await projectRef.delete();
        console.log(`Deleted project: ${slug}`);
      } else {
        console.log(`Project not found: ${slug}`);
      }
    }
    
    console.log('Dummy projects deleted successfully!');
    
  } catch (error) {
    console.error('Error deleting dummy projects:', error);
  }
}

// Run the function
deleteDummyProjects().then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(err => {
  console.error('Script execution failed:', err);
  process.exit(1);
});
