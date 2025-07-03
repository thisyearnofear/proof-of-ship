/**
 * This script verifies GitHub repository ownership and grants edit permissions
 * to users who own repositories in repos.json
 * 
 * To run:
 * 1. Set up your Firebase credentials in .env.local
 * 2. Run: node scripts/verify-repo-ownership.js
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

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

async function verifyRepoOwnership() {
  try {
    // Read the repos.json file
    const reposPath = path.join(__dirname, '../repos.json');
    const reposContent = fs.readFileSync(reposPath, 'utf8');
    const repos = JSON.parse(reposContent);
    
    console.log(`Found ${repos.length} repositories to verify`);
    
    // Get all users with GitHub tokens
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.githubToken && userData.githubUsername) {
        users.push({
          id: doc.id,
          ...userData
        });
      }
    });
    
    console.log(`Found ${users.length} users with GitHub tokens`);
    
    // For each user, check if they have access to any of the repos
    for (const user of users) {
      console.log(`Checking repositories for user ${user.githubUsername}...`);
      
      // Get user's repositories from GitHub API
      try {
        const response = await axios.get('https://api.github.com/user/repos', {
          headers: {
            Authorization: `token ${user.githubToken}`,
            Accept: 'application/vnd.github.v3+json'
          },
          params: {
            per_page: 100
          }
        });
        
        const userRepos = response.data;
        const userRepoFullNames = userRepos.map(repo => `${repo.owner.login}/${repo.name}`);
        
        // Check if user owns any of the repos in repos.json
        const matchingRepos = repos.filter(repo => {
          const repoFullName = `${repo.owner}/${repo.repo}`;
          return userRepoFullNames.includes(repoFullName);
        });
        
        if (matchingRepos.length > 0) {
          console.log(`User ${user.githubUsername} owns ${matchingRepos.length} repositories in our list`);
          
          // Grant permissions for each matching repo
          const userRef = db.collection('users').doc(user.id);
          const userDoc = await userRef.get();
          const userData = userDoc.data();
          
          // Get existing permissions
          const existingPermissions = userData.permissions || [];
          
          // Add new permissions
          const newPermissions = [...existingPermissions];
          
          for (const repo of matchingRepos) {
            // Check if permission already exists
            const existingPermIndex = newPermissions.findIndex(p => p.projectSlug === repo.slug);
            
            if (existingPermIndex >= 0) {
              console.log(`Permission for ${repo.slug} already exists for user ${user.githubUsername}`);
            } else {
              // Add new permission
              newPermissions.push({
                projectSlug: repo.slug,
                projectName: repo.repo,
                role: 'editor',
                grantedAt: new Date().toISOString()
              });
              console.log(`Granted editor permission for ${repo.slug} to user ${user.githubUsername}`);
            }
          }
          
          // Update user document with new permissions
          await userRef.update({
            permissions: newPermissions
          });
          
          console.log(`Updated permissions for user ${user.githubUsername}`);
        } else {
          console.log(`User ${user.githubUsername} does not own any repositories in our list`);
        }
        
      } catch (error) {
        console.error(`Error checking repositories for user ${user.githubUsername}:`, error.message);
      }
    }
    
    console.log('Repository ownership verification completed successfully!');
    
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

// Run the verification
verifyRepoOwnership().then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(err => {
  console.error('Script execution failed:', err);
  process.exit(1);
});
