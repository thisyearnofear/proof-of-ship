/**
 * POST /api/activity/log
 *
 * Lightweight server-side activity logger for client-initiated events
 * that need to appear in the notification feed (e.g. backing_received).
 *
 * Auth: requires Firebase ID token. The activity type is restricted to
 * an allowlist of client-loggable types to prevent abuse.
 */

import { db, auth } from "../../../lib/firebase/serverOnly";
import { logActivity } from "../../../utils/activityLogger";

// Only these activity types can be logged from the client.
// Each includes which field determines the recipient userId.
const CLIENT_LOGGABLE_TYPES = {
  backing_received: {
    requiredFields: ["amount", "multiplier"],
    // Resolve the recipient from either userId or walletAddress
    resolveUserId: true,
    description: (d) => `Backed with ${d.amount} USDC at ${d.multiplier}x multiplier`,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify Firebase ID token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(authHeader.split("Bearer ")[1]);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const { type, ...data } = req.body;

  const config = CLIENT_LOGGABLE_TYPES[type];
  if (!config) {
    return res.status(400).json({ error: `Activity type "${type}" is not client-loggable` });
  }

  // Validate required fields
  for (const field of config.requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  // Resolve recipient userId
  let recipientUid = data.userId;
  if (!recipientUid && config.resolveUserId && data.walletAddress) {
    try {
      const walletKey = String(data.walletAddress).toLowerCase();
      const walletDoc = await db.collection("wallet_index").doc(walletKey).get();
      if (walletDoc.exists) {
        recipientUid = walletDoc.data().uid;
      }
    } catch {
      // Lookup failed — can't determine recipient
    }
  }

  if (!recipientUid) {
    return res.status(400).json({ error: "Could not determine recipient (provide userId or walletAddress)" });
  }

  // The recipient must differ from the actor (you can't back yourself)
  if (recipientUid === decodedToken.uid) {
    return res.status(400).json({ error: "Cannot log activity for yourself" });
  }

  try {
    await logActivity({
      type,
      userId: recipientUid,
      userHandle: recipientUid,
      description: config.description(data),
      metadata: {
        ...data,
        backerUid: decodedToken.uid,
      },
    });

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("Activity log error:", err);
    return res.status(500).json({ error: "Failed to log activity" });
  }
}
