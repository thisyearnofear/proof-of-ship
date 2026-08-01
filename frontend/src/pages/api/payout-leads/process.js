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
import { payoutVerifierService } from "../../../services/PayoutVerifierService";
import { logActivity } from "../../../utils/activityLogger";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === "production") {
    return res.status(503).json({ error: "Cron authentication is not configured" });
  }
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

        // Idempotency: skip leads already verified
        if (lead.status === "verified") {
          skipped++;
          details.push({ leadId, status: "skipped", reason: "already verified" });
          continue;
        }

        // Trust gate: require evidence URL (announcement link) before creating
        // a public-facing claim. Without evidence, the claim stays pending
        // and is not surfaced on the leaderboard.
        const evidenceUrl = lead.announcementUrl || lead.evidenceUrl || null;
        if (!evidenceUrl) {
          // Mark as pending — admin can add evidence and re-process
          await db.collection("payoutLeads").doc(leadId).update({
            status: "pending_evidence",
            updatedAt: new Date().toISOString(),
          });
          skipped++;
          details.push({ leadId, status: "skipped", reason: "missing evidence URL" });
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
          verificationStatus: "pending",
          evidenceUrl,
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

    // ── Pass 2: On-chain payout verification ──────────────────────────
    // For each project with claims that have a payoutTxHash or circleTransferId
    // but haven't been verified yet, run PayoutVerifierService and upgrade
    // the verificationStatus to "payout_verified" when confirmed.
    try {
      const projectsSnap = await db.collection("projects")
        .where("hackathons", "!=", null)
        .get();

      let totalVerified = 0;

      for (const projectDoc of projectsSnap.docs) {
        const project = projectDoc.data();
        if (!Array.isArray(project.hackathons)) continue;

        let projectModified = false;
        const updatedHackathons = await Promise.all(project.hackathons.map(async (claim) => {
          // Only verify claims that haven't been verified yet but have evidence
          if (claim.verificationStatus === "payout_verified") return claim;
          if (!claim.payoutTxHash && !claim.circleTransferId) return claim;

          try {
            const result = await payoutVerifierService.verify({
              hackathonName: claim.name,
              winnerAddress: claim.payoutWallet || claim.winnerAddress || "0x0",
              expectedAmount: claim.prizeAmount || 0,
              payoutTxHash: claim.payoutTxHash,
              circleTransferId: claim.circleTransferId,
              chainId: claim.chainId,
            });

            if (result.result?.verified) {
              totalVerified++;
              projectModified = true;
              const verifiedClaim = {
                ...claim,
                verificationStatus: "payout_verified",
                payoutVerifiedAt: result.result.payoutTimestamp || new Date().toISOString(),
                payoutActualAmount: result.result.actualAmount,
              };

              // Fire "Payout Arrived" notification to the builder
              const builderUid = project.submittedBy || project.owner;
              if (builderUid) {
                logActivity({
                  type: "payout_verified",
                  userId: builderUid,
                  userHandle: builderUid,
                  description: `Payout verified for ${claim.name} — ${result.result.actualAmount || claim.prizeAmount || 0} USDC confirmed on-chain.`,
                  metadata: {
                    hackathonName: claim.name,
                    amount: result.result.actualAmount || claim.prizeAmount || 0,
                    projectSlug: projectDoc.id,
                    ecosystem: project.ecosystem,
                    txHash: result.result.payoutTxHash,
                  },
                }).catch(() => {});
              }

              return verifiedClaim;
            }
          } catch {
            // Verification failed — leave claim as-is, will retry next run
          }
          return claim;
        }));

        if (projectModified) {
          await db.collection("projects").doc(projectDoc.id).update({
            hackathons: updatedHackathons,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (verifyErr) {
      console.error("Payout verification pass error:", verifyErr);
      // Non-fatal — the leads were processed, verification can retry next run
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
