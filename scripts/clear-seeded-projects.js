/**
 * Clear Seeded Projects Script
 *
 * Removes skeleton projects from the generic `projects` Firestore collection
 * that were created by the create-project.js script. These have empty
 * descriptions and no ecosystem/category — they exist in the generic collection
 * but real submissions live in ecosystem-specific collections (projects_solana, etc.).
 *
 * The backer discovery page loads from ecosystem collections and applies a
 * quality gate, so these empty projects are already invisible to backers.
 * This script cleans them up for a healthier Firestore.
 *
 * Usage:
 *   node scripts/clear-seeded-projects.js
 *
 * Safety:
 *   - Only deletes projects with empty descriptions
 *   - Preserves any project that has a real description (>15 chars)
 *   - Logs every deletion for audit
 */

const path = require('path');

// Load Firebase Admin from the frontend's server-side setup
// or from environment variables
let admin;
try {
  admin = require('firebase-admin');
} catch {
  console.error('firebase-admin not found. Install it: npm install firebase-admin');
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId) {
    // Try loading from .env.local
    try {
      require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
      require('dotenv').config({ path: path.join(__dirname, '..', 'frontend', '.env.local') });
      serviceAccount.projectId = process.env.FIREBASE_PROJECT_ID;
      serviceAccount.clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      serviceAccount.privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    } catch {}
  }

  if (!serviceAccount.projectId) {
    console.error('Missing FIREBASE_PROJECT_ID. Set env vars or create frontend/.env.local');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function main() {
  console.log('=== Clear Seeded Projects ===\n');

  const snapshot = await db.collection('projects').get();
  console.log(`Found ${snapshot.size} projects in generic 'projects' collection\n`);

  const toDelete = [];
  const toKeep = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const description = (data.description || '').trim();
    const hasEcosystem = !!(data.ecosystem || '').trim();
    const hasGithub = !!(data.githubUrl || (data.owner && data.repo));

    // Project is "seeded" (skeleton) if it lacks description or ecosystem
    if (description.length < 15 && !hasGithub) {
      toDelete.push({ id: doc.id, name: data.name, description: description.slice(0, 50) });
    } else {
      toKeep.push({ id: doc.id, name: data.name });
    }
  }

  console.log(`Projects to delete (skeleton): ${toDelete.length}`);
  console.log(`Projects to keep (real data): ${toKeep.length}\n`);

  if (toDelete.length === 0) {
    console.log('Nothing to delete. All projects have real data.');
    return;
  }

  console.log('Will delete:');
  for (const p of toDelete) {
    console.log(`  - ${p.id} (${p.name || 'unnamed'})${p.description ? `: "${p.description}..."` : ''}`);
  }

  console.log('\nWill keep:');
  for (const p of toKeep) {
    console.log(`  - ${p.id} (${p.name || 'unnamed'})`);
  }

  // Safety: require --confirm flag
  if (!process.argv.includes('--confirm')) {
    console.log('\n⚠️  Dry run. To actually delete, run:');
    console.log('  node scripts/clear-seeded-projects.js --confirm');
    return;
  }

  console.log('\nDeleting...\n');

  const batch = db.batch();
  for (const p of toDelete) {
    batch.delete(db.collection('projects').doc(p.id));
    console.log(`  Deleted: ${p.id}`);
  }

  await batch.commit();
  console.log(`\nDone. Deleted ${toDelete.length} skeleton projects.`);
  console.log(`${toKeep.length} real projects preserved.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
