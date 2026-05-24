/**
 * Admin API for Winner Claims
 *
 * GET  /api/admin/winner-claims — List all pending claims
 * PUT  /api/admin/winner-claims — Approve or reject a claim
 *
 * Uses firebase-admin SDK (bypasses security rules).
 */

import { db, auth } from '../../../lib/firebase/serverOnly';

export default async function handler(req, res) {
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

  // Check admin status
  const adminDoc = await db.collection('admins').doc(decodedToken.uid).get();
  if (!adminDoc.exists) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // GET — list pending claims with optional status filter and pagination
  if (req.method === 'GET') {
    try {
      const statusFilter = req.query.status || 'pending';
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
      let query = db
        .collection('winnerClaims')
        .where('status', '==', statusFilter)
        .orderBy('submittedAt', 'asc')
        .limit(limit);

      if (req.query.startAfter) {
        const startDoc = await db.collection('winnerClaims').doc(req.query.startAfter).get();
        if (startDoc.exists) {
          query = query.startAfter(startDoc);
        }
      }

      const snap = await query.get();

      const claims = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const lastVisible = snap.docs[snap.docs.length - 1];

      // Also fetch user display info for each claim
      const enriched = await Promise.all(
        claims.map(async (claim) => {
          try {
            const userDoc = await db.collection('users').doc(claim.uid).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              return {
                ...claim,
                githubUsername: userData.githubUsername || null,
                displayName: userData.displayName || null,
              };
            }
          } catch {
            // Non-fatal — just return the claim without user info
          }
          return claim;
        })
      );

      return res.status(200).json({
        claims: enriched,
        pagination: {
          nextCursor: lastVisible ? lastVisible.id : null,
          hasMore: snap.docs.length === limit,
        },
      });
    } catch (err) {
      console.error('Failed to load winner claims:', err);
      return res.status(500).json({ error: 'Failed to load claims' });
    }
  }

  // PUT — approve, reject, or mark as contacted
  if (req.method === 'PUT') {
    const { claimId, action, reason, notes } = req.body;

    if (!claimId || !['approve', 'reject', 'contacted'].includes(action)) {
      return res.status(400).json({
        error: 'claimId and action ("approve" | "reject" | "contacted") are required',
      });
    }

    if (action === 'reject' && !reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    try {
      const claimRef = db.collection('winnerClaims').doc(claimId);
      const claimDoc = await claimRef.get();

      if (!claimDoc.exists) {
        return res.status(404).json({ error: 'Claim not found' });
      }

      const claimData = claimDoc.data();

      if (claimData.status !== 'pending') {
        return res.status(409).json({ error: 'Claim is already processed' });
      }

      if (action === 'approve') {
        // Create hackathonWinners entry
        const now = new Date().toISOString();
        const wins = [
          {
            hackathonName: claimData.hackathonName,
            announcementUrl: claimData.announcementUrl,
            githubRepo: claimData.githubRepo,
            outcome: claimData.outcome || 'winner',
            verifiedBy: decodedToken.uid,
            verifiedAt: now,
          },
        ];

        await db.collection('hackathonWinners').doc(claimData.uid).set({
          uid: claimData.uid,
          wins,
          totalWins: 1,
          lastVerifiedAt: now,
          createdAt: now,
          updatedAt: now,
        });

        // Mark user as verified winner
        await db.collection('users').doc(claimData.uid).set(
          {
            verifiedWinner: true,
            winnerClaimPending: false,
            winnerVerifiedAt: now,
          },
          { merge: true }
        );

        // Update claim status
        await claimRef.update({
          status: 'approved',
          reviewedBy: decodedToken.uid,
          reviewedAt: now,
          updatedAt: now,
          ...(notes ? { reviewNotes: notes } : {}),
        });

        return res.status(200).json({
          success: true,
          action: 'approved',
          uid: claimData.uid,
        });
      }

      if (action === 'reject') {
        const now = new Date().toISOString();

        await claimRef.update({
          status: 'rejected',
          rejectionReason: reason,
          reviewedBy: decodedToken.uid,
          reviewedAt: now,
          updatedAt: now,
          ...(notes ? { reviewNotes: notes } : {}),
        });

        // Clear pending flag on user
        await db.collection('users').doc(claimData.uid).set(
          {
            winnerClaimPending: false,
            winnerRejectedAt: now,
            winnerRejectionReason: reason,
          },
          { merge: true }
        );

        return res.status(200).json({
          success: true,
          action: 'rejected',
          uid: claimData.uid,
        });
      }

      if (action === 'contacted') {
        const now = new Date().toISOString();

        await claimRef.update({
          contactedAt: now,
          reviewedBy: decodedToken.uid,
          updatedAt: now,
          ...(notes ? { reviewNotes: notes } : {}),
        });

        return res.status(200).json({
          success: true,
          action: 'contacted',
          claimId,
        });
      }
    } catch (err) {
      console.error('Failed to process winner claim:', err);
      return res.status(500).json({ error: 'Failed to process claim' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
