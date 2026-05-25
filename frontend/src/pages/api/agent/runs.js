/**
 * Agent Runs API
 *
 * GET /api/agent/runs?limit=20&projectSlug=<slug>
 *
 * Returns recent agent runs from Firestore for the audit log and ticker.
 * Supports optional filtering by project slug.
 */

import { db } from "@/lib/firebase/serverOnly";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const limitCount = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const { projectSlug } = req.query;

    let q = db
      .collection("agent_runs")
      .orderBy("timestamp", "desc")
      .limit(limitCount);

    const snapshot = await q.get();
    const runs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type || "unknown",
        timestamp: data.timestamp,
        status: data.totalFailed > 0 ? "partial" : "completed",
        ...data,
      };
    });

    // Optional: filter by project slug on the server
    const filtered = projectSlug
      ? runs.filter(
          (r) =>
            r.project?.slug === projectSlug ||
            r.results?.some?.((result) => result.projectId === projectSlug || result.id === projectSlug)
        )
      : runs;

    return res.status(200).json({
      success: true,
      count: filtered.length,
      runs: filtered,
    });
  } catch (err) {
    console.error("Agent runs API error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch agent runs",
      details: err.message,
    });
  }
}
