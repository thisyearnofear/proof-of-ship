/**
 * This script automatically grants project permissions based on GitHub usernames in the founders field
 * 
 * To run:
 * 1. Set up your Firebase credentials in .env.local
 * 2. Run: node scripts/auto-grant-permissions.js
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fetch = require('node-fetch');

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

// Helper function to extract GitHub username from URL
function extractGithubUsername(url) {
  if (!url) return null;
  
  // Try to extract from common GitHub URL patterns
  const githubPatterns = [
    /github\.com\/([^\/\?#]+)/i,                // github.com/username
    /x\.com\/([^\/\?#]+)/i,                     // x.com/username (Twitter)
    /twitter\.com\/([^\/\?#]+)/i,               // twitter.com/username
    /warpcast\.com\/([^\/\?#]+)/i,              // warpcast.com/username
    /hey\.xyz\/u\/([^\/\?#]+)/i,                // hey.xyz/u/username
    /lens\.xyz\/@([^\/\?#]+)/i,                 // lens.xyz/@username
    /([^\/\?#]+)\.eth/i                         // username.eth
  ];
  
  for (const pattern of githubPatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
  }
  
  // If no pattern matches, just use the name as is if it looks like a username
  return null;
}

async function autoGrantPermissions() {
  try {
    console.log('Starting automatic permission granting...');
    
    // Get all projects
    const projectsSnapshot = await db.collection('projects').get();
    console.log(`Found ${projectsSnapshot.size} projects`);
    
    let permissionsGranted = 0;
    
    for (const projectDoc of projectsSnapshot.docs) {
      const projectData = projectDoc.data();
      const projectSlug = projectDoc.id;
      const founders = projectData.founders || [];
      
      console.log(`\nProcessing project: ${projectData.name} (${projectSlug})`);
      
      if (founders.length === 0) {
        console.log(`  No founders found for project ${projectSlug}`);
        continue;
      }
      
      console.log(`  Found ${founders.length} founders`);
      
      // Process each founder
      for (const founder of founders) {
        const founderName = founder.name;
        const founderUrl = founder.url;
        
        console.log(`  Processing founder: ${founderName}`);
        
        // Try to extract GitHub username from URL or name
        let githubUsername = extractGithubUsername(founderUrl);
        
        // If no URL or couldn't extract from URL, use the name as a fallback
        if (!githubUsername && founderName) {
          // Remove .eth suffix if present
          githubUsername = founderName.replace(/\.eth$/i, '').toLowerCase();
        }
        
        if (!githubUsername) {
          console.log(`    Could not determine GitHub username for ${founderName}`);
          continue;
        }
        
        console.log(`    Using GitHub username: ${githubUsername}`);
        
        // Create a pending permission for this GitHub username
        const pendingPermissionRef = db.collection('pendingPermissions').doc(`${githubUsername}-${projectSlug}`);
        await pendingPermissionRef.set({
          githubUsername,
          projectSlug,
          projectName: projectData.name,
          role: 'editor',
          grantedAt: new Date().toISOString()
        });
        
        console.log(`    Created pending permission for ${githubUsername} on project ${projectSlug}`);
        permissionsGranted++;
      }
    }
    
    console.log(`\nCompleted! Created ${permissionsGranted} pending permissions`);
    
  } catch (error) {
    console.error('Error granting permissions:', error);
  }
}

// Run the function
autoGrantPermissions().then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(err => {
  console.error('Script execution failed:', err);
  process.exit(1);
});
