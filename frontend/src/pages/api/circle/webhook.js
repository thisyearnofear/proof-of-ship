/**
 * Circle Webhook Endpoint
 *
 * Receives push notifications from Circle when transaction status changes.
 * Verifies the HMAC-SHA256 signature, then updates Firestore records.
 *
 * Setup:
 *   1. Register this URL in the Circle dashboard: https://your-domain.com/api/circle/webhook
 *   2. Set CIRCLE_WEBHOOK_SECRET env var to the signing secret from Circle
 *
 * Circle sends notifications for: transfer, payout, and smart contract transaction events.
 */

import crypto from 'crypto';
import { db } from '@/lib/firebase/serverOnly';

const CIRCLE_WEBHOOK_SECRET = process.env.CIRCLE_WEBHOOK_SECRET;

/**
 * Verify the Circle webhook signature (HMAC-SHA256).
 * Circle sends the signature in the `X-Circle-Signature` header.
 */
function verifySignature(body, signature) {
  if (!CIRCLE_WEBHOOK_SECRET) {
    console.error('CIRCLE_WEBHOOK_SECRET not configured — cannot verify webhook');
    return false;
  }

  if (!signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', CIRCLE_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  // Constant-time comparison
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
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
    tokenId,
    walletId,
    createDate,
    updateDate,
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
 * POST /api/circle/webhook
 *
 * Receives Circle webhook notifications. No auth header required —
 * signature verification is the security mechanism.
 */
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

  const signature =
    req.headers['x-circle-signature'] || req.headers['X-Circle-Signature'];

  // Verify signature against the exact raw bytes
  if (!verifySignature(rawBody, signature)) {
    console.warn('Webhook signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }

  try {

    // Circle webhook payload structure
    const { notificationType, notification } = payload;

    if (!notificationType) {
      return res.status(400).json({ error: 'Missing notificationType' });
    }

    // Log the webhook for audit trail
    await db.collection('circleWebhookEvents').add({
      type: notificationType,
      transactionId: notification?.id,
      status: notification?.status,
      receivedAt: new Date().toISOString(),
      payload: notification,
    });

    // Dispatch based on notification type
    switch (notificationType) {
      case 'transactions':
        await handleTransactionUpdate(notification);
        break;

      case 'transfers':
        // Transfer events have a slightly different structure
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
