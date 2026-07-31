/**
 * GET /api/developer/activity
 *
 * Returns the authenticated user's recent API-key audit events, so the
 * dashboard can answer "what did my agent do?" This is the human trust
 * surface for delegated access.
 *
 * Query: ?limit=20 (max 100)
 * Only the owning user's events are returned.
 */

import { db } from '@/lib/firebase/serverOnly';
import { withDeveloperAuth } from '@/lib/developerAuth/middleware';
import { AUDIT_COLLECTION } from '@/lib/developerAuth/keyLib';

function serializeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return typeof value === 'string' ? value : null;
}

async function handler(req, res) {
  const userId = req.developer.userId;

  const rawLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;

  let snap;
  try {
    snap = await db
      .collection(AUDIT_COLLECTION)
      .where('actorUserId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
  } catch (error) {
    // Most commonly a missing composite index; surface a clean 500.
    return res.status(500).json({ error: 'Failed to load activity', details: error.message });
  }

  const events = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      action: data.action || null,
      resource: data.resource || null,
      keyId: data.keyId || null,
      outcome: data.outcome || null,
      createdAt: serializeDate(data.createdAt),
    };
  });

  return res.status(200).json({ events });
}

// Session-only: this is a dashboard feature, not an agent capability.
export default withDeveloperAuth(handler, { allowApiKey: false });
