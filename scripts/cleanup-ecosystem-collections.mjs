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
 * Reads Firebase credentials from .env.local (FIREBASE_PROJECT_ID,
 * FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).
 * Safe to run multiple times — collections that don't exist are skipped.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local from project root — manually parse multi-line PEM key
const __dirname = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8');
const envLines = envText.split('\n');
let env = {};
let currentKey = null;
let currentVal = '';
for (const line of envLines) {
  if (line.startsWith('FIREBASE_') && line.includes('=')) {
    if (currentKey) env[currentKey] = currentVal;
    const eqIdx = line.indexOf('=');
    currentKey = line.slice(0, eqIdx);
    currentVal = line.slice(eqIdx + 1);
  } else if (currentKey) {
    currentVal += '\n' + line;
  }
}
if (currentKey) env[currentKey] = currentVal;

const { initializeApp, getApps, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');

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
  if (!getApps().length) {
    const projectId = env.FIREBASE_PROJECT_ID;
    const clientEmail = env.FIREBASE_CLIENT_EMAIL;
    const privateKey = env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error('Missing Firebase credentials in .env.local');
      process.exit(1);
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,  // dotenv handles multi-line values correctly
      }),
    });
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
