/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { truncateAddress, generateShareText, TABS } from './tabs';

describe('truncateAddress', () => {
  it('returns "Unknown" for empty / nullish input', () => {
    expect(truncateAddress(null)).toBe('Unknown');
    expect(truncateAddress(undefined)).toBe('Unknown');
    expect(truncateAddress('')).toBe('Unknown');
  });

  it('truncates a 0x-style address to first4…last4', () => {
    expect(truncateAddress('0xabcdef1234567890')).toBe('0xab...7890');
  });

  it('truncates a Solana-style base58 address', () => {
    const addr = 'SoLanaAddr1234567890abcdef';
    expect(truncateAddress(addr)).toBe('SoLa...cdef');
  });
});

describe('generateShareText', () => {
  it('builds builder share text with velocity', () => {
    const text = generateShareText({ name: 'alice', velocity: 99 }, 3, 'builders');
    expect(text).toBe('#3 alice — 99 shipping velocity on @proofofship');
  });

  it('falls back to score when velocity is missing for builders', () => {
    const text = generateShareText({ name: 'bob', score: 42 }, 1, 'builders');
    expect(text).toBe('#1 bob — 42 shipping velocity on @proofofship');
  });

  it('builds backer share text with backing score', () => {
    const text = generateShareText({ name: 'carol', velocity: 5 }, 7, 'backers');
    expect(text).toBe('#7 carol — 5 backing score on @proofofship');
  });

  it('builds default share text for projects / hackathons / other types', () => {
    const text = generateShareText({ name: 'dexswap' }, 2, 'projects');
    expect(text).toBe('#2 dexswap on @proofofship');
  });

  it('falls back to truncated address when name is missing', () => {
    const text = generateShareText({ address: '0xabc1234567890def' }, 4, 'projects');
    expect(text).toBe('#4 0xab...0def on @proofofship');
  });
});

describe('TABS', () => {
  it('exposes the 5 leaderboard tabs in display order', () => {
    expect(TABS.map((t) => t.id)).toEqual([
      'proof-builders',
      'projects',
      'hackathons',
      'builders',
      'backers',
    ]);
  });

  it('every tab has a label and icon component', () => {
    for (const t of TABS) {
      expect(t.label).toBeTruthy();
      expect(typeof t.icon).toBe('object');
    }
  });
});
