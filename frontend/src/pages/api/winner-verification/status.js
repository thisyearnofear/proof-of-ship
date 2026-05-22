/**
 * GET /api/winner-verification/status
 *
 * Returns the current user's winner verification state.
 * Checks both `hackathonWinners` (verified) and `winnerClaims` (pending).
 *
 * Response: { verified, wins, hasPendingClaim }
 */

import { db, auth } from '../../../lib/firebase/serverOnly';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const uid = decodedToken.uid;

  // Check hackathonWinners (verified)
  const winnerDoc = await db.collection('hackathonWinners').doc(uid).get();

  if (winnerDoc.exists) {
    const data = winnerDoc.data();
    return res.status(200).json({
      verified: true,
      wins: data.wins || [],
      totalWins: data.totalWins || 0,
      lastVerifiedAt: data.lastVerifiedAt || null,
      hasPendingClaim: false,
    });
  }

  // Compute queue position for pending claims
  let queuePosition = null;
  let totalPending = 0;

  try {
    const allPendingSnap = await db
      .collection('winnerClaims')
      .where('status', '==', 'pending')
      .orderBy('submittedAt', 'asc')
      .get();

    totalPending = allPendingSnap.size;
    const idx = allPendingSnap.docs.findIndex(d => d.data().uid === uid);
    if (idx >= 0) queuePosition = idx + 1;
  } catch {
    // Non-fatal — queue position is a nice-to-have
  }

  // Check winnerClaims (pending)
  const claimsSnap = await db
    .collection('winnerClaims')
    .where('uid', '==', uid)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!claimsSnap.empty) {
    const claim = claimsSnap.docs[0].data();
    return res.status(200).json({
      verified: false,
      wins: [],
      hasPendingClaim: true,
      queuePosition,
      totalPending,
      pendingClaim: {
        id: claimsSnap.docs[0].id,
        hackathonName: claim.hackathonName,
        submittedAt: claim.submittedAt,
        email: claim.email || null,
        wantsCall: Boolean(claim.wantsCall),
      },
    });
  }

  // Also check for rejected claims
  const rejectedSnap = await db
    .collection('winnerClaims')
    .where('uid', '==', uid)
    .where('status', '==', 'rejected')
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get();

  if (!rejectedSnap.empty) {
    const claim = rejectedSnap.docs[0].data();
    return res.status(200).json({
      verified: false,
      wins: [],
      hasPendingClaim: false,
      rejectedClaim: {
        id: rejectedSnap.docs[0].id,
        hackathonName: claim.hackathonName,
        reason: claim.rejectionReason || null,
        rejectedAt: claim.updatedAt,
      },
    });
  }

  // Not verified, no claims
  return res.status(200).json({
    verified: false,
    wins: [],
    hasPendingClaim: false,
  });
}
