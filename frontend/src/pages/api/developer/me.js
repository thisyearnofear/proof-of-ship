/**
 * GET /api/developer/me
 *
 * Identity + capability introspection for the authenticated caller.
 * This is the first call an agent makes to verify a key works and to learn
 * what it can do, without performing a real mutation.
 *
 * Works with either a developer API key or a Firebase session. For API keys,
 * also returns key metadata (scopes, status, expiry, last used).
 */

import { db } from '@/lib/firebase/serverOnly';
import { withDeveloperAuth } from '@/lib/developerAuth/middleware';
import { API_KEYS_COLLECTION } from '@/lib/developerAuth/keyLib';

function serializeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return typeof value === 'string' ? value : null;
}

async function handler(req, res) {
  const developer = req.developer;

  // Resolve a public handle for the owning user (best-effort).
  let handle = null;
  try {
    const userSnap = await db.collection('users').doc(developer.userId).get();
    if (userSnap.exists) {
      const u = userSnap.data();
      handle = u.githubUsername || u.displayName || null;
    }
  } catch (_) {
    /* non-fatal */
  }

  const base = {
    userId: developer.userId,
    auth: developer.type, // 'user' | 'api_key'
    handle,
  };

  if (developer.type !== 'api_key') {
    // Session callers own all capabilities on their account.
    return res.status(200).json({ ...base, scopes: 'all', key: null });
  }

  // API-key callers: include live key metadata so an agent can self-diagnose.
  let key = null;
  try {
    const keySnap = await db.collection(API_KEYS_COLLECTION).doc(developer.keyId).get();
    if (keySnap.exists) {
      const k = keySnap.data();
      key = {
        keyId: k.keyId,
        label: k.label || '',
        scopes: k.scopes || [],
        status: k.status || 'active',
        createdAt: serializeDate(k.createdAt),
        lastUsedAt: serializeDate(k.lastUsedAt),
        expiresAt: serializeDate(k.expiresAt),
      };
    }
  } catch (_) {
    /* fall back to middleware-provided context below */
  }

  return res.status(200).json({
    ...base,
    scopes: developer.scopes || [],
    key: key || {
      keyId: developer.keyId,
      label: developer.label || '',
      scopes: developer.scopes || [],
    },
  });
}

export default withDeveloperAuth(handler);
