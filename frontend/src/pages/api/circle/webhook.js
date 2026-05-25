/**
 * Circle Webhook Endpoint
 *
 * Receives push notifications from Circle (Programmable Wallets / CPN).
 * Circle signs every notification with ECDSA-SHA256 using an asymmetric key.
 * We fetch the public key from Circle (by key ID) and verify the signature
 * against the exact raw request body.
 *
 * Setup:
 *   1. Create a webhook subscription in the Circle Console pointing to
 *      https://your-domain.com/api/circle/webhook
 *   2. Ensure CIRCLE_API_KEY is set so we can fetch verification public keys
 *
 * Docs: https://developers.circle.com/cpn/guides/webhooks/verify-webhook-signatures
 */

import crypto from 'crypto';
import { db } from '@/lib/firebase/serverOnly';

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const CIRCLE_API_BASE =
  process.env.CIRCLE_API_BASE || 'https://api.circle.com';

// In-memory cache for public keys (key id -> { publicKey, algorithm })
const publicKeyCache = new Map();

/**
 * Fetch and cache the public key for a given Circle key ID.
 */
async function getCirclePublicKey(keyId) {
  if (publicKeyCache.has(keyId)) {
    return publicKeyCache.get(keyId);
  }

  if (!CIRCLE_API_KEY) {
    throw new Error('CIRCLE_API_KEY not configured — cannot fetch public key');
  }

  const url = `${CIRCLE_API_BASE}/v2/cpn/notifications/publicKey/${keyId}`;
  const resp = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${CIRCLE_API_KEY}`,
    },
  });

  if (!resp.ok) {
    throw new Error(
      `Failed to fetch Circle public key ${keyId}: ${resp.status} ${resp.statusText}`
    );
  }

  const body = await resp.json();
  const data = body?.data;
  if (!data?.publicKey || !data?.algorithm) {
    throw new Error('Circle public key response missing publicKey/algorithm');
  }

  // publicKey is base64-encoded SPKI DER. Convert to a KeyObject.
  const der = Buffer.from(data.publicKey, 'base64');
  const publicKey = crypto.createPublicKey({
    key: der,
    format: 'der',
    type: 'spki',
  });

  const entry = { publicKey, algorithm: data.algorithm };
  publicKeyCache.set(keyId, entry);
  return entry;
}

/**
 * Verify the Circle webhook ECDSA signature over the raw body bytes.
 */
async function verifyCircleSignature(rawBody, signatureB64, keyId) {
  if (!signatureB64 || !keyId) return false;

  let entry;
  try {
    entry = await getCirclePublicKey(keyId);
  } catch (err) {
    console.error('Public key fetch failed:', err.message);
    return false;
  }

  // Only ECDSA_SHA_256 is documented today.
  if (entry.algorithm !== 'ECDSA_SHA_256') {
    console.error(`Unsupported Circle signature algorithm: ${entry.algorithm}`);
    return false;
  }

  try {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(rawBody);
    verifier.end();
    return verifier.verify(
      { key: entry.publicKey, dsaEncoding: 'der' },
      Buffer.from(signatureB64, 'base64')
    );
  } catch (err) {
    console.error('Signature verification threw:', err.message);
    return false;
  }
}

/**
 * Map Circle notification event types to our internal status values.
 */
function mapCircleStatus(circleStatus) {
  const statusMap = {
    PENDING: 'pending',
    COMPLETE: 'confirmed',
    FAILED: 'failed',
    ACTION_REQUIRED: 'pending',
  };
  return statusMap[circleStatus?.toUpperCase()] || 'unknown';
}

/**
 * Update transaction-related Firestore documents based on the webhook payload.
 */
async function handleTransactionUpdate(notification) {
  const {
    id: transactionId,
    status,
    txHash,
    blockchain,
  } = notification;

  if (!transactionId) {
    console.warn('Webhook notification missing transaction ID:', notification);
    return;
  }

  const mappedStatus = mapCircleStatus(status);
  const updateData = {
    circleTxId: transactionId,
    status: mappedStatus,
    circleStatus: status,
    txHash: txHash || null,
    blockchain: blockchain || null,
    updatedAt: new Date().toISOString(),
    rawNotification: notification,
  };

  // 1. Update the idempotency record (if we have one keyed by this tx ID)
  try {
    const idempotencySnap = await db
      .collection('circleIdempotency')
      .where('circleTxId', '==', transactionId)
      .limit(1)
      .get();

    if (!idempotencySnap.empty) {
      const doc = idempotencySnap.docs[0];
      await doc.ref.set({ status: mappedStatus }, { merge: true });
    }
  } catch (err) {
    console.warn('Failed to update idempotency record:', err.message);
  }

  // 2. Update the PayoutLogs collection (used by the transfer endpoint)
  try {
    const payoutSnap = await db
      .collection('PayoutLogs')
      .where('transferId', '==', transactionId)
      .limit(1)
      .get();

    if (!payoutSnap.empty) {
      const doc = payoutSnap.docs[0];
      await doc.ref.set(
        {
          status: mappedStatus,
          txHash: txHash || null,
          updatedAt: updateData.updatedAt,
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Failed to update PayoutLogs:', err.message);
  }

  // 3. Persist the transaction status for lookup by the agent/execute endpoint
  try {
    await db.collection('transactionStatuses').doc(transactionId).set(updateData);
  } catch (err) {
    console.warn('Failed to update transaction status:', err.message);
  }
}

/**
 * Read the raw request body as a Buffer. Required because bodyParser is
 * disabled (signature verification must run over the exact bytes Circle sent).
 */
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error('Failed to read webhook body:', err);
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const signature = req.headers['x-circle-signature'];
  const keyId = req.headers['x-circle-key-id'];

  // Parse body early so we can identify verification pings before signature check
  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }

  // Circle sends a webhooks.test ping during registration — always accept it.
  // This is safe: the ping carries no sensitive data and just confirms reachability.
  if (payload?.notificationType === 'webhooks.test') {
    console.log('[circle-webhook] accepting verification ping');
    return res.status(200).json({ received: true });
  }

  // For all real events, require valid ECDSA signature
  if (!signature || !keyId) {
    console.warn('[circle-webhook] missing signature headers');
    return res.status(401).json({ error: 'Missing signature headers' });
  }

  if (!(await verifyCircleSignature(rawBody, signature, keyId))) {
    console.warn('[circle-webhook] signature verification failed', {
      keyId,
      bodyLen: rawBody.length,
    });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    const { notificationType, notification } = payload;

    if (!notificationType) {
      return res.status(400).json({ error: 'Missing notificationType' });
    }

    // Log the webhook for audit trail
    await db.collection('circleWebhookEvents').add({
      type: notificationType,
      transactionId: notification?.id || null,
      status: notification?.status || null,
      receivedAt: new Date().toISOString(),
      payload: notification || payload,
    });

    // Dispatch based on notification type
    switch (notificationType) {
      case 'transactions':
      case 'transactions.inbound':
      case 'transactions.outbound':
        await handleTransactionUpdate(notification);
        break;

      case 'transfers':
        await handleTransactionUpdate({
          ...notification,
          id: notification.id || notification.transferId,
        });
        break;

      default:
        console.log(`Unhandled webhook notification type: ${notificationType}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Disable body parsing — we need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
