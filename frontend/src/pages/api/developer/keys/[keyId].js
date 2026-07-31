import { db } from '@/lib/firebase/serverOnly';
import { withDeveloperAuth } from '@/lib/developerAuth/middleware';
import { API_KEYS_COLLECTION, AUDIT_COLLECTION } from '@/lib/developerAuth/keyLib';

async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const keyId = typeof req.query.keyId === 'string' ? req.query.keyId : '';
  if (!/^[A-Za-z0-9_-]{22}$/.test(keyId)) return res.status(404).json({ error: 'API key not found' });
  const ref = db.collection(API_KEYS_COLLECTION).doc(keyId);
  const auditRef = db.collection(AUDIT_COLLECTION).doc();
  try {
    const result = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists || snap.data().userId !== req.developer.userId) return null;
      const data = snap.data();
      if (data.status === 'revoked') return { keyId, status: 'revoked', revokedAt: data.revokedAt };
      const revokedAt = new Date();
      transaction.update(ref, { status: 'revoked', revokedAt });
      transaction.create(auditRef, {
        action: 'key_revoked', actorUserId: req.developer.userId, keyId, createdAt: revokedAt,
      });
      return { keyId, status: 'revoked', revokedAt };
    });
    if (!result) return res.status(404).json({ error: 'API key not found' });
    return res.status(200).json(result);
  } catch (_) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withDeveloperAuth(handler, { allowApiKey: false });
