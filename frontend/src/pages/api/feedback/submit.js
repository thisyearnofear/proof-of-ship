import { db, auth } from "../../../lib/firebase/adminApp";
import { verifyAuth } from "../../../utils/apiMiddleware";
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

    // If taskId provided, validate against project's testerTasks and time window
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
        // Optional: enforce time window
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

    // Enforce that only admin can set non-submitted status
    let finalStatus = "submitted";
    if (["accepted","rejected"].includes(status)) {
      try {
        const uid = await verifyAuth(req, auth);
        const userSnap = await db.collection('users').doc(uid).get();
        const isAdmin = userSnap.exists && (userSnap.data().isAdmin === true || userSnap.data().role === 'admin');
        if (isAdmin) finalStatus = status;
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
