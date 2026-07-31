/**
 * Developer API key core library — unit tests
 */
import { describe, it, expect, vi } from 'vitest';
import {
  API_KEY_SCOPES,
  normalizeScopes,
  createApiKeyMaterial,
  hashApiKey,
  verifyApiKey,
  keyUsability,
  parseKeyHeader,
  prefixFromKey,
} from '../../developerAuth/keyLib';
import {
  completeReceipt,
  prepareIdempotency,
  readReceipt,
  recordMutationAudit,
} from '../../developerAuth/idempotency';

describe('developerAuth/keyLib', () => {
  describe('normalizeScopes', () => {
    it('accepts a valid subset and dedupes', () => {
      const r = normalizeScopes(['projects:write', 'projects:write', 'proofs:write']);
      expect(r.valid).toBe(true);
      expect(r.scopes).toEqual(['projects:write', 'proofs:write']);
    });

    it('rejects empty input', () => {
      expect(normalizeScopes([]).valid).toBe(false);
      expect(normalizeScopes(undefined).valid).toBe(false);
    });

    it('rejects unknown scopes', () => {
      const r = normalizeScopes(['projects:write', 'admin:everything']);
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.includes('unknown scope'))).toBe(true);
    });

    it('exposes a frozen, known scope catalog', () => {
      expect(API_KEY_SCOPES).toContain('projects:write');
      expect(API_KEY_SCOPES).toContain('proofs:write');
      expect(Object.isFrozen(API_KEY_SCOPES)).toBe(true);
    });
  });

  describe('key material', () => {
    it('generates a key whose prefix is recoverable and hashes verify', () => {
      const { key, keyId, doc } = createApiKeyMaterial({
        userId: 'u1',
        scopes: ['proofs:write'],
        label: 'agent',
      });

      expect(key).toMatch(/^pos_live_[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}$/);
      expect(prefixFromKey(key)).toBe(keyId);
      expect(doc.keyId).toBe(keyId);
      // The secret is never stored in the doc.
      expect(JSON.stringify(doc)).not.toContain(key);
      expect(doc.keyHash).not.toBe(key);
      expect(doc).not.toHaveProperty('secretHint');
      expect(doc).not.toHaveProperty('prefix');

      // Stored hash verifies the original key and rejects a wrong one.
      expect(verifyApiKey(key, doc.keyHash)).toBe(true);
      expect(verifyApiKey(`${key}x`, doc.keyHash)).toBe(false);
    });

    it('produces distinct keys per call', () => {
      const a = createApiKeyMaterial({ userId: 'u1', scopes: ['proofs:write'] });
      const b = createApiKeyMaterial({ userId: 'u1', scopes: ['proofs:write'] });
      expect(a.key).not.toBe(b.key);
      expect(a.keyId).not.toBe(b.keyId);
    });

    it('computes expiresAt only for positive expiresInDays', () => {
      const noExp = createApiKeyMaterial({ userId: 'u1', scopes: ['proofs:write'] });
      expect(noExp.doc.expiresAt).toBeNull();

      const withExp = createApiKeyMaterial({ userId: 'u1', scopes: ['proofs:write'], expiresInDays: 7 });
      expect(withExp.doc.expiresAt).toBeTruthy();
      expect(new Date(withExp.doc.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('keyUsability', () => {
    const base = { status: 'active', expiresAt: null };

    it('accepts an active, non-expired key', () => {
      expect(keyUsability(base).usable).toBe(true);
    });

    it('rejects revoked keys', () => {
      expect(keyUsability({ ...base, status: 'revoked' }).usable).toBe(false);
    });

    it('rejects expired keys', () => {
      const past = new Date(Date.now() - 1000).toISOString();
      const r = keyUsability({ ...base, expiresAt: past });
      expect(r.usable).toBe(false);
      expect(r.reason).toBe('expired');
    });

    it('rejects missing records', () => {
      expect(keyUsability(null).usable).toBe(false);
    });
  });

  describe('header parsing', () => {
    it('parses raw and bearer forms', () => {
      expect(parseKeyHeader('pos_live_abc.def')).toBe('pos_live_abc.def');
      expect(parseKeyHeader('Bearer pos_live_abc.def')).toBe('pos_live_abc.def');
      expect(parseKeyHeader('  Bearer   tok  ')).toBeNull();
      expect(parseKeyHeader(undefined)).toBeNull();
      expect(parseKeyHeader('   ')).toBeNull();
    });

    it('extracts prefix only from well-formed keys', () => {
      expect(prefixFromKey('pos_live_abcdefghijklmnopqrstuv.abcdefghijklmnopqrstuvwxyz0123456789_-ABCDE')).toBe('abcdefghijklmnopqrstuv');
      expect(prefixFromKey('pos_live_abcdefghijklmnopqrstuv.short')).toBeNull();
      expect(prefixFromKey('not-a-key')).toBeNull();
    });
  });

  describe('hashApiKey', () => {
    it('is deterministic and hex-encoded', () => {
      const h = hashApiKey('pos_live_a.b');
      expect(h).toMatch(/^[0-9a-f]{64}$/);
      expect(hashApiKey('pos_live_a.b')).toBe(h);
    });
  });

  describe('idempotency receipts', () => {
    const ref = { path: 'api_key_idempotency/receipt' };
    const db = { collection: () => ({ doc: () => ref }) };
    const developer = { type: 'api_key', userId: 'u1', keyId: 'key-1' };

    it('requires a bounded key only for API-key mutations', () => {
      expect(prepareIdempotency(db, { type: 'user', userId: 'u1' }, 'POST', '/api/projects', undefined, {})).toBeNull();
      expect(() => prepareIdempotency(db, developer, 'POST', '/api/projects', undefined, {})).toThrow(/Idempotency-Key/);
      expect(() => prepareIdempotency(db, developer, 'POST', '/api/projects', 'x'.repeat(201), {})).toThrow(/Idempotency-Key/);
    });

    it('rejects replay with a changed body', async () => {
      const prepared = prepareIdempotency(db, developer, 'POST', '/api/projects', 'request-1', { name: 'A' });
      const transaction = {
        get: async () => ({ exists: true, data: () => ({ bodyHash: 'different' }) }),
      };
      await expect(readReceipt(transaction, prepared)).rejects.toMatchObject({ statusCode: 409 });
    });

    it('stores a JSON-safe completed response and private audit attribution', () => {
      const prepared = prepareIdempotency(db, developer, 'DELETE', '/api/projects/a', 'request-2', null);
      const transaction = { create: vi.fn() };
      const now = new Date('2026-07-31T00:00:00.000Z');

      completeReceipt(transaction, prepared, developer, 'DELETE', '/api/projects/a', 200, { expiresAt: now }, now);
      recordMutationAudit(transaction, { collection: () => ({ doc: () => ({ path: 'audit/id' }) }) }, developer, 'project_deleted', 'projects/a', now);

      expect(transaction.create).toHaveBeenCalledTimes(2);
      expect(transaction.create.mock.calls[0][1].responseBody.expiresAt).toBe(now.toISOString());
      expect(transaction.create.mock.calls[1][1]).toMatchObject({ keyId: 'key-1', outcome: 'success' });
    });
  });
});
