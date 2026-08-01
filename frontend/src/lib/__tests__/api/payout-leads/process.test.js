/**
 * Payout Leads Process API — GET /api/payout-leads/process
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const originalNodeEnv = process.env.NODE_ENV;

const fakeDoc = (overrides = {}) => ({
  id: 'lead-abc123',
  data: () => ({
    hackathonName: 'Test Hackathon',
    email: 'test@example.com',
    prizeAmount: 5000,
    wallet: '0xabc',
    createdAt: '2026-06-01T00:00:00Z',
    ...overrides,
  }),
  get: vi.fn(() => Promise.resolve({ exists: false })),
  set: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
});

const fakeQuery = (docs = []) => {
  const q = {};
  q.where = vi.fn(() => q);
  q.orderBy = vi.fn(() => q);
  q.limit = vi.fn(() => q);
  q.get = vi.fn(() => Promise.resolve({ docs, size: docs.length }));
  q.doc = vi.fn(() => fakeDoc());
  return q;
};

vi.mock('@/lib/firebase/serverOnly', () => ({
  db: {
    collection: vi.fn(() => fakeQuery()),
  },
}));

describe('/api/payout-leads/process', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.CRON_SECRET;
  });

  it('returns 405 for non-GET methods', async () => {
    const handler = (await import('../../../../pages/api/payout-leads/process')).default;
    const req = { method: 'POST' };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 401 when CRON_SECRET is set and auth is missing', async () => {
    process.env.CRON_SECRET = 'my-secret';
    const handler = (await import('../../../../pages/api/payout-leads/process')).default;
    const req = { method: 'GET', headers: {} };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when CRON_SECRET is set and auth is wrong', async () => {
    process.env.CRON_SECRET = 'my-secret';
    const handler = (await import('../../../../pages/api/payout-leads/process')).default;
    const req = { method: 'GET', headers: { authorization: 'Bearer wrong-secret' } };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('fails closed in production when CRON_SECRET is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CRON_SECRET;
    const handler = (await import('../../../../pages/api/payout-leads/process')).default;
    const req = { method: 'GET', headers: {} };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('processes leads when CRON_SECRET matches', async () => {
    process.env.CRON_SECRET = 'my-secret';

    const { db } = await import('@/lib/firebase/serverOnly');
    const docs = [
      fakeDoc({
        hackathonName: 'Test Hacks',
        email: 'dev@test.com',
        prizeAmount: 10000,
        announcementUrl: 'https://example.com/winners',
      }),
    ];
    db.collection = vi.fn(() => fakeQuery(docs));

    const handler = (await import('../../../../pages/api/payout-leads/process')).default;
    const req = { method: 'GET', headers: { authorization: 'Bearer my-secret' } };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.processed).toBe(1);
    expect(payload.total).toBe(1);

  });

  it('skips leads without evidence URL (trust gate)', async () => {
    process.env.CRON_SECRET = 'my-secret';

    const { db } = await import('@/lib/firebase/serverOnly');
    const docs = [
      fakeDoc({
        hackathonName: 'No Evidence Hack',
        email: 'dev@test.com',
        prizeAmount: 5000,
        // no announcementUrl or evidenceUrl
      }),
    ];
    db.collection = vi.fn(() => fakeQuery(docs));

    const handler = (await import('../../../../pages/api/payout-leads/process')).default;
    const req = { method: 'GET', headers: { authorization: 'Bearer my-secret' } };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.processed).toBe(0);
    expect(payload.skipped).toBe(1);
  });
});
