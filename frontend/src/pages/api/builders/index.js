/**
 * Builders API
 *
 * Lists registered builders with profile data and project statistics.
 * Builders are users who have set a githubUsername (indicating active project submissions).
 *
 * GET /api/builders?search=&ecosystem=&sort=&limit=50
 */

import { db } from "../../../lib/firebase/serverOnly";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  try {
    // Fetch all users who have a githubUsername (active builders)
    const usersSnap = await db
      .collection("users")
      .where("githubUsername", ">", "")
      .get();

    // Build a map of uid -> user profile
    const builderMap = new Map();

    for (const doc of usersSnap.docs) {
      const data = doc.data();
      const gh = (data.githubUsername || "").trim();
      if (!gh) continue;

      builderMap.set(doc.id, {
        uid: doc.id,
        githubUsername: gh,
        displayName: data.displayName || gh,
        bio: data.bio || null,
        photoURL: data.photoURL || null,
        website: data.website || null,
        twitter: data.twitter || null,
        followerCount: data.followerCount || 0,
        projectCount: 0,
        ecosystems: new Set(),
        totalStars: 0,
        totalCommits: 0,
        averageHealth: 0,
        healthScores: [],
        lastActive: null,
      });
    }

    // If no builders found, return early
    if (builderMap.size === 0) {
      return res.status(200).json({
        builders: [],
        total: 0,
      });
    }

    // Fetch projects to enrich builder stats
    const projectsSnap = await db.collection("projects").get();

    for (const doc of projectsSnap.docs) {
      const p = doc.data();
      const submittedBy = p.submittedBy || p.owner;
      if (!submittedBy || !builderMap.has(submittedBy)) continue;

      const builder = builderMap.get(submittedBy);
      builder.projectCount++;
      if (p.ecosystem) builder.ecosystems.add(p.ecosystem);
      if (p.stats?.stars) builder.totalStars += p.stats.stars;
      if (p.stats?.commits) builder.totalCommits += p.stats.commits;
      if (p.stats?.healthScore) builder.healthScores.push(p.stats.healthScore);

      // Track most recent activity
      if (p.stats?.lastCommit) {
        const commitDate = new Date(p.stats.lastCommit);
        if (!builder.lastActive || commitDate > new Date(builder.lastActive)) {
          builder.lastActive = p.stats.lastCommit;
        }
      }
    }

    // Calculate averages and format response
    const builders = Array.from(builderMap.values())
      .map((b) => ({
        uid: b.uid,
        githubUsername: b.githubUsername,
        displayName: b.displayName,
        bio: b.bio,
        photoURL: b.photoURL,
        website: b.website,
        twitter: b.twitter,
        followerCount: b.followerCount,
        projectCount: b.projectCount,
        ecosystems: [...b.ecosystems],
        totalStars: b.totalStars,
        totalCommits: b.totalCommits,
        averageHealth:
          b.healthScores.length > 0
            ? Math.round(
                b.healthScores.reduce((sum, s) => sum + s, 0) /
                  b.healthScores.length
              )
            : 0,
        lastActive: b.lastActive,
      }))
      .filter((b) => b.projectCount > 0); // Only show builders with projects

    // Apply search filter
    let filtered = builders;
    const search = (req.query.search || "").toLowerCase().trim();
    if (search) {
      filtered = builders.filter(
        (b) =>
          b.displayName.toLowerCase().includes(search) ||
          b.githubUsername.toLowerCase().includes(search) ||
          (b.bio && b.bio.toLowerCase().includes(search))
      );
    }

    // Apply ecosystem filter
    const ecosystem = (req.query.ecosystem || "").trim();
    if (ecosystem) {
      filtered = filtered.filter((b) => b.ecosystems.includes(ecosystem));
    }

    // Sort
    const sortBy = req.query.sort || "projects";
    switch (sortBy) {
      case "projects":
        filtered.sort((a, b) => b.projectCount - a.projectCount);
        break;
      case "stars":
        filtered.sort((a, b) => b.totalStars - a.totalStars);
        break;
      case "health":
        filtered.sort((a, b) => b.averageHealth - a.averageHealth);
        break;
      case "recent":
        filtered.sort((a, b) => {
          if (!a.lastActive) return 1;
          if (!b.lastActive) return -1;
          return new Date(b.lastActive) - new Date(a.lastActive);
        });
        break;
      case "followers":
        filtered.sort((a, b) => b.followerCount - a.followerCount);
        break;
      case "name":
        filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
      default:
        filtered.sort((a, b) => b.projectCount - a.projectCount);
    }

    const total = filtered.length;
    filtered = filtered.slice(0, limit);

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    return res.status(200).json({
      builders: filtered,
      total,
    });
  } catch (err) {
    console.error("Builders API error:", err);
    return res.status(500).json({ error: "Failed to load builders" });
  }
}
