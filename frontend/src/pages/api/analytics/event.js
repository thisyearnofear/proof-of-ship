export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { event, properties, timestamp, url } = req.body;

  if (!event || typeof event !== "string") {
    return res.status(400).json({ error: "Event name is required" });
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", event, properties);
  }

  return res.status(200).json({ success: true });
}
