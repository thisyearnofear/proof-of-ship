import { db } from "../../../lib/firebase/adminApp";

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

export default async function handler(req, res) {
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
    const existingSnap = await projectRef.get();
    if (!existingSnap.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const existing = existingSnap.data();

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
