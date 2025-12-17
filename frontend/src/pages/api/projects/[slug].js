import { db, auth } from "../../../lib/firebase/adminApp";
import { withApiMiddleware } from "../../../utils/apiMiddleware";

export default withApiMiddleware(handler, { allowedMethods: ["GET", "PUT"], rateLimit: 30, rateLimitKey: "PROJECT_DETAIL" });

const ALLOWED_UPDATE_FIELDS = new Set([
  "name",
  "description",
  "githubUrl",
  "ecosystem",
  "category",
  "contractAddress",
  "deploymentTxHash",
  "website",
  "twitter",
  "discord",
  "teamMembers",
  "tags",
  "isOpenSource",
  "lookingForFunding",
  "fundingAmount",
  "milestones",
  "hackathons",
  "verified",
  "featured",
  "status",
]);

async function handler(req, res) {
  const slug = String(req.query.slug || "").trim();
  if (!slug) {
    return res.status(400).json({ error: "Slug is required" });
  }

  const projectRef = db.collection("projects").doc(slug);

  if (req.method === "GET") {
    try {
      const snap = await projectRef.get();
      if (!snap.exists) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.status(200).json({ id: snap.id, ...snap.data() });
    } catch (error) {
      console.error("Error loading project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
    return;
  }

  if (req.method !== "PUT") {
   return res.status(405).json({ error: "Method not allowed" });
 }

  try {
    // Verify auth for update
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = authHeader.substring(7);
    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
    } catch (e) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const userId = decoded.uid;

    const existingSnap = await projectRef.get();
    if (!existingSnap.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const existing = existingSnap.data();

    // Check server-side permission: owner or user permissions entry
    let hasPermission = Array.isArray(existing.owners) && existing.owners.includes(userId);
    if (!hasPermission) {
      try {
        const userSnap = await db.collection("users").doc(userId).get();
        const perms = userSnap.exists && Array.isArray(userSnap.data().permissions) ? userSnap.data().permissions : [];
        hasPermission = perms.some(p => p.projectSlug === slug && (p.role === "editor" || p.role === "admin"));
      } catch (e) {
        hasPermission = false;
      }
    }
    if (!hasPermission) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updates = {};
    for (const [key, value] of Object.entries(req.body || {})) {
      if (!ALLOWED_UPDATE_FIELDS.has(key)) continue;
      updates[key] = value;
    }

    if (typeof updates.githubUrl === "string" && updates.githubUrl.includes("github.com")) {
      const match = updates.githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        updates.owner = match[1];
        updates.repo = match[2].replace(".git", "");
      }
    }

    const oldEcosystem = existing.ecosystem;
    const newEcosystem = updates.ecosystem || oldEcosystem;

    const nextDoc = {
      ...existing,
      ...updates,
      ecosystem: newEcosystem,
      updatedAt: new Date().toISOString(),
    };

    await projectRef.set(nextDoc, { merge: true });

    if (newEcosystem) {
      await db.collection(`projects_${newEcosystem}`).doc(slug).set(nextDoc);
    }

    if (oldEcosystem && newEcosystem && oldEcosystem !== newEcosystem) {
      await db.collection(`projects_${oldEcosystem}`).doc(slug).delete();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
