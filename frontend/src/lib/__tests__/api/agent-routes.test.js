/**
 * API Route Tests for Agent Endpoints
 * Tests response contracts for chat, scout, underwrite, verify endpoints.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase admin
const fakeQuery = () => {
  /** @type {any} */
  const q = {};
  q.orderBy = vi.fn(() => q);
  q.where = vi.fn(() => q);
  q.limit = vi.fn(() => q);
  q.get = vi.fn(() => Promise.resolve({ docs: [] }));
  q.doc = vi.fn(() => ({
    get: vi.fn(() => Promise.resolve({ exists: true, id: 'test-project', data: () => ({ name: 'Test Project' }) })),
    set: vi.fn(() => Promise.resolve()),
  }));
  return q;
};
vi.mock('@/lib/firebase/serverOnly', () => ({
  db: {
    collection: vi.fn(() => fakeQuery()),
  },
}));

// Mock nanopayment middleware
vi.mock('@/lib/nanopayment', () => ({
  withNanopayment: vi.fn((handler, amount) => (req, res) => {
    req.nanopayment = { amount: 0.05, demo: false, txHash: '0xtest', verificationStatus: 'verified' };
    return handler(req, res);
  }),
}));

// Mock scoring engine
vi.mock('@/lib/scoringEngine', () => ({
  computeScore: vi.fn(() => ({ total: 75, breakdown: { github: 40, completeness: 20, community: 15 } })),
  getRecommendation: vi.fn(() => ({ amount: 1.5, multiplier: 200, label: '2x' })),
  computeStrategicAdvice: vi.fn(() => ({ ecosystemFit: 'high', tradeOffMatrix: {} })),
  MIN_SCORE_TO_BACK: 60,
}));

// Mock agent identity
vi.mock('@/lib/agentIdentity', () => ({
  getAgentIdentity: vi.fn((type) => ({
    domain: `pos-${type}.sol`,
    displayName: `${type} Agent`,
    icon: '🔭',
    description: `The ${type} agent`,
  })),
  agentIdentityResponse: vi.fn((type) => ({
    agent: { type, snsDomain: `pos-${type}.sol`, displayName: `pos-${type}.sol`, humanName: `${type} Agent`, icon: '🔭', description: `The ${type} agent` },
  })),
  AGENT_IDENTITIES: { scout: {}, underwrite: {}, verify: {}, rebalance: {} },
}));

// Mock agent cache
vi.mock('@/lib/agentCache', () => ({
  getCachedResult: vi.fn(() => null),
  setCachedResult: vi.fn(() => Promise.resolve()),
}));

// Mock aisa client
vi.mock('@/server/aisaClient', () => ({
  getAisaFetch: vi.fn(() => fetch),
  AISA_BASE_URL: 'https://api.aisa.dev/v1',
  isAisaConfigured: vi.fn(() => false),
}));

