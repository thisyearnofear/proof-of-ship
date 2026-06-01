/**
 * Shared constants + utilities for the leaderboard page.
 * Kept co-located with the components that consume them.
 */

import {
  TrophyIcon,
  RocketLaunchIcon,
  BanknotesIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";

export const TABS = [
  { id: "proof-builders", label: "Proof Builders", icon: TrophyIcon },
  { id: "projects", label: "Proven Projects", icon: FireIcon },
  { id: "hackathons", label: "Hackathons", icon: BoltIcon },
  { id: "builders", label: "Top Builders", icon: RocketLaunchIcon },
  { id: "backers", label: "Top Backers", icon: BanknotesIcon },
];

export const TAB_EXPLAINERS = {
  "proof-builders": "Builders ranked by verified wins, evidence coverage, and proof-backed project claims — the most credible in the ecosystem.",
  "projects": "Projects ranked by onchain evidence, verified hackathon claims, and overall credibility score.",
  "hackathons": "Hackathons ranked by payout speed, winner payment rates, and builder satisfaction.",
  "builders": "Top builders by shipping velocity, project submissions, and milestone completions.",
  "backers": "Top backers by staking volume, projects backed, and portfolio performance.",
};

export function truncateAddress(addr) {
  if (!addr) return "Unknown";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function generateShareText(entry, rank, type) {
  if (type === "builders") {
    return `#${rank} ${entry.name || truncateAddress(entry.address)} — ${entry.velocity || entry.score || 0} shipping velocity on @proofofship`;
  }
  if (type === "backers") {
    return `#${rank} ${entry.name || truncateAddress(entry.address)} — ${entry.velocity || entry.score || 0} backing score on @proofofship`;
  }
  return `#${rank} ${entry.name || truncateAddress(entry.address)} on @proofofship`;
}
