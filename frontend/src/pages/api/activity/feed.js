/**
 * GET /api/activity/feed — Returns recent global activity (follow events, etc.)
 * for the homepage LiveActivityFeed.
 *
 * Query params:
 *   ?limit=10  — Number of items to return (default 10, max 30)
 */
import { db } from "../../../lib/firebase/serverOnly";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 30);

    // Fetch recent follow events globally
    const followSnap = await db
      .collection("follow_events")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const activities = [];

    for (const docSnap of followSnap.docs) {
      const data = docSnap.data();
      const followerName = data.followerDisplayName || data.followerGithubUsername || "Someone";

      activities.push({
        id: docSnap.id,
        type: "follow",
        user: followerName,
        message:
          data.type === "follow"
            ? `Started following a builder`
            : `Unfollowed a builder`,
        time: formatTimeAgo(data.createdAt),
        timestamp: data.createdAt,
      });
    }

    // Cache for 60s
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ activities });
  } catch (error) {
    console.error("Activity feed error:", error);
    return res.status(500).json({ error: "Internal server error", activities: [] });
  }
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
