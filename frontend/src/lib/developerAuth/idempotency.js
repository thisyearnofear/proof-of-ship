import { createHash } from 'crypto';
import { AUDIT_COLLECTION, IDEMPOTENCY_COLLECTION } from './keyLib';

const MAX_KEY_LENGTH = 200;
const RECEIPT_DAYS = 7;

function sha(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function requestBodyHash(body) {
  return sha(JSON.stringify(body ?? null));
}

export function prepareIdempotency(db, developer, method, route, rawKey, body) {
  if (developer.type !== 'api_key') return null;
  if (typeof rawKey !== 'string' || rawKey.length < 1 || rawKey.length > MAX_KEY_LENGTH) {
    const error = new Error('A valid Idempotency-Key header is required');
    error.statusCode = 400;
    throw error;
  }
  const receiptId = sha(`${developer.keyId}\n${method}\n${route}\n${rawKey}`);
  return {
    ref: db.collection(IDEMPOTENCY_COLLECTION).doc(receiptId),
    bodyHash: requestBodyHash(body),
    receiptId,
  };
}

export async function readReceipt(transaction, prepared) {
  if (!prepared) return null;
  const snap = await transaction.get(prepared.ref);
  if (!snap.exists) return null;
  const data = snap.data();
  if (data.bodyHash !== prepared.bodyHash) {
    const error = new Error('Idempotency key was already used with a different payload');
    error.statusCode = 409;
    throw error;
  }
  return data;
}

export function completeReceipt(transaction, prepared, developer, method, route, statusCode, responseBody, now = new Date()) {
  if (!prepared) return;
  transaction.create(prepared.ref, {
    keyIdHash: sha(developer.keyId),
    method,
    route,
    bodyHash: prepared.bodyHash,
    statusCode,
    responseBody: JSON.parse(JSON.stringify(responseBody)),
    completedAt: now,
    expiresAt: new Date(now.getTime() + RECEIPT_DAYS * 86400000),
  });
}

export function recordMutationAudit(transaction, db, developer, action, resource, now = new Date()) {
  if (developer.type !== 'api_key') return;
  transaction.create(db.collection(AUDIT_COLLECTION).doc(), {
    action,
    resource,
    actorUserId: developer.userId,
    keyId: developer.keyId,
    outcome: 'success',
    createdAt: now,
  });
}
