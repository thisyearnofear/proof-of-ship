import { db, auth } from '@/lib/firebase/serverOnly';
import { API_KEYS_COLLECTION, keyUsability, parseBearer, prefixFromKey, verifyApiKey } from './keyLib';

const UNAUTHORIZED = { error: 'Unauthorized', status: 'unauthorized' };

export async function resolveApiKey(rawKey) {
  const keyId = prefixFromKey(rawKey);
  if (!keyId) return { ok: false };
  const ref = db.collection(API_KEYS_COLLECTION).doc(keyId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false };
  const data = snap.data();
  // Digest verification deliberately precedes status, revocation, and expiry checks.
  if (!verifyApiKey(rawKey, data.keyHash)) return { ok: false };
  if (!keyUsability(data).usable) return { ok: false };
  ref.update({ lastUsedAt: new Date() }).catch(() => {});
  return {
    ok: true,
    context: {
      type: 'api_key', userId: data.userId, keyId, scopes: data.scopes || [], label: data.label || '',
    },
  };
}

export function withDeveloperAuth(handler, options = {}) {
  const { requiredScopes = [], allowUser = true, allowApiKey = true } = options;
  return async (req, res) => {
    const xKey = req.headers['x-api-key'];
    const authorization = req.headers.authorization || req.headers.Authorization;
    if (xKey != null && authorization != null) return res.status(401).json(UNAUTHORIZED);

    let context;
    if (xKey != null) {
      if (!allowApiKey || typeof xKey !== 'string') return res.status(401).json(UNAUTHORIZED);
      context = (await resolveApiKey(xKey)).context;
    } else if (authorization != null) {
      const credential = parseBearer(authorization);
      if (!credential) return res.status(401).json(UNAUTHORIZED);
      if (credential.startsWith('pos_live_')) {
        if (!allowApiKey) return res.status(401).json(UNAUTHORIZED);
        context = (await resolveApiKey(credential)).context;
      } else if (allowUser) {
        try {
          const decoded = await auth.verifyIdToken(credential);
          context = { type: 'user', userId: decoded.uid };
        } catch (_) {
          return res.status(401).json(UNAUTHORIZED);
        }
      }
    }
    if (!context) return res.status(401).json(UNAUTHORIZED);
    if (context.type === 'api_key' && requiredScopes.some((scope) => !context.scopes.includes(scope))) {
      return res.status(403).json({ error: 'Insufficient scope', status: 'forbidden' });
    }
    req.developer = context;
    return handler(req, res);
  };
}

export async function authorizeProject(dbInstance, userId, project, transaction = null) {
  if (Array.isArray(project?.owners) && project.owners.includes(userId)) return true;
  const ref = dbInstance.collection('admins').doc(userId);
  const snap = transaction ? await transaction.get(ref) : await ref.get();
  return snap.exists;
}
