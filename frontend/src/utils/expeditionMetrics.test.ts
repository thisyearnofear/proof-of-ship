/**
 * Expedition Metrics Tests
 * Unit tests for pure derivation functions used by useExpeditionData
 */
import { describe, it, expect } from 'vitest';
import {
  calculateHealth,
  calculateConfidence,
  deriveMultiplier,
  deriveLastCheckIn,
  enhanceProject,
} from './expeditionMetrics';

const NOW = new Date('2026-05-01T12:00:00Z').getTime();

describe('calculateHealth', () => {
  it('returns baseline 50 for empty project', () => {
    expect(calculateHealth({}, NOW)).toBe(50);
  });

  it('adds 15 for active project', () => {
    expect(calculateHealth({ stats: { isActive: true } }, NOW)).toBe(65);
  });

  it('adds 10+5 for 50+ commits', () => {
    expect(calculateHealth({ stats: { commits: 60 } }, NOW)).toBe(65);
  });

  it('adds 10 for 10-50 commits', () => {
    expect(calculateHealth({ stats: { commits: 15 } }, NOW)).toBe(60);
  });

  it('adds 15 for commit within 7 days', () => {
    const recent = new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateHealth({ stats: { lastCommit: recent } }, NOW)).toBe(65);
  });

  it('adds 5 for commit within 30 days', () => {
    const recent = new Date(NOW - 15 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateHealth({ stats: { lastCommit: recent } }, NOW)).toBe(55);
  });

  it('subtracts 10 for stale commit (>30 days)', () => {
    const stale = new Date(NOW - 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateHealth({ stats: { lastCommit: stale } }, NOW)).toBe(40);
  });

  it('averages with existing healthScore', () => {
    // baseline 50 + active(15) = 65, avg with 80 = 73
    expect(calculateHealth({ stats: { isActive: true, healthScore: 80 } }, NOW)).toBe(73);
  });

  it('clamps to 0-100 range', () => {
    // All signals on: 50+15+10+5+15=95, avg with 100=98
    const recent = new Date(NOW - 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateHealth({ stats: { isActive: true, commits: 100, lastCommit: recent, healthScore: 100 } }, NOW)).toBeLessThanOrEqual(100);
  });
});

describe('calculateConfidence', () => {
  it('returns 10 for zero backers and zero backing', () => {
    expect(calculateConfidence({})).toBe(10);
    expect(calculateConfidence({ backerCount: 0, totalBacked: 0 })).toBe(10);
  });

  it('scales with backer count up to 10 backers', () => {
    const c5 = calculateConfidence({ backerCount: 5, totalBacked: 5000 });
    const c10 = calculateConfidence({ backerCount: 10, totalBacked: 5000 });
    expect(c5).toBeLessThan(c10);
  });

  it('scales with funding progress', () => {
    const low = calculateConfidence({ backerCount: 5, totalBacked: 1000 });
    const high = calculateConfidence({ backerCount: 5, totalBacked: 8000 });
    expect(low).toBeLessThan(high);
  });

  it('caps at 100', () => {
    const result = calculateConfidence({ backerCount: 100, totalBacked: 50000, targetFunding: 10000 });
    expect(result).toBeLessThanOrEqual(100);
  });

  it('handles missing targetFunding', () => {
    const result = calculateConfidence({ backerCount: 5, totalBacked: 5000 });
    expect(result).toBeGreaterThan(10);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('deriveMultiplier', () => {
  it('returns explicit activeMultiplier if set', () => {
    expect(deriveMultiplier({ activeMultiplier: 2.5 })).toBe(2.5);
  });

  it('converts backingMultiplier from basis points', () => {
    expect(deriveMultiplier({ backingMultiplier: 200 })).toBe(2);
  });

  it('defaults to 1.5x for zero backers', () => {
    expect(deriveMultiplier({})).toBe(1.5);
    expect(deriveMultiplier({ backerCount: 0 })).toBe(1.5);
  });

  it('returns 1.5x for 1-4 backers', () => {
    expect(deriveMultiplier({ backerCount: 3 })).toBe(1.5);
  });

  it('returns 2.0x for 5-9 backers', () => {
    expect(deriveMultiplier({ backerCount: 7 })).toBe(2.0);
  });

  it('returns 3.0x for 10+ backers', () => {
    expect(deriveMultiplier({ backerCount: 12 })).toBe(3.0);
  });

  it('caps at 3.0x even for many backers', () => {
    expect(deriveMultiplier({ backerCount: 100 })).toBe(3.0);
  });
});

describe('deriveLastCheckIn', () => {
  it('returns 168 (stale) when no data', () => {
    expect(deriveLastCheckIn({})).toBe(168);
  });

  it('calculates hours from lastCheckInTimestamp', () => {
    const twoHoursAgo = new Date(NOW - 2 * 60 * 60 * 1000).toISOString();
    expect(deriveLastCheckIn({ lastCheckInTimestamp: twoHoursAgo }, NOW)).toBe(2);
  });

  it('falls back to lastCommit', () => {
    const fourHoursAgo = new Date(NOW - 4 * 60 * 60 * 1000).toISOString();
    expect(deriveLastCheckIn({ stats: { lastCommit: fourHoursAgo } }, NOW)).toBe(4);
  });

  it('prefers lastCheckInTimestamp over lastCommit', () => {
    const oneHourAgo = new Date(NOW - 1 * 60 * 60 * 1000).toISOString();
    const tenHoursAgo = new Date(NOW - 10 * 60 * 60 * 1000).toISOString();
    expect(deriveLastCheckIn({
      lastCheckInTimestamp: oneHourAgo,
      stats: { lastCommit: tenHoursAgo },
    }, NOW)).toBe(1);
  });
});

describe('enhanceProject', () => {
  it('returns a complete enhanced project object', () => {
    const result = enhanceProject({ name: 'Test', stats: { isActive: true, commits: 20 } }, NOW);
    expect(result.name).toBe('Test');
    expect(result.confidence).toBeGreaterThanOrEqual(10);
    expect(result.health).toBeGreaterThanOrEqual(50);
    expect(result.activeMultiplier).toBe(1.5);
    expect(result.projectedROI).toBe(50);
    expect(result.totalBacked).toBe(0);
    expect(result.targetFunding).toBe(10000);
    expect(result.founderStaked).toBe(false);
    expect(result.category).toBe('Infrastructure');
  });

  it('detects founder staked', () => {
    const result = enhanceProject({ founderStakedAmount: 500 });
    expect(result.founderStaked).toBe(true);
    expect(result.founderStakedAmount).toBe(500);
  });

  it('uses first sector as category', () => {
    const result = enhanceProject({ sectors: ['ai-agents', 'defi'] });
    expect(result.category).toBe('ai-agents');
  });

  it('falls back to project category field', () => {
    const result = enhanceProject({ category: 'Payments' });
    expect(result.category).toBe('Payments');
  });

  it('preserves original project fields', () => {
    const result = enhanceProject({ id: 'abc', slug: 'test-proj', name: 'Test' });
    expect(result.id).toBe('abc');
    expect(result.slug).toBe('test-proj');
  });
});
