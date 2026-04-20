// Scoring weights
const W = { github: 0.4, completeness: 0.3, community: 0.3 };

// Thresholds
export const MIN_SCORE_TO_BACK = 60;
const STAKE_TIERS = [
  { min: 90, amount: 5.0, multiplier: 150 },
  { min: 80, amount: 3.0, multiplier: 150 },
  { min: 70, amount: 1.5, multiplier: 200 },
  { min: 60, amount: 0.5, multiplier: 300 },
];

export function scoreGithub(stats) {
  if (!stats) return 0;
  const commits = Math.min((stats.commits || 0) / 100, 1) * 40;
  const stars = Math.min((stats.stars || 0) / 20, 1) * 20;
  const forks = Math.min((stats.forks || 0) / 10, 1) * 15;
  const issues = Math.min((stats.issues || 0) / 30, 1) * 10;
  const pulls = Math.min((stats.pulls || 0) / 20, 1) * 15;
  return commits + stars + forks + issues + pulls;
}

export function scoreCompleteness(project) {
  let score = 0;
  if (project.description && project.description.length > 50) score += 20;
  if (project.contractAddress) score += 25;
  if (project.website) score += 10;
  if (project.milestones && project.milestones.length > 0) score += 25;
  if (project.hackathons && project.hackathons.length > 0) score += 10;
  if (project.isOpenSource) score += 10;
  return score;
}

export function scoreCommunity(project) {
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

export function computeScore(project) {
  const g = scoreGithub(project.stats);
  const c = scoreCompleteness(project);
  const s = scoreCommunity(project);
  const total = Math.round(g * W.github + c * W.completeness + s * W.community);
  return { 
    total: Math.min(total, 100), 
    breakdown: { github: Math.round(g), completeness: Math.round(c), community: Math.round(s) } 
  };
}

export function getRecommendation(score) {
  const tier = STAKE_TIERS.find((t) => score >= t.min);
  if (!tier) return null;
  return { amount: tier.amount, multiplier: tier.multiplier, label: `${tier.multiplier / 100}x` };
}
