/**
 * This script grants project ownership to specific users
 * 
 * To run:
 * 1. Set up your Firebase credentials in .env.local
 * 2. Run: node scripts/grant-project-ownership.js <user-email> <project-slug>
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
const auth = admin.auth();

async function grantProjectOwnership(userEmail, projectSlug) {
  try {
    if (!userEmail || !projectSlug) {
      console.error('Usage: node scripts/grant-project-ownership.js <user-email> <project-slug>');
      process.exit(1);
    }

    // Get user by email
    let user;
    try {
      user = await auth.getUserByEmail(userEmail);
    } catch (error) {
      console.error(`User with email ${userEmail} not found`);
      process.exit(1);
    }

    // Check if project exists
    const projectRef = db.collection('projects').doc(projectSlug);
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists) {
      console.error(`Project with slug ${projectSlug} does not exist`);
      process.exit(1);
    }

    const projectData = projectDoc.data();
    
    // Update project owners
    const owners = projectData.owners || [];
    if (!owners.includes(user.uid)) {
      owners.push(user.uid);
      await projectRef.update({
        owners: owners
      });
      console.log(`Added user ${userEmail} (${user.uid}) to project owners`);
    } else {
      console.log(`User ${userEmail} is already an owner of this project`);
    }
    
    // Update user permissions
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    let userData = {};
    if (userDoc.exists) {
      userData = userDoc.data();
    }
    
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
      
      await userRef.set({
        ...userData,
        permissions: permissions
      }, { merge: true });
      
      console.log(`Granted editor permission for ${projectSlug} to user ${userEmail}`);
    }

  } catch (error) {
    console.error('Error granting project ownership:', error);
    process.exit(1);
  }
}

// Get command line arguments
const userEmail = process.argv[2];
const projectSlug = process.argv[3];

// Run the function
grantProjectOwnership(userEmail, projectSlug).then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(err => {
  console.error('Script execution failed:', err);
  process.exit(1);
});
