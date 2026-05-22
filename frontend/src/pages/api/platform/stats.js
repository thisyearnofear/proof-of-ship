/**
 * GET /api/platform/stats
 *
 * Returns lightweight public platform stats for the lead magnet progress bar.
 *
 * Response: { winnersOnboarded, targetWinners, totalClaims, verifiedThisWeek, updatedAt }
 *
 * Data sourced from a single Firestore doc: platformStats/stats
 * Written by the founder via the admin panel or Firebase Console.
 * Safe for public read — no PII.
 */

import { db } from '../../../lib/firebase/serverOnly';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const docRef = db.collection('platformStats').doc('stats');
    const snap = await docRef.get();

    if (!snap.exists) {
      // Return defaults — no admin has seeded the stats doc yet
      return res.status(200).json({
        winnersOnboarded: 0,
        targetWinners: 500,
        totalClaims: 0,
        verifiedThisWeek: 0,
        updatedAt: null,
      });
    }

    const data = snap.data();

    // Also compute live totalClaims for accuracy
    let totalClaims = 0;
    try {
      const claimsSnap = await db.collection('winnerClaims').count().get();
      totalClaims = claimsSnap.data().count || 0;
    } catch {
      totalClaims = data.totalClaims || 0;
    }

    return res.status(200).json({
      winnersOnboarded: data.winnersOnboarded || 0,
      targetWinners: data.targetWinners || 500,
      totalClaims,
      verifiedThisWeek: data.verifiedThisWeek || 0,
      updatedAt: data.updatedAt || null,
    });
  } catch (err) {
    console.error('Platform stats error:', err);
    return res.status(200).json({
      winnersOnboarded: 0,
      targetWinners: 500,
      totalClaims: 0,
      verifiedThisWeek: 0,
      updatedAt: null,
    });
  }
}
