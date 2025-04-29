/**
 * This script grants project editing permissions to a user
 * 
 * To run:
 * 1. Set up your Firebase credentials in .env.local
 * 2. Run: node scripts/grant-project-permissions.js <user-uid> <project-slug>
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

async function grantProjectPermission(userId, projectSlug) {
  try {
    if (!userId || !projectSlug) {
      console.error('Usage: node scripts/grant-project-permissions.js <user-uid> <project-slug>');
      process.exit(1);
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.error(`User with ID ${userId} does not exist`);
      process.exit(1);
    }

    // Check if project exists
    const projectDoc = await db.collection('projects').doc(projectSlug).get();
    if (!projectDoc.exists) {
      console.error(`Project with slug ${projectSlug} does not exist`);
      process.exit(1);
    }

    const userData = userDoc.data();
    const projectData = projectDoc.data();

    // Update user permissions
    const permissions = userData.permissions || [];
    const existingPermIndex = permissions.findIndex(p => p.projectSlug === projectSlug);

    if (existingPermIndex >= 0) {
      console.log(`User already has permission for project ${projectSlug}`);
    } else {
      permissions.push({
        projectSlug: projectSlug,
        projectName: projectData.name || projectSlug,
        role: 'editor',
        grantedAt: new Date().toISOString()
      });

      await db.collection('users').doc(userId).update({
        permissions: permissions
      });

      console.log(`Granted editor permission for ${projectSlug} to user ${userId}`);
    }

    // Also update project owners
    const owners = projectData.owners || [];
    if (!owners.includes(userId)) {
      owners.push(userId);
      await db.collection('projects').doc(projectSlug).update({
        owners: owners
      });
      console.log(`Added user ${userId} to project owners`);
    }

  } catch (error) {
    console.error('Error granting permission:', error);
    process.exit(1);
  }
}

// Get command line arguments
const userId = process.argv[2];
const projectSlug = process.argv[3];

// Run the function
grantProjectPermission(userId, projectSlug).then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(err => {
  console.error('Script execution failed:', err);
  process.exit(1);
});
