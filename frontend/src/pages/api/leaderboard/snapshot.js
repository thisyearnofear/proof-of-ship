/**
 * Weekly leaderboard snapshot — saves a timestamped season snapshot
 * for proper rank-movement tracking.
 *
 * Called weekly by Vercel cron. The main leaderboard API saves a snapshot
 * on every request (tied to cache cadence), but this weekly snapshot is
 * the "official" season boundary that rank-change notifications compare
 * against.
 */

import { db } from "../../../lib/firebase/serverOnly";

export default async function handler(_req, res) {
  // Verify Vercel cron signature — hard-fail in production when unset
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === "production") {
    return res.status(503).json({ error: "Cron authentication is not configured" });
  }
  if (cronSecret) {
    const authHeader = _req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const now = new Date();
    const seasonId = getSeasonId(now);

    // Fetch current leaderboard rankings
    // VERCEL_URL has no scheme — prefix https:// (or fall back to localhost for dev)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const leaderboardRes = await fetch(`${baseUrl}/api/hackathons/leaderboard`);
    if (!leaderboardRes.ok) {
      throw new Error(`Leaderboard fetch failed: ${leaderboardRes.status}`);
    }
    const data = await leaderboardRes.json();

    // Save as a season snapshot
    await db.collection("leaderboardSeasons").doc(seasonId).set({
      seasonId,
      capturedAt: now.toISOString(),
      hackathons: Object.fromEntries((data.hackathons || []).map((e, i) => [e.name, i])),
      builders: Object.fromEntries((data.builders || []).map((e, i) => [e.id || e.name, i])),
      projects: Object.fromEntries((data.projects || []).map((e, i) => [e.slug, i])),
      totals: data.total || {},
    });

    // Also save as the "previous" snapshot for the main leaderboard API
    await db.collection("leaderboardSnapshots").doc("hackathons").set({
      hackathons: Object.fromEntries((data.hackathons || []).map((e, i) => [e.name, i])),
      builders: Object.fromEntries((data.builders || []).map((e, i) => [e.id || e.name, i])),
      projects: Object.fromEntries((data.projects || []).map((e, i) => [e.slug, i])),
      updatedAt: now.toISOString(),
      seasonId,
    });

    return res.status(200).json({
      success: true,
      seasonId,
      capturedAt: now.toISOString(),
      totals: data.total || {},
    });
  } catch (err) {
    console.error("Weekly leaderboard snapshot error:", err);
    return res.status(500).json({ error: "Failed to capture snapshot" });
  }
}

/**
 * Season ID format: YYYY-WNN (ISO week number).
 * e.g. "2026-W31" for the 31st week of 2026.
 */
function getSeasonId(date) {
  const tmp = new Date(date);
  tmp.setHours(0, 0, 0, 0);
  // ISO week: Thursday determines the week number
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((tmp - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${tmp.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}
