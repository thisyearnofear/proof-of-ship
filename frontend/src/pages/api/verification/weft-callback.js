import { db } from '@/lib/firebase/serverOnly';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { milestone_id, status, evidence } = req.body;

  if (!milestone_id || !status) {
    return res.status(400).json({ error: 'Missing milestone_id or status' });
  }

  try {
    await db.collection('weftVerifications').doc(milestone_id).set({
      verificationStatus: status,
      evidence: evidence || null,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`[Weft Hook] Milestone ${milestone_id} status updated to: ${status}`);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Weft Hook] Error updating milestone:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
