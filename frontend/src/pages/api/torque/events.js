/**
 * Torque Event Proxy
 *
 * Receives events from TorqueService (client-side) and forwards them
 * to the Torque ingestion API. Keeps the API key server-side.
 *
 * POST /api/torque/events
 * Body: { eventName, userPubkey, timestamp, data }
 *
 * Returns 202 on success, 503 when not configured.
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.TORQUE_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "Torque not configured",
      message: "Set TORQUE_API_KEY to enable event tracking",
    });
  }

  try {
    const { eventName, userPubkey, timestamp, data } = req.body;

    if (!eventName || !userPubkey) {
      return res.status(400).json({ error: "eventName and userPubkey required" });
    }

    const response = await fetch("https://ingest.torque.so/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        eventName,
        userPubkey,
        timestamp: timestamp || new Date().toISOString(),
        data: data || {},
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn("[Torque API] upstream rejected:", response.status, text);
      return res.status(response.status).json({
        error: "Upstream rejection",
        upstream: text.slice(0, 200),
      });
    }

    return res.status(202).json({ success: true });
  } catch (err) {
    console.error("[Torque API] proxy error:", err);
    return res.status(500).json({ error: "Proxy failed", message: err.message });
  }
}
