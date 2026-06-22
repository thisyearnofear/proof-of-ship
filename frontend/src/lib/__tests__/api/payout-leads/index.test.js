/**
 * Payout Leads API — POST /api/payout-leads
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const addMock = vi.fn(() => Promise.resolve({ id: 'lead-123' }));

const fakeDoc = () => ({
  id: 'lead-123',
  get: vi.fn(() => Promise.resolve({ exists: false })),
  set: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
});

const fakeQuery = () => {
  const q = {};
  q.where = vi.fn(() => q);
  q.orderBy = vi.fn(() => q);
  q.limit = vi.fn(() => q);
  q.get = vi.fn(() => Promise.resolve({ docs: [], size: 0 }));
  q.doc = vi.fn(() => fakeDoc());
  q.add = addMock;
  return q;
};

vi.mock('@/lib/firebase/serverOnly', () => ({
  db: {
    collection: vi.fn(() => fakeQuery()),
  },
}));

describe('/api/payout-leads (index)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 405 for non-POST methods', async () => {
    const handler = (await import('../../../../pages/api/payout-leads/index')).default;
    const req = { method: 'GET' };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 400 when hackathonName is missing', async () => {
    const handler = (await import('../../../../pages/api/payout-leads/index')).default;
    const req = {
      method: 'POST',
      body: { email: 'test@example.com' },
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 201 on successful creation', async () => {
    const handler = (await import('../../../../pages/api/payout-leads/index')).default;
    const req = {
      method: 'POST',
      body: {
        hackathonName: 'Test Hackathon',
        email: 'test@example.com',
        prizeAmount: 5000,
        wallet: '0xabc',
      },
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
