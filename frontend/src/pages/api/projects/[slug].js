import { db, auth } from "../../../lib/firebase/serverOnly";
import { withApiMiddleware, verifyAuth, requireProjectPermission } from "../../../utils/apiMiddleware";

export default withApiMiddleware(handler, { allowedMethods: ["GET", "PUT", "DELETE"], rateLimit: 30, rateLimitKey: "PROJECT_DETAIL" });

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
  "testerTasks", // minimal tester tasks config allowed
  "imageUrl",
  "liveUrl",
  "otherCategoryDetail",
  "launchOnBags",
  "bagsTokenAddress",
  "bagsTokenMetadata",
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

  if (req.method === "DELETE") {
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userId = await verifyAuth(req, auth);

      const existingSnap = await projectRef.get();
      if (!existingSnap.exists) {
        return res.status(404).json({ error: "Project not found" });
      }

      const existing = existingSnap.data();
      const hasPermission = await requireProjectPermission(db, userId, slug, ['editor', 'admin']);
      if (!hasPermission && existing.submittedBy !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Soft-delete: if active backings exist, enter 30-day winding down period.
      // This protects backers who committed capital.
      const backingsSnap = await db.collection('backings')
        .where('projectSlug', '==', slug)
        .where('status', '==', 'active')
        .get();

      const activeBackings = backingsSnap.size;

      if (activeBackings > 0) {
        const now = new Date();
        const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const update = {
          status: 'winding_down',
          windingDownAt: now.toISOString(),
          windingDownExpiry: expiry.toISOString(),
          windingDownReason: existing.windingDownReason || 'Builder requested deletion',
          updatedAt: now.toISOString(),
        };

        await projectRef.update(update);

        return res.status(200).json({
          success: true,
          status: 'winding_down',
          activeBackings,
          expiresAt: expiry.toISOString(),
          message: `Project has ${activeBackings} active backer(s). It has been hidden and will be fully removed in 30 days, giving backers time to close positions.`,
        });
      }

      // No active backings — hard delete immediately
      await projectRef.delete();

      return res.status(200).json({ success: true, status: 'deleted' });
    } catch (error) {
      console.error("Error deleting project:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
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
        const userId = await verifyAuth(req, auth);

    const existingSnap = await projectRef.get();
    if (!existingSnap.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const existing = existingSnap.data();

    // Check server-side permission via shared helper
    const hasPermission = await requireProjectPermission(db, userId, slug, ['editor','admin']);
    if (!hasPermission) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updates = {};

    // Validate testerTasks if provided
    if (Array.isArray(req.body?.testerTasks)) {
      const valid = [];
      for (const t of req.body.testerTasks) {
        if (!t || typeof t !== "object") continue;
        const task = {
          id: String(t.id || '').trim() || Math.random().toString(36).slice(2),
          title: String(t.title || '').trim(),
          description: String(t.description || '').trim(),
          rewardUSDC: Number(t.rewardUSDC || 0),
          evidenceRequirements: Array.isArray(t.evidenceRequirements) ? t.evidenceRequirements.filter(Boolean).map(String) : [],
          startAt: t.startAt ? String(t.startAt) : null,
          endAt: t.endAt ? String(t.endAt) : null,
          limit: typeof t.limit === 'number' ? t.limit : null,
          reviewPolicy: t.reviewPolicy === 'auto' ? 'auto' : 'manual'
        };
        if (!task.title) continue;
        valid.push(task);
      }
      updates.testerTasks = valid;
    }
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

    const nextDoc = {
      ...existing,
      ...updates,
      ecosystem: newEcosystem,
      updatedAt: new Date().toISOString(),
    };

    await projectRef.set(nextDoc, { merge: true });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
