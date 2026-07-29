/**
 * Embeddable badge API — generates SVG badges (shields.io style) that
 * builders can embed in their GitHub READMEs.
 *
 * GET /api/badge?builder=<username>&type=proof|rank|level
 * GET /api/badge?project=<slug>&type=quality
 *
 * Returns image/svg+xml. No auth required — public data for embeds.
 */

import { db } from "../../lib/firebase/serverOnly";
import { computeBuilderXp, levelFromXp } from "../../lib/gamification/builderXp";
import { getProjectQuality } from "../../lib/projects/projectQuality";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { builder, project, type = "proof" } = req.query;

  try {
    let label = "Proof of Ship";
    let value = "—";
    let color = "#6B7280";

    if (builder) {
      const badgeData = await computeBuilderBadge(builder, type);
      label = badgeData.label;
      value = badgeData.value;
      color = badgeData.color;
    } else if (project) {
      const badgeData = await computeProjectBadge(project, type);
      label = badgeData.label;
      value = badgeData.value;
      color = badgeData.color;
    } else {
      return res.status(400).json({ error: "Provide ?builder= or ?project= parameter" });
    }

    const svg = renderBadge(label, value, color);

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).send(svg);
  } catch (err) {
    console.error("Badge generation error:", err);
    // Return a neutral badge instead of an error image
    const svg = renderBadge("Proof of Ship", "error", "#EF4444");
    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(svg);
  }
}

async function computeBuilderBadge(username, type) {
  // Fetch builder's projects
  const userSnap = await db.collection("users")
    .where("githubUsername", "==", String(username).trim().toLowerCase())
    .limit(1)
    .get();

  let userId = null;
  if (!userSnap.empty) {
    userId = userSnap.docs[0].id;
  } else {
    // Try by UID
    const docSnap = await db.collection("users").doc(String(username)).get();
    if (docSnap.exists) userId = docSnap.id;
  }

  if (!userId) {
    return { label: "Proof of Ship", value: "not found", color: "#6B7280" };
  }

  const projectsSnap = await db.collection("projects")
    .where("submittedBy", "==", userId)
    .get();
  const projects = projectsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const portfolio = {
    user: userSnap.empty ? {} : userSnap.docs[0].data(),
    projects,
    stats: {
      totalStars: projects.reduce((s, p) => s + (p.stats?.stars || 0), 0),
      totalCommits: projects.reduce((s, p) => s + (p.stats?.commits || 0), 0),
    },
  };

  const xp = computeBuilderXp(portfolio);

  switch (type) {
    case "level":
      return {
        label: "builder level",
        value: `Lv ${xp.level} · ${xp.levelTitle}`,
        color: xp.level >= 10 ? "#F59E0B" : xp.level >= 5 ? "#8B5CF6" : "#3B82F6",
      };
    case "rank": {
      // Fetch leaderboard rank
      try {
        const lbRes = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/hackathons/leaderboard`);
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          const builders = lbData.builders || [];
          const rank = builders.findIndex((b) => b.id === userId) + 1;
          if (rank > 0) {
            return {
              label: "proof rank",
              value: `#${rank}`,
              color: rank <= 3 ? "#F59E0B" : rank <= 10 ? "#8B5CF6" : "#3B82F6",
            };
          }
        }
      } catch { /* fall through */ }
      return { label: "proof rank", value: "unranked", color: "#6B7280" };
    }
    case "proof":
    default:
      return {
        label: "proof score",
        value: `${xp.totalXp} XP · Lv ${xp.level}`,
        color: xp.totalXp >= 1000 ? "#F59E0B" : xp.totalXp >= 300 ? "#8B5CF6" : "#3B82F6",
      };
  }
}

async function computeProjectBadge(slug, type) {
  const docSnap = await db.collection("projects").doc(String(slug)).get();
  if (!docSnap.exists) {
    return { label: "Proof of Ship", value: "not found", color: "#6B7280" };
  }
  const project = { id: docSnap.id, ...docSnap.data() };

  switch (type) {
    case "quality": {
      const quality = getProjectQuality(project);
      return {
        label: "project quality",
        value: `${quality.score}% · ${quality.tier}`,
        color: quality.score >= 80 ? "#10B981" : quality.score >= 60 ? "#F59E0B" : "#6B7280",
      };
    }
    case "proof":
    default: {
      const hackathons = Array.isArray(project.hackathons) ? project.hackathons : [];
      const verifiedWins = hackathons.filter((h) =>
        ["winner", "bounty winner"].includes(String(h.outcome || "").toLowerCase()) &&
        (h.payoutVerifiedAt || h.payoutTxHash)
      ).length;
      if (verifiedWins > 0) {
        return { label: "verified wins", value: `${verifiedWins} 🏆`, color: "#F59E0B" };
      }
      const evidenceCount = hackathons.filter((h) =>
        h.announcementUrl || h.submissionUrl || h.payoutTxHash || h.evidenceUrl
      ).length;
      return {
        label: "evidence",
        value: evidenceCount > 0 ? `${evidenceCount} claims` : "no proof",
        color: evidenceCount > 0 ? "#3B82F6" : "#6B7280",
      };
    }
  }
}

/**
 * Render a shields.io-style SVG badge.
 */
function renderBadge(label, value, color) {
  const labelWidth = Math.ceil(label.length * 6.5) + 10;
  const valueWidth = Math.ceil(value.length * 6.5) + 10;
  const totalWidth = labelWidth + valueWidth;
  const height = 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-label="${escapeXml(label)}: ${escapeXml(value)}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="${height}" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${color}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14">${escapeXml(label)}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${escapeXml(value)}</text>
  </g>
</svg>`;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
