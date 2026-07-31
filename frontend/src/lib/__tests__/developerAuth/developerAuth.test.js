/**
 * Developer auth middleware + key lifecycle routes — integration tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Chainable Firestore mock ------------------------------------------------
function makeDocRef(data = null) {
  return {
    get: vi.fn(async () => ({ exists: !!data, data: () => data })),
    set: vi.fn(async () => undefined),
    update: vi.fn(async () => undefined),
  };
}

const firestoreState = {
  docs: {}, // docId -> data
  collections: {}, // name -> { docs: [], where: fn }
};

const collectionMock = (name) => {
  const col = {
    doc: (id) => makeDocRef(firestoreState.docs[`${name}/${id}`] || null),
    where: vi.fn(() => col),
    orderBy: vi.fn(() => col),
    limit: vi.fn(() => col),
    get: vi.fn(async () => ({
      docs: (firestoreState.collections[name] || []).map((d) => ({
        id: d.id,
        data: () => d.data,
      })),
      size: (firestoreState.collections[name] || []).length,
      empty: !(firestoreState.collections[name] || []).length,
    })),
  };
  return col;
};

vi.mock('@/lib/firebase/serverOnly', () => ({
  db: {
    collection: (name) => collectionMock(name),
    runTransaction: vi.fn(async (callback) => callback({
      get: vi.fn(async () => ({ exists: false, size: 0, data: () => null })),
      create: vi.fn(),
      update: vi.fn(),
    })),
  },
  auth: {
    verifyIdToken: vi.fn(async (token) => {
      if (token === 'good-token') return { uid: 'user-123' };
      throw new Error('bad token');
    }),
  },
}));

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = vi.fn((c) => { res.statusCode = c; return res; });
  res.json = vi.fn((b) => { res.body = b; return res; });
  return res;
}

describe('withDeveloperAuth middleware', () => {
  beforeEach(() => {
    firestoreState.docs = {};
    firestoreState.collections = {};
  });

  it('rejects requests with no credentials (fails closed)', async () => {
    const { withDeveloperAuth } = await import('../../developerAuth/middleware');
    const handler = vi.fn();
    const wrapped = withDeveloperAuth(handler);

    const res = mockRes();
    await wrapped({ headers: {} }, res);

    expect(res.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it('authenticates a Firebase session', async () => {
    const { withDeveloperAuth } = await import('../../developerAuth/middleware');
    const handler = vi.fn();
    const wrapped = withDeveloperAuth(handler);

    const req = { headers: { authorization: 'Bearer good-token' } };
    const res = mockRes();
    await wrapped(req, res);

    expect(handler).toHaveBeenCalled();
    expect(req.developer).toEqual({ type: 'user', userId: 'user-123' });
  });

  it('rejects an invalid Firebase token', async () => {
    const { withDeveloperAuth } = await import('../../developerAuth/middleware');
    const handler = vi.fn();
    const wrapped = withDeveloperAuth(handler);

    const res = mockRes();
    await wrapped({ headers: { authorization: 'Bearer nope' } }, res);

    expect(res.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it('authenticates a valid developer API key and enforces scopes', async () => {
    const { createApiKeyMaterial } = await import('../../developerAuth/keyLib');
    const { key, keyId, doc } = createApiKeyMaterial({
      userId: 'user-123',
      scopes: ['proofs:write'],
      label: 'ci',
    });
    firestoreState.docs[`developer_api_keys/${keyId}`] = doc;

    const { withDeveloperAuth } = await import('../../developerAuth/middleware');
    const handler = vi.fn();

    // Requires a scope the key does NOT have -> 403
    const forbidden = withDeveloperAuth(handler, { requiredScopes: ['projects:write'] });
    const res403 = mockRes();
    await forbidden({ headers: { 'x-api-key': key } }, res403);
    expect(res403.statusCode).toBe(403);

    // Requires a scope the key HAS -> passes
    const ok = withDeveloperAuth(handler, { requiredScopes: ['proofs:write'] });
    const req = { headers: { 'x-api-key': key } };
    const res200 = mockRes();
    await ok(req, res200);
    expect(handler).toHaveBeenCalled();
    expect(req.developer.type).toBe('api_key');
    expect(req.developer.keyId).toBe(keyId);
  });

  it('rejects a revoked API key', async () => {
    const { createApiKeyMaterial } = await import('../../developerAuth/keyLib');
    const { key, keyId, doc } = createApiKeyMaterial({
      userId: 'user-123',
      scopes: ['proofs:write'],
    });
    firestoreState.docs[`developer_api_keys/${keyId}`] = { ...doc, status: 'revoked', revokedAt: 'x' };

    const { withDeveloperAuth } = await import('../../developerAuth/middleware');
    const wrapped = withDeveloperAuth(vi.fn());
    const res = mockRes();
    await wrapped({ headers: { 'x-api-key': key } }, res);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized', status: 'unauthorized' });
  });

  it('authorizes projects only through owners or the admins collection', async () => {
    const { authorizeProject } = await import('../../developerAuth/middleware');
    const db = { collection: () => ({ doc: () => ({ get: async () => ({ exists: false }) }) }) };

    await expect(authorizeProject(db, 'owner-1', { owners: ['owner-1'] })).resolves.toBe(true);
    await expect(authorizeProject(db, 'legacy-user', {
      owners: [],
      submittedBy: 'legacy-user',
      creatorId: 'legacy-user',
      teamMembers: [{ userId: 'legacy-user', role: 'admin' }],
    })).resolves.toBe(false);
  });

  it('does not treat a Firebase bearer token as an API key', async () => {
    const { withDeveloperAuth } = await import('../../developerAuth/middleware');
    const handler = vi.fn();
    // allowApiKey false means only Firebase is accepted on the keys routes
    const wrapped = withDeveloperAuth(handler, { allowApiKey: false });

    const req = { headers: { authorization: 'Bearer good-token' } };
    const res = mockRes();
    await wrapped(req, res);
    expect(req.developer.type).toBe('user');
  });
});

describe('GET/POST /api/developer/keys', () => {
  beforeEach(() => {
    firestoreState.docs = {};
    firestoreState.collections = {};
  });

  it('returns 401 without auth', async () => {
    const handler = (await import('../../../pages/api/developer/keys/index')).default;
    const res = mockRes();
    await handler({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(401);
  });

  it('lists keys for the authenticated user (no secrets)', async () => {
    firestoreState.collections['developer_api_keys'] = [
      { id: 'k1', data: { keyId: 'k1', label: 'a', scopes: ['proofs:write'], status: 'active', keyHash: 'deadbeef', secretHint: 'abcd1234', createdAt: '2026-01-01' } },
    ];
    const handler = (await import('../../../pages/api/developer/keys/index')).default;
    const res = mockRes();
    await handler({ method: 'GET', headers: { authorization: 'Bearer good-token' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.keys).toHaveLength(1);
    expect(res.body.keys[0].keyId).toBe('k1');
    // The hash is never exposed.
    expect(JSON.stringify(res.body)).not.toContain('deadbeef');
  });

  it('rejects key creation with invalid scopes', async () => {
    const handler = (await import('../../../pages/api/developer/keys/index')).default;
    const res = mockRes();
    await handler({
      method: 'POST',
      headers: { authorization: 'Bearer good-token' },
      body: { scopes: ['nope:bad'] },
    }, res);
    expect(res.statusCode).toBe(400);
  });

  it('creates a key and returns the secret exactly once', async () => {
    const handler = (await import('../../../pages/api/developer/keys/index')).default;
    const res = mockRes();
    await handler({
      method: 'POST',
      headers: { authorization: 'Bearer good-token' },
      body: { scopes: ['projects:write', 'proofs:write'], label: 'deploy', expiresInDays: 30 },
    }, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.apiKey).toMatch(/^pos_live_/);
    expect(res.body.keyId).toBeTruthy();
    expect(res.body.details.scopes).toEqual(['projects:write', 'proofs:write']);
    // The full secret is not echoed back inside the details payload.
    expect(JSON.stringify(res.body.details)).not.toContain(res.body.apiKey);
  });

  it('rejects dual Firebase and API-key credentials without fallback', async () => {
    const { withDeveloperAuth } = await import('../../developerAuth/middleware');
    const wrapped = withDeveloperAuth(vi.fn());
    const res = mockRes();
    await wrapped({ headers: { authorization: 'Bearer good-token', 'x-api-key': 'bad' } }, res);
    expect(res.statusCode).toBe(401);
  });
});
