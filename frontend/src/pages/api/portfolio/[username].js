import { db } from "../../../lib/firebase/serverOnly";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const username = String(req.query.username || "").trim().toLowerCase();
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    let userSnapshot = await db
      .collection("users")
      .where("githubUsername", "==", username)
      .limit(1)
      .get();

    // Fallback: look up by numeric GitHub user ID
    if (userSnapshot.empty) {
      userSnapshot = await db
        .collection("users")
        .where("githubId", "==", username)
        .limit(1)
        .get();
    }

    // Fallback: look up by document ID (Firebase UID)
    if (userSnapshot.empty) {
      try {
        const docSnap = await db.collection("users").doc(username).get();
        if (docSnap.exists) {
          userSnapshot = { docs: [docSnap], empty: false };
        }
      } catch { /* not a valid doc ID */ }
    }

    // Fallback: look up by wallet address (for backer/wallet-only users)
    if (userSnapshot.empty && /^0x[a-fA-F0-9]{40}$/.test(username)) {
      userSnapshot = await db
        .collection("users")
        .where("walletAddress", "==", username)
        .limit(1)
        .get();
    }

    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    let projects = [];

    try {
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

      projects = Array.from(projectMap.values()).sort((a, b) => {
        const dateA = a.updatedAt || a.createdAt || a.submittedAt || "";
        const dateB = b.updatedAt || b.createdAt || b.submittedAt || "";
        return String(dateB).localeCompare(String(dateA));
      });
    } catch (projectErr) {
      // Projects query can fail if Firestore indexes are missing — don't fail the whole request
      console.warn("Portfolio projects query failed:", projectErr.message);
    }

    let followerCount = 0;
    try {
      const countSnap = await db
        .collection("follows")
        .where("followedId", "==", userDoc.id)
        .count()
        .get();
      followerCount = countSnap.data().count;
    } catch { /* follows index may not exist yet */ }

    // Fetch recent follow events targeting this user
    let followEvents = [];
    try {
      const followSnap = await db
        .collection("follow_events")
        .where("followedId", "==", userDoc.id)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      for (const docSnap of followSnap.docs) {
        const data = docSnap.data();
        const followerName = data.followerDisplayName || data.followerGithubUsername || "Someone";
        followEvents.push({
          id: docSnap.id,
          type: "follow",
          message: data.type === "follow"
            ? `${followerName} started following`
            : `${followerName} unfollowed`,
          timestamp: data.createdAt,
          userHandle: data.followerDisplayName || data.followerGithubUsername,
        });
      }
    } catch (err) {
      // follow_events index may not exist yet — don't fail the whole request
      console.warn("Follow events query failed:", err.message);
    }

    // Fetch recent Ships Log entries across all user projects
    let recentActivity = [];
    const projectSlugs = projects.map((p) => p.slug || p.id).filter(Boolean);

    if (projectSlugs.length > 0) {
      try {
        // Firestore doesn't support WHERE-IN with more than 10 values in a single
        // composite query, so we batch in groups of 10
        const BATCH_SIZE = 10;
        const batches = [];

        for (let i = 0; i < projectSlugs.length; i += BATCH_SIZE) {
          const batch = projectSlugs.slice(i, i + BATCH_SIZE);
          batches.push(
            db
              .collection("ships_logs")
              .where("projectSlug", "in", batch)
              .orderBy("timestamp", "desc")
              .limit(20)
              .get()
          );
        }

        const snapshots = await Promise.all(batches);
        const activityMap = new Map();

        for (const snapshot of snapshots) {
          for (const docSnap of snapshot.docs) {
            const entry = { id: docSnap.id, ...docSnap.data() };
            // Deduplicate by id
            if (!activityMap.has(docSnap.id)) {
              activityMap.set(docSnap.id, entry);
            }
          }
        }

        recentActivity = Array.from(activityMap.values())
          .sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")))
          .slice(0, 30);

        // Merge follow events and re-sort
        recentActivity = [...recentActivity, ...followEvents]
          .sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")))
          .slice(0, 30);
      } catch (logErr) {
        // Ships logs query can fail if indexes are missing — don't fail the whole request
        console.warn("Ships logs query failed:", logErr.message);
      }
    }

    // Check if user is a verified hackathon winner
    let verifiedWinner = false;
    let winnerData = null;
    try {
      const winnerSnap = await db.collection('hackathonWinners').doc(userDoc.id).get();
      if (winnerSnap.exists) {
        verifiedWinner = true;
        winnerData = winnerSnap.data();
      }
    } catch {
      // Non-fatal — just don't show the badge
    }

    // Compute aggregate stats
    const totalStars = projects.reduce((sum, p) => sum + (p.stats?.stars || 0), 0);
    const totalCommits = projects.reduce((sum, p) => sum + (p.stats?.commits || 0), 0);
    const totalForks = projects.reduce((sum, p) => sum + (p.stats?.forks || 0), 0);
    const projectsWithHealth = projects.filter(p => p.stats?.healthScore);
    const avgHealth = projectsWithHealth.length > 0
      ? Math.round(projectsWithHealth.reduce((sum, p) => sum + (p.stats?.healthScore || 0), 0) / projectsWithHealth.length)
      : 0;

    res.status(200).json({
      user: {
        uid: userDoc.id,
        githubUsername: user.githubUsername || username,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        walletAddress: user.walletAddress || null,
        bio: user.bio || null,
        verifiedWinner,
        winnerData: winnerData ? {
          totalWins: winnerData.totalWins || 0,
          lastVerifiedAt: winnerData.lastVerifiedAt || null,
        } : null,
      },
      projects,
      recentActivity,
      stats: {
        totalProjects: projects.length,
        totalStars,
        totalCommits,
        totalForks,
        avgHealth,
        ecosystems: new Set(projects.map(p => p.ecosystem).filter(Boolean)).size,
      },
    });
  } catch (error) {
    console.error("Error loading portfolio:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
