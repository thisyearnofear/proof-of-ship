/**
 * Copy Scout API
 *
 * POST /api/agent/copy
 *   Body: { action: 'subscribe' | 'unsubscribe' | 'status', depositAmount?: number }
 *
 * Manages user subscriptions to the Proof Scout copy-trading feature.
 * When subscribed, the user's wallet auto-backs projects the scout recommends.
 *
 * Future: integrate with Circle Wallets for automatic execution.
 */

import { db } from "@/lib/firebase/serverOnly";
import { withAgentAuth } from "@/lib/agentAuth";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, depositAmount } = req.body;
  const userId = req.user?.uid || req.body.userId;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const docRef = db.collection("copy_scout_subscriptions").doc(userId);

  try {
    if (action === "subscribe") {
      await docRef.set({
        userId,
        subscribed: true,
        depositAmount: depositAmount || 0,
        subscribedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalBacked: 0,
        totalStaked: 0,
        status: "active",
      }, { merge: true });

      return res.status(200).json({
        success: true,
        message: "Subscribed to Proof Scout copy-trading",
        subscribed: true,
      });
    }

    if (action === "unsubscribe") {
      await docRef.set({
        subscribed: false,
        unsubscribedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "inactive",
      }, { merge: true });

      return res.status(200).json({
        success: true,
        message: "Unsubscribed from Proof Scout copy-trading",
        subscribed: false,
      });
    }

    if (action === "status") {
      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(200).json({
          success: true,
          subscribed: false,
          depositAmount: 0,
        });
      }

      const data = doc.data();
      return res.status(200).json({
        success: true,
        subscribed: data.subscribed || false,
        depositAmount: data.depositAmount || 0,
        totalBacked: data.totalBacked || 0,
        totalStaked: data.totalStaked || 0,
        status: data.status || "inactive",
        subscribedAt: data.subscribedAt || null,
      });
    }

    return res.status(400).json({ error: "Invalid action. Use subscribe, unsubscribe, or status." });
  } catch (err) {
    console.error("Copy Scout API error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Copy Scout operation failed",
      details: err.message,
    });
  }
}

export default withAgentAuth(handler);
