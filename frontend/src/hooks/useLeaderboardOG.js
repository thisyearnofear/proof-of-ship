/**
 * useLeaderboardOG — Resolve the highlighted entry + OG card metadata
 * from the `?ref=` query param.
 *
 * `ref` format: "type-rank" e.g. "proof-builder-3", "hackathon-1".
 * Returns `{ highlightedEntry, ogImageUrl, ogTitle, ogDescription }`,
 * all `null` when no ref is present or it can't be resolved.
 */

import { useMemo } from "react";

const LABELS = {
  "proof-builder": "Proof Builder",
  project: "Proven Project",
  hackathon: "Hackathon",
  builder: "Top Builder",
  backer: "Top Backer",
};

function resolveHighlighted(ref, entries) {
  if (!ref || typeof ref !== "string") return null;
  const parts = ref.split("-");
  const rankStr = parts[parts.length - 1];
  const rank = parseInt(rankStr, 10);
  let searchList = [];
  let ogType = null;
  if (ref.startsWith("proof-builder")) { searchList = entries.proofBuilders; ogType = "proof-builder"; }
  else if (ref.startsWith("project")) { searchList = entries.projects; ogType = "project"; }
  else if (ref.startsWith("hackathon")) { searchList = entries.hackathons; ogType = "hackathon"; }
  else if (ref.startsWith("builder")) { searchList = entries.builders; ogType = "builder"; }
  else if (ref.startsWith("backer")) { searchList = entries.backers; ogType = "backer"; }
  if (!ogType || searchList.length === 0) return null;
  const entry = searchList[rank - 1];
  if (!entry) return null;
  return { entry, rank, ogType };
}

function buildOgImageUrl(highlightedEntry) {
  if (!highlightedEntry) return null;
  const { entry, rank, ogType } = highlightedEntry;
  const params = new URLSearchParams();
  params.set("type", ogType);
  params.set("rank", String(rank));
  params.set("name", String(entry.name || entry.address || "Builder").slice(0, 100));
  if (entry.score) params.set("score", String(entry.score));
  if (entry.movement) params.set("movement", entry.movement);
  if (entry.evidenceCoverage) params.set("evidenceCoverage", String(entry.evidenceCoverage));
  if (entry.verifiedWins) params.set("verifiedWins", String(entry.verifiedWins));
  if (entry.ecosystem) params.set("ecosystem", entry.ecosystem);
  if (entry.avgPayoutDays !== null && entry.avgPayoutDays !== undefined) params.set("avgPayoutDays", String(entry.avgPayoutDays));
  if (entry.payoutCompletionRate) params.set("payoutRate", String(entry.payoutCompletionRate));
  if (entry.velocity) params.set("velocity", String(entry.velocity));
  if (entry.projectCount) params.set("projectCount", String(entry.projectCount));
  if (entry.totalBacked) params.set("totalBacked", String(Math.round(entry.totalBacked)));
  if (entry.projectsBacked) params.set("projectsBacked", String(entry.projectsBacked));
  const origin = typeof window !== "undefined" ? window.location.origin : "https://proofofship.app";
  return `${origin}/api/og/leaderboard?${params.toString()}`;
}

function buildOgTitle(highlightedEntry) {
  if (!highlightedEntry) return "Leaderboard | Proof of Ship";
  const { entry, rank, ogType } = highlightedEntry;
  const label = LABELS[ogType] || ogType;
  const name = entry.name || entry.address || "Builder";
  return `#${rank} ${label}: ${name} | Proof of Ship`;
}

function buildOgDescription(highlightedEntry) {
  if (!highlightedEntry) return "Top builders and backers ranked by proof strength, payout behavior, and shipping velocity.";
  const { entry, rank, ogType } = highlightedEntry;
  const name = entry.name || entry.address || "Builder";
  const scoreStr = entry.score ? `Score: ${entry.score}` : "";
  const evidenceStr = entry.evidenceCoverage ? ` · ${entry.evidenceCoverage}% evidence coverage` : "";
  const movementStr = entry.movement === "up" ? " · Moving up!" : entry.movement === "new" ? " · New entry!" : "";
  return `#${rank} ${name}${scoreStr}${evidenceStr}${movementStr} — Proof of Ship leaderboard`;
}

export function useLeaderboardOG(ref, entries) {
  const highlightedEntry = useMemo(() => resolveHighlighted(ref, entries), [ref, entries]);
  const ogImageUrl = useMemo(() => buildOgImageUrl(highlightedEntry), [highlightedEntry]);
  const ogTitle = useMemo(() => buildOgTitle(highlightedEntry), [highlightedEntry]);
  const ogDescription = useMemo(() => buildOgDescription(highlightedEntry), [highlightedEntry]);
  return { highlightedEntry, ogImageUrl, ogTitle, ogDescription };
}
