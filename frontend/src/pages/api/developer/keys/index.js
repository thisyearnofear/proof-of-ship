import { db } from '@/lib/firebase/serverOnly';
import { withDeveloperAuth } from '@/lib/developerAuth/middleware';
import { API_KEYS_COLLECTION, AUDIT_COLLECTION, createApiKeyMaterial, keyUsability, normalizeScopes } from '@/lib/developerAuth/keyLib';

function serializeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return typeof value === 'string' ? value : null;
}

function publicView(data) {
  return {
    keyId: data.keyId,
    label: data.label || '',
    scopes: data.scopes || [],
    status: data.status || 'active',
    createdAt: serializeDate(data.createdAt),
    lastUsedAt: serializeDate(data.lastUsedAt),
    revokedAt: serializeDate(data.revokedAt),
    expiresAt: serializeDate(data.expiresAt),
  };
}

async function handler(req, res) {
  const userId = req.developer.userId;
  if (req.method === 'GET') {
    const snap = await db.collection(API_KEYS_COLLECTION).where('userId', '==', userId).get();
    const keys = snap.docs.map((doc) => publicView(doc.data()))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return res.status(200).json({ keys });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { scopes, label = '', expiresInDays } = req.body || {};
  const normalized = normalizeScopes(scopes);
  if (!normalized.valid) return res.status(400).json({ error: 'Invalid scopes', errors: normalized.errors });
  if (typeof label !== 'string' || label.length > 120) {
    return res.status(400).json({ error: 'label must be a string of at most 120 characters' });
  }
  if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 365) {
    return res.status(400).json({ error: 'expiresInDays must be an integer from 1 to 365' });
  }

  const material = createApiKeyMaterial({ userId, scopes: normalized.scopes, label: label.trim(), expiresInDays });
  const keyRef = db.collection(API_KEYS_COLLECTION).doc(material.keyId);
  const auditRef = db.collection(AUDIT_COLLECTION).doc();
  try {
    await db.runTransaction(async (transaction) => {
      const activeQuery = db.collection(API_KEYS_COLLECTION)
        .where('userId', '==', userId);
      const [collision, active] = await Promise.all([
        transaction.get(keyRef),
        transaction.get(activeQuery),
      ]);
      if (collision.exists) {
        const error = new Error('Key ID collision; retry creation');
        error.statusCode = 409;
        throw error;
      }
      const activeCount = Array.isArray(active.docs)
        ? active.docs.filter((doc) => keyUsability(doc.data()).usable).length
        : active.size;
      if (activeCount >= 10) {
        const error = new Error('Active API key limit reached');
        error.statusCode = 409;
        throw error;
      }
      transaction.create(keyRef, material.doc);
      transaction.create(auditRef, {
        action: 'key_created', actorUserId: userId, keyId: material.keyId,
        scopes: normalized.scopes, createdAt: new Date(),
      });
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Internal server error' });
  }
  return res.status(201).json({ apiKey: material.key, keyId: material.keyId, details: publicView(material.doc) });
}

export default withDeveloperAuth(handler, { allowApiKey: false });
