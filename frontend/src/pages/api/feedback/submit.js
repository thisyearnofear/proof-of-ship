import { db } from "../../../lib/firebase/adminApp";
import { withApiMiddleware } from "../../../utils/apiMiddleware";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      projectSlug,
      message,
      rating,
      recordingUrl,
      verificationProvider,
      verificationProof,
      submittedBy,
    } = req.body || {};

    if (!projectSlug || typeof projectSlug !== "string") {
      return res.status(400).json({ error: "projectSlug is required" });
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return res
        .status(400)
        .json({ error: "message must be at least 10 characters" });
    }

    const doc = {
      projectSlug: projectSlug.trim(),
      message: message.trim(),
      rating: typeof rating === "number" ? rating : null,
      recordingUrl: recordingUrl ? String(recordingUrl).trim() : null,
      verificationProvider: verificationProvider
        ? String(verificationProvider).trim()
        : null,
      verificationProof: verificationProof ? String(verificationProof).trim() : null,
      submittedBy: submittedBy ? String(submittedBy) : null,
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection("feedback").add(doc);

    res.status(201).json({ success: true, id: ref.id });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
