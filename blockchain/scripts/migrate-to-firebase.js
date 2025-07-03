/**
 * This script migrates project data from celoProjects.js to Firebase Firestore
 * 
 * To run:
 * 1. Set up your Firebase credentials in .env.local
 * 2. Run: node scripts/migrate-to-firebase.js
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

const db = admin.firestore();

async function migrateProjects() {
  try {
    // Read the celoProjects.js file
    const celoProjectsPath = path.join(__dirname, '../src/constants/celoProjects.js');
    const fileContent = fs.readFileSync(celoProjectsPath, 'utf8');
    
    // Extract the projects array using regex
    const projectsMatch = fileContent.match(/export const celoProjects = \[([\s\S]*?)\];/);
    if (!projectsMatch) {
      throw new Error('Could not find celoProjects array in the file');
    }
    
    // Convert the string to a valid JSON array
    const projectsString = `[${projectsMatch[1]}]`;
    const sanitizedString = projectsString
      .replace(/\/\/ .*$/gm, '') // Remove comments
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/(\w+):/g, '"$1":') // Wrap keys in quotes
      .replace(/'/g, '"'); // Replace single quotes with double quotes
    
    // Parse the JSON
    const projects = JSON.parse(sanitizedString);
    console.log(`Found ${projects.length} projects to migrate`);
    
    // Batch write to Firestore
    const batch = db.batch();
    
    for (const project of projects) {
      const projectRef = db.collection('projects').doc(project.slug);
      batch.set(projectRef, {
        slug: project.slug,
        name: project.name,
        season: project.season,
        contracts: project.contracts || [],
        socials: project.socials || {},
        founders: project.founders || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Added project ${project.slug} to batch`);
    }
    
    // Commit the batch
    await batch.commit();
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration
migrateProjects().then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(err => {
  console.error('Script execution failed:', err);
  process.exit(1);
});
