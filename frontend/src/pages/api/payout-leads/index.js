import { db } from "../../../lib/firebase/serverOnly";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
