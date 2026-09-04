/**
 * Agent Identity Tests
 * Validates .sol domain identity mappings and API response shapes.
 */
import { describe, it, expect } from 'vitest';
import { getAgentIdentity, agentIdentityResponse, AGENT_IDENTITIES } from '../agentIdentity';

describe('getAgentIdentity', () => {
  it('returns correct identity for known agent types', () => {
    const scout = getAgentIdentity('scout');
    expect(scout.domain).toBe('pledgebond-scout.sol');
    expect(scout.displayName).toBe('Scout Agent');
    expect(scout.icon).toBe('🔭');
  });

  it('returns identity for all 4 agent types', () => {
    for (const key of ['scout', 'underwrite', 'verify', 'rebalance'] as const) {
      const identity = getAgentIdentity(key);
      expect(identity.domain).toMatch(/^pledgebond-.*\.sol$/);
      expect(identity.displayName).toBeTruthy();
      expect(identity.description).toBeTruthy();
    }
  });

  it('returns fallback for unknown agent type', () => {
    const identity = getAgentIdentity('custom-agent');
    expect(identity.domain).toBe('custom-agent.agent.sol');
    expect(identity.displayName).toBe('custom-agent Agent');
  });
});

describe('agentIdentityResponse', () => {
  it('returns properly shaped agent response object', () => {
    const response = agentIdentityResponse('scout');
    expect(response).toHaveProperty('agent');
    expect(response.agent).toHaveProperty('type', 'scout');
    expect(response.agent).toHaveProperty('snsDomain', 'pledgebond-scout.sol');
    expect(response.agent).toHaveProperty('displayName', 'pledgebond-scout.sol');
    expect(response.agent).toHaveProperty('humanName', 'Scout Agent');
    expect(response.agent).toHaveProperty('icon');
    expect(response.agent).toHaveProperty('description');
  });

  it('returns consistent structure for all agent types', () => {
    for (const key of ['scout', 'underwrite', 'verify', 'rebalance']) {
      const response = agentIdentityResponse(key);
      expect(response.agent.type).toBe(key);
      expect(typeof response.agent.snsDomain).toBe('string');
      expect(typeof response.agent.humanName).toBe('string');
    }
  });
});

describe('AGENT_IDENTITIES', () => {
  it('has exactly 4 agent types', () => {
    expect(Object.keys(AGENT_IDENTITIES)).toHaveLength(4);
  });

  it('has no duplicate domains', () => {
    const domains = Object.values(AGENT_IDENTITIES).map(a => a.domain);
    expect(new Set(domains).size).toBe(domains.length);
  });

  it('domains all end in .sol', () => {
    for (const identity of Object.values(AGENT_IDENTITIES)) {
      expect(identity.domain).toMatch(/\.sol$/);
    }
  });
});