describe('Agent API Response Contracts', () => {
  describe('Chat Endpoint', () => {
    it('returns 405 for non-POST requests', async () => {
      const { default: handler } = await import('../../../pages/api/agent/chat.js');
      const req = { method: 'GET' };
      const res = { status: vi.fn(() => res), json: vi.fn() };
      
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns 400 for missing message', async () => {
      const { default: handler } = await import('../../../pages/api/agent/chat.js');
      const req = { method: 'POST', body: {} };
      const res = { status: vi.fn(() => res), json: vi.fn() };
      
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for message over 500 chars', async () => {
      const { default: handler } = await import('../../../pages/api/agent/chat.js');
      const req = { method: 'POST', body: { message: 'a'.repeat(501) } };
      const res = { status: vi.fn(() => res), json: vi.fn() };
      
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns valid response structure for valid request', async () => {
      const { default: handler } = await import('../../../pages/api/agent/chat.js');
      const mockRes = {
        status: vi.fn(() => mockRes),
        json: vi.fn((data) => data),
      };
      
      const req = { method: 'POST', body: { message: 'Hello' } };
      await handler(req, mockRes);
      
      const response = mockRes.json.mock.calls[0][0];
      expect(response).toHaveProperty('agent');
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('reply');
      expect(response).toHaveProperty('agentInfo');
      expect(response.agent).toHaveProperty('type', 'assistant');
      expect(response.agent).toHaveProperty('snsDomain');
    });
  });

  describe('Scout Endpoint', () => {
    it('returns 405 for invalid methods', async () => {
      const { default: handler } = await import('../../../pages/api/agent/scout.js');
      const req = { method: 'PUT' };
      const res = { status: vi.fn(() => res), json: vi.fn() };
      
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns valid response structure for GET', async () => {
      const { default: handler } = await import('../../../pages/api/agent/scout.js');
      const mockRes = {
        status: vi.fn(() => mockRes),
        json: vi.fn((data) => data),
      };
      
      const req = { method: 'GET', query: {}, headers: { host: 'localhost:3000' } };
      await handler(req, mockRes);
      
      const response = mockRes.json.mock.calls[0][0];
      expect(response).toHaveProperty('agent');
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('summary');
      expect(response).toHaveProperty('projects');
      expect(response.summary).toHaveProperty('evaluated');
      expect(response.summary).toHaveProperty('recommended');
    });
  });

  describe('Underwrite Endpoint', () => {
    it('returns 405 for non-GET requests', async () => {
      const { default: handler } = await import('../../../pages/api/agent/underwrite.js');
      const req = { method: 'POST' };
      const res = { status: vi.fn(() => res), json: vi.fn() };
      
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns 400 for missing projectId', async () => {
      const { default: handler } = await import('../../../pages/api/agent/underwrite.js');
      const req = { method: 'GET', query: {} };
      const res = { status: vi.fn(() => res), json: vi.fn() };
      
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns valid response structure for valid request', async () => {
      const { default: handler } = await import('../../../pages/api/agent/underwrite.js');
      const mockRes = {
        status: vi.fn(() => mockRes),
        json: vi.fn((data) => data),
      };
      
      const req = { method: 'GET', query: { projectId: 'test-project' }, headers: { host: 'localhost:3000' } };
      await handler(req, mockRes);
      
      const response = mockRes.json.mock.calls[0][0];
      expect(response).toHaveProperty('agent');
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('healthScore');
      expect(response).toHaveProperty('breakdown');
      expect(response).toHaveProperty('recommendation');
    });
  });

  describe('Verify Endpoint', () => {
    it('returns 405 for non-GET requests', async () => {
      const { default: handler } = await import('../../../pages/api/agent/verify.js');
      const req = { method: 'POST' };
      const res = { status: vi.fn(() => res), json: vi.fn() };
      
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns 400 for missing prId', async () => {
      const { default: handler } = await import('../../../pages/api/agent/verify.js');
      const req = { method: 'GET', query: {} };
      const res = { status: vi.fn(() => res), json: vi.fn() };
      
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns valid response structure for valid request', async () => {
      const { default: handler } = await import('../../../pages/api/agent/verify.js');
      const mockRes = {
        status: vi.fn(() => mockRes),
        json: vi.fn((data) => data),
      };
      
      const req = { method: 'GET', query: { prId: '123', lines: 100 }, headers: { host: 'localhost:3000' } };
      await handler(req, mockRes);
      
      const response = mockRes.json.mock.calls[0][0];
      expect(response).toHaveProperty('agent');
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('verification');
      expect(response.verification).toHaveProperty('prId');
      expect(response.verification).toHaveProperty('linesAnalyzed');
      expect(response.verification).toHaveProperty('approved');
      expect(response.verification).toHaveProperty('confidence');
      expect(response.verification).toHaveProperty('summary');
    });

    it('returns fallback verification when AIsa not configured', async () => {
      const { default: handler } = await import('../../../pages/api/agent/verify.js');
      const mockRes = {
        status: vi.fn(() => mockRes),
        json: vi.fn((data) => data),
      };
      
      const req = { method: 'GET', query: { prId: '456' }, headers: { host: 'localhost:3000' } };
      await handler(req, mockRes);
      
      const response = mockRes.json.mock.calls[0][0];
      // Should return fallback state when AIsa unavailable
      expect(response.verification.approved).toBeNull();
      expect(response.verification.confidence).toBe(0);
      expect(response.resultSource).toBe('fallback');
    });
  });
});

describe('Agent Identity Response Shape', () => {
  it('all agent responses include required fields', async () => {
    const { default: scoutHandler } = await import('../../../pages/api/agent/scout.js');
    const mockRes = {
      status: vi.fn(() => mockRes),
      json: vi.fn((data) => data),
    };
    
    const req = { method: 'GET', query: {}, headers: { host: 'localhost:3000' } };
    await scoutHandler(req, mockRes);
    
    const response = mockRes.json.mock.calls[0][0];
    
    // Required agent fields
    expect(response.agent).toHaveProperty('type');
    expect(response.agent).toHaveProperty('snsDomain');
    expect(response.agent).toHaveProperty('displayName');
    expect(response.agent).toHaveProperty('humanName');
    expect(response.agent).toHaveProperty('icon');
    expect(response.agent).toHaveProperty('description');
    
    // Required agentInfo fields
    expect(response.agentInfo).toHaveProperty('name');
    expect(response.agentInfo).toHaveProperty('humanName');
    expect(response.agentInfo).toHaveProperty('network');
  });
});