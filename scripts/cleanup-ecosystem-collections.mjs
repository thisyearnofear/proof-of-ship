/**
 * Clean Up Ecosystem-Specific Project Collections
 *
 * After Phase 3.1 consolidated all projects into a single `projects`
 * collection, the per-ecosystem collections (projects_celo, projects_base,
 * etc.) are orphaned. This script deletes them.
 *
 * The `projects` collection already has all the data since Phase 3.1
 * stopped the dual-writes — these old collections are test/demo data.
 *
 * Usage: node scripts/cleanup-ecosystem-collections.mjs
 *
 * Requires FIREBASE_SERVICE_ACCOUNT env var or firebase-admin credentials.
 * Safe to run multiple times — collections that don't exist are skipped.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ECOSYSTEM_COLLECTIONS = [
  'projects_celo',
  'projects_base',
  'projects_solana',
  'projects_arc',
  'projects_linea',
  'projects_arbitrum',
  'projects_ethereum',
  'projects_optimism',
];

async function main() {
  // Initialize Firebase Admin
  if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeApp();
    } else {
      console.error('No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.');
      process.exit(1);
    }
  }

  const db = getFirestore();
  let totalDeleted = 0;

  for (const collectionName of ECOSYSTEM_COLLECTIONS) {
    const ref = db.collection(collectionName);
    const snapshot = await ref.get();

    if (snapshot.empty) {
      console.log(`[SKIP] ${collectionName} — empty or doesn't exist`);
      continue;
    }

    console.log(`[DELETE] ${collectionName} — ${snapshot.size} docs`);

    // Delete in batches of 500 (Firestore limit)
    let batch = db.batch();
    let batchCount = 0;
    let collectionDeleted = 0;

    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      batchCount++;
      collectionDeleted++;

      if (batchCount === 500) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    totalDeleted += collectionDeleted;
    console.log(`[DONE] ${collectionName} — deleted ${collectionDeleted} docs`);
  }

  console.log(`\nCleanup complete. Deleted ${totalDeleted} documents across ${ECOSYSTEM_COLLECTIONS.length} collections.`);
}

main().catch(console.error);
