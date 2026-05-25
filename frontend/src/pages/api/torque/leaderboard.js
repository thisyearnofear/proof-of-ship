/**
 * Leaderboard API
 *
 * Aggregates builder and backer data from Firestore activities
 * and Torque events. Returns ranked lists by shipping velocity.
 *
 * GET /api/torque/leaderboard?limit=50
 */

import { db } from "../../../lib/firebase/serverOnly";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  try {
    // Load previous snapshot for rank movement tracking
    let prevBuilders = null;
    let prevBackers = null;
    try {
      const prevSnap = await db.collection('leaderboardSnapshots').doc('torque').get();
      if (prevSnap.exists) {
        const prev = prevSnap.data();
        prevBuilders = prev.builders || null;
        prevBackers = prev.backers || null;
      }
    } catch (e) {
      // First run or Firestore not ready — no movement data yet
      console.warn('Could not load previous torque leaderboard snapshot:', e.message);
    }

    // Fetch all projects to build the builders leaderboard
    const projectsSnap = await db.collection("projects").get();

    // Build builder stats from projects
    const builderMap = new Map();

    for (const doc of projectsSnap.docs) {
      const p = doc.data();
      const owner = p.submittedBy || p.owner || "unknown";

      if (!builderMap.has(owner)) {
        builderMap.set(owner, {
          address: owner,
          name: p.owner || null,
          projectCount: 0,
          milestoneCount: 0,
          ecosystems: new Set(),
          velocity: 0,
        });
      }

      const builder = builderMap.get(owner);
      builder.projectCount++;
      const milestones = Array.isArray(p.milestones) ? p.milestones.length : 0;
      builder.milestoneCount += milestones;
      if (p.ecosystem) builder.ecosystems.add(p.ecosystem);

      // Shipping velocity: (projects * 5) + (milestones * 10)
      builder.velocity = builder.projectCount * 5 + builder.milestoneCount * 10;
    }

    const builders = Array.from(builderMap.values())
      .map((b) => ({
        ...b,
        ecosystems: undefined,
        primaryEcosystem: [...b.ecosystems][0] || null,
      }))
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, limit);

    // Fetch activities for backer stats
    let backers = [];
    try {
      const activitiesSnap = await db
        .collection("activities")
        .where("type", "==", "stake_added")
        .orderBy("timestamp", "desc")
        .limit(500)
        .get();

      const backerMap = new Map();

      for (const doc of activitiesSnap.docs) {
        const a = doc.data();
        const addr = a.userHandle || a.userPubkey || "unknown";

        if (!backerMap.has(addr)) {
          backerMap.set(addr, {
            address: addr,
            name: a.userName || null,
            totalBacked: 0,
            projectsBacked: new Set(),
            score: 0,
          });
        }

        const backer = backerMap.get(addr);
        const amount = parseFloat(a.amount) || 0;
        backer.totalBacked += amount;
        if (a.projectSlug) backer.projectsBacked.add(a.projectSlug);
        backer.score = Math.round(backer.totalBacked * 0.1 + backer.projectsBacked.size * 10);
      }

      backers = Array.from(backerMap.values())
        .map((b) => ({
          ...b,
          projectsBacked: b.projectsBacked.size,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (e) {
      // Activities collection may not exist yet — that's fine
      console.warn("Could not load backer activities:", e.message);
    }

    // Try to enrich with Torque leaderboard data if available
    if (process.env.TORQUE_API_KEY) {
      try {
        const torqueRes = await fetch("https://api.torque.so/leaderboard", {
          headers: { "x-api-key": process.env.TORQUE_API_KEY },
        });
        if (torqueRes.ok) {
          const torqueData = await torqueRes.json();
          // Merge Torque velocity scores with local data
          if (torqueData.builders) {
            for (const tBuilder of torqueData.builders) {
              const local = builders.find((b) => b.address === tBuilder.address);
              if (local) {
                local.velocity += tBuilder.velocity || 0;
                local.source = "torque";
              }
            }
            builders.sort((a, b) => b.velocity - a.velocity);
          }
          if (torqueData.backers) {
            for (const tBacker of torqueData.backers) {
              const local = backers.find((b) => b.address === tBacker.address);
              if (local) {
                local.score += tBacker.score || 0;
                local.source = "torque";
              }
            }
            backers.sort((a, b) => b.score - a.score);
          }
        }
      } catch (e) {
        console.warn("Torque leaderboard enrichment failed (non-blocking):", e.message);
      }
    }

    // Compute movement by comparing current rank against previous snapshot
    function computeMovement(entries, prevMap) {
      if (!prevMap) return entries;
      return entries.map((entry, idx) => {
        const id = entry.address;
        const prevIdx = prevMap[id];
        let movement = undefined;
        if (prevIdx === undefined) {
          movement = 'new';
        } else if (idx < prevIdx) {
          movement = 'up';
        } else if (idx > prevIdx) {
          movement = 'down';
        }
        return { ...entry, movement };
      });
    }

    const buildersWithMovement = computeMovement(builders, prevBuilders);
    const backersWithMovement = computeMovement(backers, prevBackers);

    // Save current rankings as snapshot for next comparison
    try {
      await db.collection('leaderboardSnapshots').doc('torque').set({
        builders: Object.fromEntries(builders.map((e, i) => [e.address, i])),
        backers: Object.fromEntries(backers.map((e, i) => [e.address, i])),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not save torque leaderboard snapshot (non-blocking):', e.message);
    }

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ builders: buildersWithMovement, backers: backersWithMovement });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ error: "Failed to load leaderboard" });
  }
}
