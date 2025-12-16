import { db } from "../../../lib/firebase/adminApp";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const username = String(req.query.username || "").trim().toLowerCase();
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const userSnapshot = await db
      .collection("users")
      .where("githubUsername", "==", username)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    const ownersQuery = db
      .collection("projects")
      .where("owners", "array-contains", userDoc.id)
      .get();

    const submittedByQuery = db
      .collection("projects")
      .where("submittedBy", "==", userDoc.id)
      .get();

    const [ownersSnapshot, submittedSnapshot] = await Promise.all([
      ownersQuery,
      submittedByQuery,
    ]);

    const projectMap = new Map();

    for (const docSnap of ownersSnapshot.docs) {
      projectMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
    }

    for (const docSnap of submittedSnapshot.docs) {
      if (!projectMap.has(docSnap.id)) {
        projectMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      }
    }

    const projects = Array.from(projectMap.values()).sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt || a.submittedAt || "";
      const dateB = b.updatedAt || b.createdAt || b.submittedAt || "";
      return String(dateB).localeCompare(String(dateA));
    });

    res.status(200).json({
      user: {
        uid: userDoc.id,
        githubUsername: user.githubUsername || username,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
      },
      projects,
    });
  } catch (error) {
    console.error("Error loading portfolio:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
