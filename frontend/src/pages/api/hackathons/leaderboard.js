/**
 * Hackathon Leaderboard API
 *
 * Ranks hackathons by verifiable on-chain metrics:
 * - Total projects submitted
 * - Number of winners
 * - Average payout time (days from hackathon end to payout — lower is better)
 * - Payout completion rate (% of winners who recorded payout)
 * - Total prize pool distributed
 * - Builder participation volume
 *
 * Payout speed requires both `hackathonEndDate` and `payoutAt`/`payoutVerifiedAt`
 * on individual hackathon claims. The PayoutVerifier agent sets `payoutVerifiedAt`
 * when it confirms an on-chain USDC transfer.
 *
 * GET /api/hackathons/leaderboard
 */

import { db } from "../../../lib/firebase/serverOnly";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch all projects
    const projectsSnap = await db.collection("projects").get();

    // Aggregate hackathon claims across all projects
    const hackathonMap = new Map();

    for (const doc of projectsSnap.docs) {
      const project = doc.data();
      const hackathons = Array.isArray(project.hackathons) ? project.hackathons : [];
      if (hackathons.length === 0) continue;

      for (const claim of hackathons) {
        if (!claim.name) continue;

        const key = claim.name.trim().toLowerCase();

        if (!hackathonMap.has(key)) {
          hackathonMap.set(key, {
            name: claim.name.trim(),
            ecosystem: project.ecosystem || null,
            totalProjects: 0,
            winners: 0,
            finalists: 0,
            payoutsRecorded: 0,
            payoutSpeedCount: 0,       // claims with both endDate + payout date
            totalPayoutDays: 0,         // sum of payout days for speed computation
            totalPrizeAmount: 0,
            projects: [],
            uniqueBuilders: new Set(),
            lastActivity: null,
          });
        }

        const entry = hackathonMap.get(key);
        entry.totalProjects++;
        entry.projects.push({
          slug: project.slug,
          name: project.name,
          ecosystem: project.ecosystem,
        });

        if (project.submittedBy) {
          entry.uniqueBuilders.add(project.submittedBy);
        }

        if (claim.outcome === 'winner') {
          entry.winners++;
        } else if (claim.outcome === 'finalist') {
          entry.finalists++;
        }

        // Payout completion tracking
        const hasPayout = claim.payoutVerifiedAt || claim.payoutAt;
        if (hasPayout) {
          entry.payoutsRecorded++;
          // Prize amount tracking if available
          const amount = Number(claim.payoutActualAmount) || 0;
          if (amount > 0) entry.totalPrizeAmount += amount;
        }

        // Payout speed: days from hackathonEndDate to payout
        const payoutDateStr = claim.payoutVerifiedAt || claim.payoutAt;
        const endDateStr = claim.hackathonEndDate;

        if (payoutDateStr && endDateStr) {
          const payoutDate = new Date(payoutDateStr);
          const endDate = new Date(endDateStr);

          if (!isNaN(payoutDate.getTime()) && !isNaN(endDate.getTime())) {
            const diffMs = payoutDate.getTime() - endDate.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            // Only count positive or zero delays (ignore payouts before hackathon ended)
            if (diffDays >= 0) {
              entry.payoutSpeedCount++;
              entry.totalPayoutDays += diffDays;
            }
          }
        }

        // Track most recent activity
        if (project.createdAt) {
          if (!entry.lastActivity || project.createdAt > entry.lastActivity) {
            entry.lastActivity = project.createdAt;
          }
        }
      }
    }

    // Format and compute derived metrics
    const hackathons = Array.from(hackathonMap.values()).map((entry) => {
      const payoutCompletionRate = entry.winners > 0
        ? Math.round((entry.payoutsRecorded / entry.winners) * 100)
        : 0;

      // Average payout days — only computed from claims where both dates exist
      const avgPayoutDays = entry.payoutSpeedCount > 0
        ? Math.round(entry.totalPayoutDays / entry.payoutSpeedCount)
        : null;

      const builderCount = entry.uniqueBuilders.size;

      // ── Composite score (higher is better) ───────────────────────
      // Payout speed (weight 35): lower avg days = higher score
      // Formula: 100 - min(avgDays / 365 * 100, 100) — linearly decays to 0 over a year
      // Payout completion (weight 30): % of winners paid
      // Builder count (weight 20): more unique builders = healthier ecosystem
      // Project volume (weight 15): more projects = more signal
      const hasPayoutTimeline = avgPayoutDays !== null && avgPayoutDays >= 0;

      const payoutSpeedScore = hasPayoutTimeline
        ? Math.max(0, 100 - Math.round((avgPayoutDays / 365) * 100))
        : null;

      const completionScore = payoutCompletionRate;
      const builderScore = Math.min(100, builderCount * 20);
      const volumeScore = Math.min(100, entry.totalProjects * 15);

      let score;
      if (payoutSpeedScore !== null) {
        score = Math.round(
          payoutSpeedScore * 0.35 +
          completionScore * 0.30 +
          builderScore * 0.20 +
          volumeScore * 0.15
        );
      } else {
        // Redistribute payout speed weight when timeline data is unavailable
        score = Math.round(
          completionScore * 0.40 +
          builderScore * 0.35 +
          volumeScore * 0.25
        );
      }

      return {
        name: entry.name,
        ecosystem: entry.ecosystem,
        totalProjects: entry.totalProjects,
        winners: entry.winners,
        finalists: entry.finalists,
        payoutsRecorded: entry.payoutsRecorded,
        payoutCompletionRate,
        avgPayoutDays,
        totalPrizeAmount: Math.round(entry.totalPrizeAmount),
        builderCount: Array.from(entry.uniqueBuilders).length,
        lastActivity: entry.lastActivity || null,
        score,
      };
    });

    // Sort by composite score descending
    hackathons.sort((a, b) => b.score - a.score);

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    return res.status(200).json({
      hackathons: hackathons.slice(0, 100),
      total: hackathons.length,
    });
  } catch (err) {
    console.error("Hackathon leaderboard error:", err);
    return res.status(500).json({ error: "Failed to load hackathon leaderboard" });
  }
}
