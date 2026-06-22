/**
 * Process Payout Leads — Cron-friendly endpoint
 *
 * GET /api/payout-leads/process
 *
 * Processes all unverified payout leads and converts them to
 * project hackathon claims. Designed to be called by a Vercel cron.
 * Skips leads that lack enough data (no hackathon name or email).
 *
 * Response:
 * {
 *   processed: number,
 *   skipped: number,
 *   errors: number,
 *   details: [{ leadId, status, projectSlug }]
 * }
 */

import { db } from "../../../lib/firebase/serverOnly";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const leadsSnap = await db
      .collection("payoutLeads")
      .where("status", "!=", "verified")
      .get();

    const details = [];
    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of leadsSnap.docs) {
      const lead = doc.data();
      const leadId = doc.id;

      try {
        if (!lead.hackathonName || !lead.email) {
          skipped++;
          details.push({ leadId, status: "skipped", reason: "missing required fields" });
          continue;
        }

        const slug = lead.hackathonName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") + `-lead-${leadId.slice(0, 8)}`;

        const claim = {
          name: lead.hackathonName,
          outcome: "winner",
          prizeAmount: lead.prizeAmount || 0,
          hackathonEndDate: new Date().toISOString(),
          payoutAt: null,
          payoutVerifiedAt: null,
          verificationStatus: "evidence_attached",
          source: "payout-lead",
          leadId,
          submittedAt: lead.createdAt || new Date().toISOString(),
        };

        await db.collection("projects").doc(slug).set({
          slug,
          name: `${lead.hackathonName} Winner`,
          owner: lead.email.split("@")[0],
          submittedBy: lead.email.split("@")[0],
          ecosystem: "arc",
          hackathons: [claim],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        await db.collection("payoutLeads").doc(leadId).update({
          status: "verified",
          verifiedAt: new Date().toISOString(),
          projectSlug: slug,
        });

        processed++;
        details.push({ leadId, status: "verified", projectSlug: slug });
      } catch (err) {
        errors++;
        details.push({ leadId, status: "error", error: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      total: leadsSnap.size,
      processed,
      skipped,
      errors,
      details,
    });
  } catch (err) {
    console.error("Process payout leads error:", err);
    return res.status(500).json({ error: "Failed to process payout leads" });
  }
}
