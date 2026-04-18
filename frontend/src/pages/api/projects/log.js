import { db, auth } from "../../../lib/firebase/adminApp";
import { verifyAuth, withApiMiddleware } from "../../../utils/apiMiddleware";
import { logActivity } from "../../../utils/activityLogger";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await verifyAuth(req, auth);
    const { projectSlug, message, type = "micro_update" } = req.body;

    if (!projectSlug || !message) {
      return res.status(400).json({ error: "Missing projectSlug or message" });
    }

    // Verify ownership
    const userSnap = await db.collection("users").doc(userId).get();
    if (!userSnap.exists) {
      return res.status(403).json({ error: "User not found" });
    }

    const userData = userSnap.data();
    const hasPermission = (userData.permissions || []).some(
      (p) => p.projectSlug === projectSlug && p.role === "editor"
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Permission denied" });
    }

    // Get project name and ecosystem
    const projectSnap = await db.collection("projects").doc(projectSlug).get();
    if (!projectSnap.exists) {
      return res.status(404).json({ error: "Project not found" });
    }
    const projectData = projectSnap.data();

    const logEntry = {
      projectSlug,
      projectName: projectData.name,
      message,
      type,
      timestamp: new Date().toISOString(),
      userId,
      userHandle: userData.githubUsername || userData.displayName || userId,
    };

    // Save log entry
    await db.collection("ships_logs").add(logEntry);

    // Log to engagement feed
    await logActivity({
      type: "ships_log_update",
      projectSlug,
      projectName: projectData.name,
      userHandle: logEntry.userHandle,
      description: `🚢 Ship's Log: ${projectData.name} - ${message}`,
      ecosystem: projectData.ecosystem,
      metadata: {
        message
      }
    });

    res.status(201).json({ success: true, logEntry });
  } catch (error) {
    console.error("Error creating ship's log:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default withApiMiddleware(handler, { allowedMethods: ["POST"] });
