/**
 * Ship's Log API — POST /api/projects/log
 * Verifies unified developer auth (API key + session), scope enforcement,
 * and idempotent replays.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const createLogMock = vi.fn();
const updateKeyMock = vi.fn(async () => undefined);

// Per-test fixtures
let userRecord = null;
let projectRecord = null;
let keyRecord = null;
let idempotencyStore = {};

function docRefFor(collection, id) {
  const ref = { collection, id };
  ref.get = vi.fn(async () => {
    const data = collection === 'users' ? userRecord
      : collection === 'projects' ? projectRecord
        : collection === 'developer_api_keys' ? keyRecord
          : collection === 'api_key_idempotency' ? idempotencyStore[id]
            : null;
    return { exists: !!data, data: () => data };
  });
  ref.update = collection === 'developer_api_keys' ? updateKeyMock : vi.fn(async () => undefined);
  return ref;
}

vi.mock('@/lib/firebase/serverOnly', () => ({
  db: {
    collection: (name) => ({
      doc: (id) => docRefFor(name, id),
    }),
    runTransaction: async (callback) => callback({
      get: (ref) => ref.get(),
      create: (ref, payload) => {
        if (ref.collection === 'api_key_idempotency') idempotencyStore[ref.id] = payload;
        if (ref.collection === 'ships_logs') createLogMock(payload);
      },
    }),
  },
  auth: {
    verifyIdToken: vi.fn(async (token) => {
      if (token === 'good-token') return { uid: 'user-123' };
      throw new Error('bad token');
    }),
  },
}));

vi.mock('@/utils/activityLogger', () => ({
  logActivity: vi.fn(async () => undefined),
}));

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = vi.fn((c) => { res.statusCode = c; return res; });
  res.json = vi.fn((b) => { res.body = b; return res; });
  return res;
}

describe('POST /api/projects/log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    idempotencyStore = {};
    userRecord = {
      githubUsername: 'devjane',
    };
    projectRecord = { name: 'My Proj', ecosystem: 'solana', owners: ['user-123'] };
    keyRecord = null;
  });

  it('posts a log entry via Firebase session', async () => {
    const handler = (await import('../../../../pages/api/projects/log')).default;
    const res = mockRes();
    await handler({
      method: 'POST',
      headers: { authorization: 'Bearer good-token' },
      body: { projectSlug: 'my-proj', message: 'shipped v1', type: 'milestone' },
    }, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(createLogMock).toHaveBeenCalledTimes(1);
    expect(createLogMock.mock.calls[0][0].userId).toBe('user-123');
  });

  it('rejects a session user without editor permission', async () => {
    projectRecord.owners = [];
    const handler = (await import('../../../../pages/api/projects/log')).default;
    const res = mockRes();
    await handler({
      method: 'POST',
      headers: { authorization: 'Bearer good-token' },
      body: { projectSlug: 'my-proj', message: 'x' },
    }, res);
    expect(res.statusCode).toBe(403);
  });

  it('accepts a scoped developer API key and records audit metadata', async () => {
    const { createApiKeyMaterial } = await import('../../../developerAuth/keyLib');
    const { key, keyId, doc } = createApiKeyMaterial({
      userId: 'user-123',
      scopes: ['proofs:write'],
      label: 'agent',
    });
    keyRecord = doc;

    const handler = (await import('../../../../pages/api/projects/log')).default;
    const res = mockRes();
    await handler({
      method: 'POST',
      headers: { 'x-api-key': key, 'idempotency-key': 'agent-proof-1' },
      body: { projectSlug: 'my-proj', message: 'milestone via agent', type: 'milestone' },
    }, res);

    expect(res.statusCode).toBe(201);
    expect(createLogMock).toHaveBeenCalledTimes(1);
    expect(res.body.logEntry.userId).toBe('user-123');
    expect(updateKeyMock).toHaveBeenCalled();
    expect(keyId).toHaveLength(22);
  });

  it('rejects an API key lacking proofs:write scope', async () => {
    const { createApiKeyMaterial } = await import('../../../developerAuth/keyLib');
    const { key, doc } = createApiKeyMaterial({
      userId: 'user-123',
      scopes: ['projects:read'],
    });
    keyRecord = doc;

    const handler = (await import('../../../../pages/api/projects/log')).default;
    const res = mockRes();
    await handler({
      method: 'POST',
      headers: { 'x-api-key': key },
      body: { projectSlug: 'my-proj', message: 'x' },
    }, res);
    expect(res.statusCode).toBe(403);
    expect(createLogMock).not.toHaveBeenCalled();
  });

  it('replays idempotently for a repeated Idempotency-Key', async () => {
    const { createApiKeyMaterial } = await import('../../../developerAuth/keyLib');
    const { key, doc } = createApiKeyMaterial({
      userId: 'user-123',
      scopes: ['proofs:write'],
    });
    keyRecord = doc;

    const handler = (await import('../../../../pages/api/projects/log')).default;
    const body = { projectSlug: 'my-proj', message: 'once only', type: 'milestone' };

    const res1 = mockRes();
    await handler({ method: 'POST', headers: { 'x-api-key': key, 'idempotency-key': 'abc' }, body }, res1);
    expect(res1.statusCode).toBe(201);
    expect(createLogMock).toHaveBeenCalledTimes(1);

    const res2 = mockRes();
    await handler({ method: 'POST', headers: { 'x-api-key': key, 'idempotency-key': 'abc' }, body }, res2);
    expect(res2.statusCode).toBe(201);
    expect(res2.body.idempotentReplay).toBe(true);
    // No second write occurred.
    expect(createLogMock).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when message is missing', async () => {
    const handler = (await import('../../../../pages/api/projects/log')).default;
    const res = mockRes();
    await handler({
      method: 'POST',
      headers: { authorization: 'Bearer good-token' },
      body: { projectSlug: 'my-proj' },
    }, res);
    expect(res.statusCode).toBe(400);
  });
});
