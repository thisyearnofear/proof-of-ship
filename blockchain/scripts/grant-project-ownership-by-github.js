/**
 * This script grants project ownership based on GitHub username
 * 
 * To run:
 * 1. Set up your Firebase credentials in .env.local
 * 2. Run: node scripts/grant-project-ownership-by-github.js <github-username> <project-slug>
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

async function grantProjectOwnershipByGithub(githubUsername, projectSlug) {
  try {
    if (!githubUsername || !projectSlug) {
      console.error('Usage: node scripts/grant-project-ownership-by-github.js <github-username> <project-slug>');
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
    
    // Find users with the given GitHub username
    // We need to query users collection to find the user with the matching GitHub username
    const usersSnapshot = await db.collection('users').get();
    let matchingUser = null;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Check if the user has GitHub provider data with the matching username
      if (userData.providerData && 
          userData.providerData.some(provider => 
            provider.providerId === 'github.com' && 
            provider.username === githubUsername
          )) {
        matchingUser = {
          uid: userDoc.id,
          ...userData
        };
        break;
      }
    }
    
    if (!matchingUser) {
      console.log(`No user found with GitHub username ${githubUsername}`);
      console.log('Creating a placeholder permission that will be applied when they sign in...');
      
      // Create a special document in a 'pendingPermissions' collection
      await db.collection('pendingPermissions').doc(`${githubUsername}-${projectSlug}`).set({
        githubUsername,
        projectSlug,
        projectName: projectData.name,
        role: 'editor',
        grantedAt: new Date().toISOString()
      });
      
      console.log(`Created pending permission for GitHub user ${githubUsername} on project ${projectSlug}`);
      return;
    }
    
    // Update project owners
    const owners = projectData.owners || [];
    if (!owners.includes(matchingUser.uid)) {
      owners.push(matchingUser.uid);
      await projectRef.update({
        owners: owners
      });
      console.log(`Added user ${githubUsername} (${matchingUser.uid}) to project owners`);
    } else {
      console.log(`User ${githubUsername} is already an owner of this project`);
    }
    
    // Update user permissions
    const userRef = db.collection('users').doc(matchingUser.uid);
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
      
      console.log(`Granted editor permission for ${projectSlug} to GitHub user ${githubUsername}`);
    }

  } catch (error) {
    console.error('Error granting project ownership:', error);
    process.exit(1);
  }
}

// Get command line arguments
const githubUsername = process.argv[2];
const projectSlug = process.argv[3];

// Run the function
grantProjectOwnershipByGithub(githubUsername, projectSlug).then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(err => {
  console.error('Script execution failed:', err);
  process.exit(1);
});
