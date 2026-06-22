import { db, auth } from "@/lib/firebase/serverOnly";
import { verifyAuth, isAdmin, withApiMiddleware } from "@/utils/apiMiddleware";

async function handler(req, res) {
  switch (req.method) {
    case "GET":
      return handleLookup(req, res);
    case "POST":
      return handleSubmit(req, res);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleLookup(req, res) {
  const { id } = req.query || {};
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing id' });
  }
  try {
    const fbRef = db.collection('feedback').doc(id);
    const fbSnap = await fbRef.get();
    if (!fbSnap.exists) return res.status(404).json({ error: 'Not found' });
    const feedback = { id: fbSnap.id, ...fbSnap.data() };

    let user = null;
    if (feedback.submittedBy) {
      const userSnap = await db.collection('users').doc(feedback.submittedBy).get();
      if (userSnap.exists) user = { id: userSnap.id, ...userSnap.data() };
    }

    return res.status(200).json({ feedback, user });
  } catch (e) {
    console.error('lookup error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleSubmit(req, res) {
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

    const allowedHosts = new Set(["www.youtube.com","youtu.be","vimeo.com","www.loom.com","loom.com","imgur.com","i.imgur.com","drive.google.com","dropbox.com","www.dropbox.com"]);
    const isAllowedUrl = (u) => {
      try {
        const url = new URL(String(u));
        return allowedHosts.has(url.host);
      } catch {
        return false;
      }
    };

    if (taskId) {
      try {
        const projectSnap = await db.collection('projects').doc(projectSlug).get();
        if (!projectSnap.exists) {
          return res.status(400).json({ error: 'Project not found for provided taskId' });
        }
        const project = projectSnap.data();
        const tasks = Array.isArray(project.testerTasks) ? project.testerTasks : [];
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
          return res.status(400).json({ error: 'Invalid taskId for this project' });
        }
        const nowIso = new Date().toISOString();
        if (task.startAt && nowIso < String(task.startAt)) {
          return res.status(400).json({ error: 'Task has not started yet' });
        }
        if (task.endAt && nowIso > String(task.endAt)) {
          return res.status(400).json({ error: 'Task has ended' });
        }
      } catch (e) {
        console.error('Task validation failed:', e);
        return res.status(500).json({ error: 'Task validation error' });
      }
    }

    let finalStatus = "submitted";
    if (["accepted","rejected"].includes(status)) {
      try {
        const { isAdmin: admin } = await isAdmin(req, auth, db);
        if (admin) finalStatus = status;
      } catch (_) {
        finalStatus = "submitted";
      }
    }

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
      status: finalStatus,
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection("feedback").add(doc);

    res.status(201).json({ success: true, id: ref.id });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default withApiMiddleware(handler, {
  allowedMethods: ["GET", "POST"],
  rateLimit: 30,
  rateLimitKey: "FEEDBACK_API",
});
