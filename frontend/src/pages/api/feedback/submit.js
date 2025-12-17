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
      attachments,
      taskId,
      status,
    } = req.body || {};

    if (!projectSlug || typeof projectSlug !== "string") {
      return res.status(400).json({ error: "projectSlug is required" });
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return res
        .status(400)
        .json({ error: "message must be at least 10 characters" });
    }

    // Basic allowlist for evidence URLs to prevent random domains
    const allowedHosts = new Set(["www.youtube.com","youtu.be","vimeo.com","www.loom.com","loom.com","imgur.com","i.imgur.com","drive.google.com","dropbox.com","www.dropbox.com"]);
    const isAllowedUrl = (u) => {
      try {
        const url = new URL(String(u));
        return allowedHosts.has(url.host);
      } catch {
        return false;
      }
    };

    const doc = {
      projectSlug: projectSlug.trim(),
      message: message.trim(),
      rating: typeof rating === "number" ? rating : null,
      recordingUrl: recordingUrl && isAllowedUrl(recordingUrl) ? String(recordingUrl).trim() : null,
      verificationProvider: verificationProvider
        ? String(verificationProvider).trim()
        : null,
      verificationProof: verificationProof ? String(verificationProof).trim() : null,
      submittedBy: submittedBy ? String(submittedBy) : null,
      attachments: Array.isArray(attachments) ? attachments.filter(isAllowedUrl).map(String) : [],
      taskId: taskId ? String(taskId).trim() : null,
      status: ["submitted","accepted","rejected"].includes(status) ? status : "submitted",
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection("feedback").add(doc);

    res.status(201).json({ success: true, id: ref.id });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
