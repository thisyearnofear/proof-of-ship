import { db } from "@/lib/firebase/adminApp";
import { withApiMiddleware } from "@/utils/apiMiddleware";

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { id } = req.query || {};
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing id' });
  }
  try {
    const fbRef = db.collection('feedback').doc(id);
    const fbSnap = await fbRef.get();
    if (!fbSnap.exists) return res.status(404).json({ error: 'Not found' });
    const feedback = { id: fbSnap.id, ...fbSnap.data() };

    let user = null;
    if (feedback.submittedBy) {
      const userSnap = await db.collection('users').doc(feedback.submittedBy).get();
      if (userSnap.exists) user = { id: userSnap.id, ...userSnap.data() };
    }

    return res.status(200).json({ feedback, user });
  } catch (e) {
    console.error('lookup error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withApiMiddleware(handler, { allowedMethods: ['GET'], rateLimit: 30, rateLimitKey: 'FEEDBACK_LOOKUP' });
