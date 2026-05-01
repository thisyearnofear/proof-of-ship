/**
 * Expedition Metrics — Pure functions for deriving backer-facing metrics from project data.
 *
 * Extracted from useExpeditionData for testability and reuse.
 * All functions are deterministic — no random mocking.
 */

interface ProjectStats {
  isActive?: boolean;
  commits?: number;
  lastCommit?: string | null;
  healthScore?: number;
}

interface ProjectData {
  stats?: ProjectStats;
  backerCount?: number;
  totalBacked?: number;
  targetFunding?: number;
  activeMultiplier?: number;
  backingMultiplier?: number;
  founderStakedAmount?: number;
  lastCheckInTimestamp?: string;
  sectors?: string[];
  category?: string;
  [key: string]: any;
}

/**
 * Calculate project health from available stats.
 * Returns 0-100 based on activity signals.
 */
export function calculateHealth(project: ProjectData, now: number = Date.now()): number {
  const stats = project.stats || {};
  let score = 50; // baseline

  if (stats.isActive) score += 15;
  if ((stats.commits ?? 0) > 10) score += 10;
  if ((stats.commits ?? 0) > 50) score += 5;
  if (stats.lastCommit) {
    const daysSince = (now - new Date(stats.lastCommit).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) score += 15;
    else if (daysSince < 30) score += 5;
    else score -= 10;
  }
  if (stats.healthScore) score = Math.round((score + stats.healthScore) / 2);

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate backer confidence from backing data.
 * Returns 0-100 based on backer count and total staked vs target.
 */
export function calculateConfidence(project: ProjectData): number {
  const backerCount = project.backerCount || 0;
  const totalBacked = project.totalBacked || 0;
  const targetFunding = project.targetFunding || 10000;

  if (backerCount === 0 && totalBacked === 0) return 10; // minimal baseline

  const backerSignal = Math.min(backerCount / 10, 1) * 40;
  const fundingSignal = Math.min(totalBacked / targetFunding, 1) * 50;

  return Math.min(100, Math.round(backerSignal + fundingSignal + 10));
}

/**
 * Derive active multiplier from backing data.
 * Uses the highest active multiplier tier, or defaults to 1.5x.
 */
export function deriveMultiplier(project: ProjectData): number {
  if (project.activeMultiplier) return project.activeMultiplier;
  if (project.backingMultiplier) return project.backingMultiplier / 100;

  const multipliers = [1.5, 2.0, 3.0];
  const backerCount = project.backerCount || 0;
  return multipliers[Math.min(Math.floor(backerCount / 5), 2)];
}

/**
 * Derive hours since last check-in from available data.
 */
export function deriveLastCheckIn(project: ProjectData, now: number = Date.now()): number {
  if (project.lastCheckInTimestamp) {
    return Math.floor((now - new Date(project.lastCheckInTimestamp).getTime()) / (1000 * 60 * 60));
  }
  if (project.stats?.lastCommit) {
    return Math.floor((now - new Date(project.stats.lastCommit).getTime()) / (1000 * 60 * 60));
  }
  return 168; // default to stale
}

/**
 * Enhance a raw Firestore project with derived expedition metrics.
 * All values come from real data — no random mocking.
 */
export function enhanceProject(p: ProjectData, now: number = Date.now()) {
  const health = calculateHealth(p, now);
  const confidence = calculateConfidence(p);
  const activeMultiplier = deriveMultiplier(p);
  const totalBacked = p.totalBacked || 0;
  const targetFunding = p.targetFunding || 10000;
  const lastCheckIn = deriveLastCheckIn(p, now);

  return {
    ...p,
    confidence,
    health,
    activeMultiplier,
    projectedROI: (activeMultiplier - 1) * 100,
    totalBacked,
    targetFunding,
    founderStaked: (p.founderStakedAmount || 0) > 0,
    founderStakedAmount: p.founderStakedAmount || 0,
    lastCheckIn,
    category: p.sectors?.[0] || p.category || 'Infrastructure',
  };
}
