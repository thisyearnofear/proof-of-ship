/**
 * Payout Lead Verification API
 *
 * POST /api/payout-leads/verify
 *
 * Converts a payout lead into a project hackathon claim in Firestore.
 * This is how user-submitted payout data feeds into the leaderboard.
 * Optionally triggers the Scout agent to verify the payout.
 *
 * Body:
 * {
 *   leadId: string,           // Firestore doc ID from payoutLeads collection
 *   projectSlug?: string,     // Existing project slug to attach claim to
 *   projectName?: string,     // New project name (created if no slug given)
 *   builderEmail?: string,    // Email to look up existing builder
 *   triggerVerification?: boolean  // Whether to run agent verification (default false)
 * }
 */

import { db } from "../../../lib/firebase/serverOnly";
import { withAgentAuth } from "../../../lib/agentAuth";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { leadId, projectSlug, projectName, triggerVerification } = req.body;

    if (!leadId) {
      return res.status(400).json({ error: "leadId is required" });
    }

    // 1. Fetch the payout lead
    const leadDoc = await db.collection("payoutLeads").doc(leadId).get();
    if (!leadDoc.exists) {
      return res.status(404).json({ error: "Payout lead not found" });
    }
    const lead = leadDoc.data();

    // Idempotency: if lead is already verified, don't duplicate the claim
    if (lead.status === "verified") {
      return res.status(409).json({ error: "This lead has already been verified", projectSlug: lead.projectSlug || null });
    }

    // 2. Determine project slug (unified scheme: name-lead-{leadId[:8]})
    const slug = projectSlug || lead.hackathonName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + `-lead-${leadId.slice(0, 8)}`;

    // 3. Update or create the project document with a hackathon claim
    const projectRef = db.collection("projects").doc(slug);
    const projectSnap = await projectRef.get();

    const evidenceUrl = lead.announcementUrl || lead.evidenceUrl || null;

    const claim = {
      name: lead.hackathonName,
      outcome: "winner",
      prizeAmount: lead.prizeAmount || 0,
      hackathonEndDate: new Date().toISOString(),
      payoutAt: null,
      payoutVerifiedAt: null,
      // Claims start as "pending" until verified via PayoutVerifierService
      // or admin review. "evidence_attached" is only set when evidenceUrl exists
      // AND an on-chain attestation has been recorded.
      verificationStatus: evidenceUrl ? "evidence_attached" : "pending",
      evidenceUrl,
      source: "payout-lead",
      leadId: leadId,
      submittedAt: lead.createdAt,
    };

    if (!projectSnap.exists) {
      await projectRef.set({
        slug,
        name: projectName || `${lead.hackathonName} Winner`,
        owner: lead.email ? lead.email.split("@")[0] : "anonymous",
        submittedBy: lead.email ? lead.email.split("@")[0] : "anonymous",
        ecosystem: "arc",
        hackathons: [claim],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      const existing = projectSnap.data();
      const hackathons = Array.isArray(existing.hackathons) ? [...existing.hackathons] : [];
      // Idempotency: don't append a duplicate claim for the same lead
      const existingIdx = hackathons.findIndex(h => h.leadId === leadId);
      if (existingIdx >= 0) {
        hackathons[existingIdx] = claim;
      } else {
        hackathons.push(claim);
      }
      await projectRef.update({
        hackathons,
        updatedAt: new Date().toISOString(),
      });
    }

    // 4. Mark the lead as processed
    await db.collection("payoutLeads").doc(leadId).update({
      status: "verified",
      verifiedAt: new Date().toISOString(),
      projectSlug: slug,
    });

    const result = {
      success: true,
      projectSlug: slug,
      claim,
      leadProcessed: true,
    };

    // 5. Optionally trigger agent verification
    if (triggerVerification && lead.prizeAmount) {
      try {
        const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/agent/payout-verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.AGENT_API_KEY ? { "x-api-key": process.env.AGENT_API_KEY } : {}),
          },
          body: JSON.stringify({
            projectSlug: slug,
            hackathonClaimIndex: 0,
            winnerAddress: lead.wallet || "0x0000000000000000000000000000000000000000",
            expectedAmount: lead.prizeAmount,
          }),
        });
        const verifyData = await verifyRes.json();
        result.verification = verifyData;
      } catch (agentErr) {
        result.verification = { error: "Agent verification skipped", details: agentErr.message };
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("Payout lead verification error:", err);
    return res.status(500).json({ error: "Failed to verify payout lead", details: err.message });
  }
}

export default withAgentAuth(handler);
