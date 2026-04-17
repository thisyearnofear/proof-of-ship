/**
 * This script creates a project in Firestore
 * 
 * To run:
 * 1. Set up your Firebase credentials in .env.local
 * 2. Run: node scripts/create-project.js <project-slug> <project-name>
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

async function createProject(projectSlug, projectName) {
  try {
    if (!projectSlug || !projectName) {
      console.error('Usage: node scripts/create-project.js <project-slug> <project-name>');
      process.exit(1);
    }

    // Check if project already exists
    const projectDoc = await db.collection('projects').doc(projectSlug).get();
    if (projectDoc.exists) {
      console.error(`Project with slug ${projectSlug} already exists`);
      process.exit(1);
    }

    // Create project
    await db.collection('projects').doc(projectSlug).set({
      slug: projectSlug,
      name: projectName,
      description: '',
      contracts: [],
      socials: {
        twitter: '',
        discord: '',
        website: ''
      },
      founders: [],
      owners: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Created project ${projectName} with slug ${projectSlug}`);

  } catch (error) {
    console.error('Error creating project:', error);
    process.exit(1);
  }
}

// Get command line arguments
const projectSlug = process.argv[2];
const projectName = process.argv[3];

// Run the function
createProject(projectSlug, projectName).then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(err => {
  console.error('Script execution failed:', err);
  process.exit(1);
});
