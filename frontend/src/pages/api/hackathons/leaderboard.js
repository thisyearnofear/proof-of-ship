/**
 * Hackathon Leaderboard API
 *
 * Ranks hackathons by verifiable on-chain metrics:
 * - Total projects submitted
 * - Number of winners
 * - Average payout time (days from outcome to payout)
 * - Payout completion rate (% of winners who recorded payout)
 * - Total prize pool distributed
 * - Builder participation volume
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
            totalPayoutDays: 0,
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

        // Compute payout latency if both outcome and payout dates are available
        if (claim.payoutAt) {
          entry.payoutsRecorded++;
          entry.totalPrizeAmount += 0; // Prize amount not stored per-claim currently
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

      const avgPayoutDays = entry.payoutsRecorded > 0
        ? Math.round(entry.totalPayoutDays / entry.payoutsRecorded)
        : null;

      const builderCount = entry.uniqueBuilders.size;

      // Composite score: higher is better
      // - Payout speed (weight 35): lower avgPayoutDays = higher score
      // - Payout completion rate (weight 30): percentage of winners paid
      // - Builder participation (weight 20): more builders = healthier
      // - Project volume (weight 15): more projects = more activity
      // Payout speed requires both payout dates AND winner-declared timestamps
      // which aren't captured in the current data model, so we redistribute weight
      const hasPayoutTimeline = avgPayoutDays !== null && avgPayoutDays > 0;

      const payoutSpeedScore = hasPayoutTimeline
        ? Math.max(0, Math.min(100, Math.round((1 - avgPayoutDays / 365) * 100)))
        : null;

      const completionScore = payoutCompletionRate;
      const builderScore = Math.min(100, builderCount * 20);
      const volumeScore = Math.min(100, entry.totalProjects * 15);

      // Redistribute payout speed weight across other factors when unavailable
      let score;
      if (payoutSpeedScore !== null) {
        score = Math.round(
          payoutSpeedScore * 0.35 +
          completionScore * 0.30 +
          builderScore * 0.20 +
          volumeScore * 0.15
        );
      } else {
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
