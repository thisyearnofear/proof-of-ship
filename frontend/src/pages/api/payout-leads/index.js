import { db } from "../../../lib/firebase/serverOnly";

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;

function rateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return { allowed: true };
  }
  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - record.windowStart)) / 1000) };
  }
  return { allowed: true };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return res.status(429).json({ error: `Too many requests. Try again in ${retryAfter}s.` });
  }

  try {
    const { hackathonName, email, prizeAmount, wallet } = req.body;

    if (!hackathonName || typeof hackathonName !== "string" || hackathonName.trim().length < 2) {
      return res.status(400).json({ error: "Hackathon name is required (min 2 chars)" });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const doc = {
      hackathonName: hackathonName.trim(),
      email: email.trim().toLowerCase(),
      prizeAmount: prizeAmount && !isNaN(prizeAmount) ? Number(prizeAmount) : null,
      wallet: wallet && typeof wallet === "string" ? wallet.trim() : null,
      createdAt: new Date().toISOString(),
      source: "payout-leaderboard",
    };

    await db.collection("payoutLeads").add(doc);

    // Notify via Slack webhook if configured
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhook) {
      fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `📥 New payout lead\n• Hackathon: ${doc.hackathonName}\n• Email: ${doc.email}${doc.prizeAmount ? `\n• Prize: $${doc.prizeAmount}` : ""}${doc.wallet ? `\n• Wallet: ${doc.wallet}` : ""}`,
        }),
      }).catch(() => {});
    }

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("Payout lead submission error:", err);
    return res.status(500).json({ error: "Failed to submit payout info" });
  }
}
