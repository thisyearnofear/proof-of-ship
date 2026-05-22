/**
 * POST /api/winner-verification/claim
 *
 * Submits a hackathon winner claim for manual review.
 * Creates a doc in the `winnerClaims` collection. The founder
 * reviews via the admin panel and writes to `hackathonWinners` on approval.
 *
 * Body: { hackathonName, announcementUrl, githubRepo, outcome }
 * Response: { success, claimId }
 */

import { db } from '../../../lib/firebase/serverOnly';
import { admin } from '../../../lib/firebase/serverOnly';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate via Firebase Auth token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const uid = decodedToken.uid;
  const { hackathonName, announcementUrl, githubRepo, outcome } = req.body;

  // Validate required fields
  if (!hackathonName || !hackathonName.trim()) {
    return res.status(400).json({ error: 'Hackathon name is required' });
  }

  if (!announcementUrl || !announcementUrl.trim()) {
    return res.status(400).json({ error: 'Announcement URL is required' });
  }

  if (!githubRepo || !githubRepo.trim()) {
    return res.status(400).json({ error: 'GitHub repo URL is required' });
  }

  if (!['winner', 'finalist'].includes(outcome)) {
    return res.status(400).json({ error: 'Outcome must be "winner" or "finalist"' });
  }

  // Check if user already has a pending claim
  const existingClaims = await db
    .collection('winnerClaims')
    .where('uid', '==', uid)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!existingClaims.empty) {
    return res.status(409).json({
      error: 'You already have a pending claim. Please wait for the founder to review it.',
    });
  }

  // Check if user is already verified
  const winnerDoc = await db.collection('hackathonWinners').doc(uid).get();
  if (winnerDoc.exists) {
    return res.status(409).json({
      error: 'You are already verified as a hackathon winner.',
    });
  }

  // Create claim
  const now = new Date().toISOString();
  const claimRef = await db.collection('winnerClaims').add({
    uid,
    hackathonName: hackathonName.trim(),
    announcementUrl: announcementUrl.trim(),
    githubRepo: githubRepo.trim(),
    outcome,
    status: 'pending',
    submittedAt: now,
    updatedAt: now,
  });

  // Also set a flag on the user document so we can show "pending" state without
  // hitting the full claim list
  await db.collection('users').doc(uid).set(
    {
      winnerClaimPending: true,
      winnerClaimId: claimRef.id,
      winnerClaimSubmittedAt: now,
    },
    { merge: true }
  );

  return res.status(201).json({
    success: true,
    claimId: claimRef.id,
  });
}
