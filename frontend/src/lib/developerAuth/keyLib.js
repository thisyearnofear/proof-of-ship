import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export const API_KEYS_COLLECTION = 'developer_api_keys';
export const IDEMPOTENCY_COLLECTION = 'api_key_idempotency';
export const AUDIT_COLLECTION = 'developer_api_audit';
export const API_KEY_SCOPES = Object.freeze([
  'projects:write',
  'projects:delete',
  'proofs:write',
]);

const KEY_RE = /^pos_live_([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/;

export function normalizeScopes(scopes) {
  if (!Array.isArray(scopes) || scopes.length === 0) {
    return { valid: false, scopes: [], errors: ['scopes must be a non-empty array'] };
  }
  const errors = [];
  const normalized = [];
  for (const scope of scopes) {
    if (typeof scope !== 'string' || !API_KEY_SCOPES.includes(scope)) {
      errors.push(`unknown scope: ${String(scope)}`);
    } else if (!normalized.includes(scope)) {
      normalized.push(scope);
    }
  }
  return { valid: errors.length === 0, scopes: normalized, errors };
}

export function hashApiKey(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function createApiKeyMaterial({ userId, scopes, label = '', expiresInDays = null }) {
  const keyId = randomBytes(16).toString('base64url');
  const secret = randomBytes(32).toString('base64url');
  const key = `pos_live_${keyId}.${secret}`;
  const now = new Date();
  return {
    key,
    keyId,
    doc: {
      keyId,
      keyHash: hashApiKey(key),
      userId,
      label,
      scopes,
      status: 'active',
      createdAt: now,
      lastUsedAt: null,
      revokedAt: null,
      expiresAt: expiresInDays == null
        ? null
        : new Date(now.getTime() + expiresInDays * 86400000),
    },
  };
}

export function prefixFromKey(value) {
  return typeof value === 'string' ? value.match(KEY_RE)?.[1] || null : null;
}

export function verifyApiKey(value, storedHash) {
  if (!prefixFromKey(value) || !/^[0-9a-f]{64}$/.test(storedHash || '')) return false;
  return timingSafeEqual(
    Buffer.from(hashApiKey(value), 'hex'),
    Buffer.from(storedHash, 'hex'),
  );
}

function dateMillis(value) {
  if (value instanceof Date) return value.getTime();
  if (value && typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value === 'string') return new Date(value).getTime();
  return NaN;
}

export function keyUsability(data, now = new Date()) {
  if (!data) return { usable: false, reason: 'not_found' };
  if (data.status !== 'active') return { usable: false, reason: 'inactive' };
  if (data.expiresAt) {
    const expiry = dateMillis(data.expiresAt);
    if (!Number.isFinite(expiry) || expiry <= now.getTime()) {
      return { usable: false, reason: 'expired' };
    }
  }
  return { usable: true, reason: null };
}

export function parseBearer(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^Bearer ([^\s]+)$/i);
  return match?.[1] || null;
}

export function parseKeyHeader(value) {
  if (typeof value !== 'string') return null;
  return parseBearer(value) || (value.trim() === value && value ? value : null);
}
