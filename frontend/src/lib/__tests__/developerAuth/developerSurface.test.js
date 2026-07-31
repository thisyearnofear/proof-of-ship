/**
 * /api/developer/me and /api/developer/activity — integration tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Chainable Firestore mock (mirrors developerAuth.test.js) ----------------
function makeDocRef(data = null) {
  return {
    get: vi.fn(async () => ({ exists: !!data, data: () => data })),
    set: vi.fn(async () => undefined),
    update: vi.fn(async () => undefined),
  };
}

const firestoreState = { docs: {}, collections: {} };

const collectionMock = (name) => {
  const col = {
    doc: (id) => makeDocRef(firestoreState.docs[`${name}/${id}`] || null),
    where: vi.fn(() => col),
    orderBy: vi.fn(() => col),
    limit: vi.fn(() => col),
    get: vi.fn(async () => ({
      docs: (firestoreState.collections[name] || []).map((d) => ({ id: d.id, data: () => d.data })),
      size: (firestoreState.collections[name] || []).length,
      empty: !(firestoreState.collections[name] || []).length,
    })),
  };
  return col;
};

vi.mock('@/lib/firebase/serverOnly', () => ({
  db: {
    collection: (name) => collectionMock(name),
    runTransaction: vi.fn(async (cb) => cb({
      get: vi.fn(async () => ({ exists: false, data: () => null })),
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

describe('GET /api/developer/me', () => {
  beforeEach(() => {
    firestoreState.docs = {};
    firestoreState.collections = {};
  });

  it('returns 401 without auth', async () => {
    const handler = (await import('../../../pages/api/developer/me')).default;
    const res = mockRes();
    await handler({ headers: {} }, res);
    expect(res.statusCode).toBe(401);
  });

  it('reports session identity with all scopes', async () => {
    firestoreState.docs['users/user-123'] = { githubUsername: 'devjane' };
    const handler = (await import('../../../pages/api/developer/me')).default;
    const res = mockRes();
    await handler({ headers: { authorization: 'Bearer good-token' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.userId).toBe('user-123');
    expect(res.body.auth).toBe('user');
    expect(res.body.handle).toBe('devjane');
    expect(res.body.scopes).toBe('all');
    expect(res.body.key).toBeNull();
  });

  it('reports API-key identity with scoped key metadata', async () => {
    const { createApiKeyMaterial } = await import('../../developerAuth/keyLib');
    const { key, keyId, doc } = createApiKeyMaterial({
      userId: 'user-123',
      scopes: ['proofs:write'],
      label: 'ci-agent',
    });
    firestoreState.docs[`developer_api_keys/${keyId}`] = doc;
    firestoreState.docs['users/user-123'] = { githubUsername: 'devjane' };

    const handler = (await import('../../../pages/api/developer/me')).default;
    const res = mockRes();
    await handler({ headers: { 'x-api-key': key } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.auth).toBe('api_key');
    expect(res.body.handle).toBe('devjane');
    expect(res.body.scopes).toEqual(['proofs:write']);
    expect(res.body.key.keyId).toBe(keyId);
    expect(res.body.key.label).toBe('ci-agent');
    expect(res.body.key.status).toBe('active');
    // Never exposes the key hash.
    expect(JSON.stringify(res.body)).not.toContain(doc.keyHash);
  });
});

describe('GET /api/developer/activity', () => {
  beforeEach(() => {
    firestoreState.docs = {};
    firestoreState.collections = {};
  });

  it('returns 401 without auth', async () => {
    const handler = (await import('../../../pages/api/developer/activity')).default;
    const res = mockRes();
    await handler({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(401);
  });

  it('rejects API-key callers (dashboard-only)', async () => {
    const { createApiKeyMaterial } = await import('../../developerAuth/keyLib');
    const { key, keyId, doc } = createApiKeyMaterial({ userId: 'user-123', scopes: ['proofs:write'] });
    firestoreState.docs[`developer_api_keys/${keyId}`] = doc;

    const handler = (await import('../../../pages/api/developer/activity')).default;
    const res = mockRes();
    await handler({ method: 'GET', headers: { 'x-api-key': key } }, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns recent events for the session user', async () => {
    firestoreState.collections['developer_api_audit'] = [
      { id: 'e1', data: { action: 'project_created', resource: 'projects/my-proj', keyId: 'abcdef12', outcome: 'success', createdAt: new Date() } },
      { id: 'e2', data: { action: 'key_created', keyId: 'abcdef12', outcome: 'success', createdAt: new Date() } },
    ];
    const handler = (await import('../../../pages/api/developer/activity')).default;
    const res = mockRes();
    await handler({ method: 'GET', headers: { authorization: 'Bearer good-token' }, query: { limit: '15' } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.events).toHaveLength(2);
    expect(res.body.events[0].action).toBe('project_created');
    expect(res.body.events[0].id).toBe('e1');
  });
});
