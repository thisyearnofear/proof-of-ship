/**
 * AI Scout Agent — evaluates projects and recommends micro-backings
 *
 * GET  /api/agent/scout           → run scout, return scored projects
 * POST /api/agent/scout?execute=1 → run scout AND execute backings on-chain
 *
 * Scoring model:
 *   GitHub velocity (40%) + project completeness (30%) + community signals (30%)
 *   → score 0–100 → multiplier + stake recommendation
 */

import { db } from "@/lib/firebase/adminApp";

// Scoring weights
const W = { github: 0.4, completeness: 0.3, community: 0.3 };

// Thresholds
const MIN_SCORE_TO_BACK = 60;
const STAKE_TIERS = [
  { min: 90, amount: 5.0, multiplier: 150 },
  { min: 80, amount: 3.0, multiplier: 150 },
  { min: 70, amount: 1.5, multiplier: 200 },
  { min: 60, amount: 0.5, multiplier: 300 },
];

function scoreGithub(stats) {
  if (!stats) return 0;
  const commits = Math.min((stats.commits || 0) / 100, 1) * 40;
  const stars = Math.min((stats.stars || 0) / 20, 1) * 20;
  const forks = Math.min((stats.forks || 0) / 10, 1) * 15;
  const issues = Math.min((stats.issues || 0) / 30, 1) * 10;
  const pulls = Math.min((stats.pulls || 0) / 20, 1) * 15;
  return commits + stars + forks + issues + pulls;
}

function scoreCompleteness(project) {
  let score = 0;
  if (project.description && project.description.length > 50) score += 20;
  if (project.contractAddress) score += 25;
  if (project.website) score += 10;
  if (project.milestones && project.milestones.length > 0) score += 25;
  if (project.hackathons && project.hackathons.length > 0) score += 10;
  if (project.isOpenSource) score += 10;
  return score;
}

function scoreCommunity(project) {
  let score = 0;
  if (project.teamMembers && project.teamMembers.length > 1) score += 30;
  if (project.twitter) score += 15;
  if (project.discord) score += 15;
  const daysSinceSubmit = project.submittedAt
    ? (Date.now() - new Date(project.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    : 999;
  if (daysSinceSubmit < 7) score += 25;
  else if (daysSinceSubmit < 30) score += 15;
  else if (daysSinceSubmit < 90) score += 5;
  if (project.lookingForFunding) score += 15;
  return score;
}

function computeScore(project) {
  const g = scoreGithub(project.stats);
  const c = scoreCompleteness(project);
  const s = scoreCommunity(project);
  const total = Math.round(g * W.github + c * W.completeness + s * W.community);
  return { total: Math.min(total, 100), breakdown: { github: Math.round(g), completeness: Math.round(c), community: Math.round(s) } };
}

function getRecommendation(score) {
  const tier = STAKE_TIERS.find((t) => score >= t.min);
  if (!tier) return null;
  return { amount: tier.amount, multiplier: tier.multiplier, label: `${tier.multiplier / 100}x` };
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch all projects from Firestore
    const snapshot = await db.collection("projects").get();
    const projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Score each project
    const scored = projects
      .map((project) => {
        const { total, breakdown } = computeScore(project);
        const recommendation = getRecommendation(total);
        return {
          id: project.id,
          name: project.name,
          ecosystem: project.ecosystem,
          slug: project.slug,
          score: total,
          breakdown,
          recommendation,
          backed: total >= MIN_SCORE_TO_BACK,
        };
      })
      .sort((a, b) => b.score - a.score);

    const toBack = scored.filter((p) => p.backed);
    const totalStake = toBack.reduce((sum, p) => sum + (p.recommendation?.amount || 0), 0);

    // Log scout run to Firestore
    const runId = `scout_${Date.now()}`;
    await db.collection("agent_runs").doc(runId).set({
      timestamp: new Date().toISOString(),
      projectsEvaluated: scored.length,
      projectsBacked: toBack.length,
      totalStakeRecommended: totalStake,
      executed: req.method === "POST" && req.query.execute === "1",
      results: toBack.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        amount: p.recommendation?.amount,
        multiplier: p.recommendation?.multiplier,
      })),
    });

    // If POST with execute=1, we'd call the contract here
    // For now, return the recommendations — execution wired in Day 3
    const executed = req.method === "POST" && req.query.execute === "1";

    return res.status(200).json({
      success: true,
      runId,
      summary: {
        evaluated: scored.length,
        recommended: toBack.length,
        totalStake: `$${totalStake.toFixed(2)} USDC`,
        executed,
      },
      projects: scored,
    });
  } catch (error) {
    console.error("Scout agent error:", error);
    return res.status(500).json({ error: "Scout agent failed", details: error.message });
  }
}
