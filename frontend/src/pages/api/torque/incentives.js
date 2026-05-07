/**
 * Torque Incentives API
 *
 * Returns active incentive programs from Torque for display on the frontend.
 * Falls back to empty list when Torque is not configured.
 *
 * GET /api/torque/incentives
 */

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiToken = process.env.TORQUE_API_TOKEN;
  if (!apiToken) {
    return res.status(200).json({ incentives: [] });
  }

  const projectId = process.env.TORQUE_PROJECT_ID;
  if (!projectId) {
    return res.status(200).json({ incentives: [] });
  }

  try {
    const response = await fetch(
      `https://server.torque.so/projects/${projectId}/incentives`,
      { headers: { Authorization: `Bearer ${apiToken}` } }
    );

    if (!response.ok) {
      return res.status(200).json({ incentives: [] });
    }

    const { data } = await response.json();
    const active = (data || []).filter(
      (i) => i.status === "ACTIVE" || i.status === "active"
    );

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ incentives: active });
  } catch (err) {
    console.warn("[Torque] incentives fetch failed (non-blocking):", err.message);
    return res.status(200).json({ incentives: [] });
  }
}
