/**
 * Builder XP & Progression System
 *
 * Pure functions that derive XP, level, streaks, and progression from
 * existing portfolio data (projects, stats, hackathon proof). No backend
 * changes needed — computed client-side from data the API already returns.
 *
 * XP sources (mirrors real platform value):
 *   - Project published:        +50 XP each
 *   - Verified hackathon win:   +200 XP each
 *   - Evidence-backed claim:    +75 XP each
 *   - Multi-ecosystem bonus:    +100 XP (2+), +250 XP (4+)
 *   - GitHub stars:             +2 XP per star
 *   - Community followers:      +10 XP per follower
 *   - Ships log check-in:       +15 XP each
 *
 * Levels follow a quadratic curve: level N requires 100 * N^2 XP cumulative.
 * This makes early levels fast (hook) and later levels meaningful (grind).
 */

const XP_PER_PROJECT = 50;
const XP_PER_VERIFIED_WIN = 200;
const XP_PER_EVIDENCE_CLAIM = 75;
const XP_MULTI_ECOSYSTEM_2 = 100;
const XP_MULTI_ECOSYSTEM_4 = 250;
const XP_PER_STAR = 2;
const XP_PER_FOLLOWER = 10;
const XP_PER_CHECKIN = 15;

/**
 * Total XP required to reach a given level (cumulative).
 * Level 1 = 0 XP, Level 2 = 400 XP, Level 3 = 900 XP, etc.
 */
export function xpForLevel(level) {
  if (level <= 1) return 0;
  return 100 * (level - 1) * (level - 1);
}

/**
 * Inverse: given total XP, what level is the builder?
 */
export function levelFromXp(totalXp) {
  if (totalXp <= 0) return 1;
  const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
  return Math.max(1, level);
}

/**
 * Compute a detailed XP breakdown from portfolio data.
 *
 * @param {object} portfolio — portfolio API response ({ user, projects, stats })
 * @returns {object} XP breakdown with total, level, progress, sources, streak
 */
export function computeBuilderXp(portfolio) {
  if (!portfolio || !portfolio.projects) {
    return emptyXp();
  }

  const { projects, stats, user } = portfolio;
  const sources = [];

  // ── Project publications ──
  const projectCount = projects.length;
  const projectXp = projectCount * XP_PER_PROJECT;
  if (projectXp > 0) {
    sources.push({
      id: "projects",
      label: `${projectCount} project${projectCount !== 1 ? "s" : ""} published`,
      xp: projectXp,
      icon: "rocket",
    });
  }

  // ── Verified hackathon wins + evidence claims ──
  let verifiedWins = 0;
  let evidenceClaims = 0;
  for (const project of projects) {
    const hackathons = Array.isArray(project.hackathons) ? project.hackathons : [];
    for (const claim of hackathons) {
      const hasEvidence = Boolean(
        claim.announcementUrl || claim.submissionUrl || claim.payoutTxHash ||
        claim.payoutWallet || claim.evidenceUrl || claim.repoUrl || claim.contractAddress
      );
      if (hasEvidence) evidenceClaims++;
      const isWin = ["winner", "bounty winner"].includes(String(claim.outcome || "").trim().toLowerCase());
      const isVerified = Boolean(claim.payoutVerifiedAt || claim.payoutTxHash || claim.verificationStatus === "payout_verified");
      if (isWin && isVerified) verifiedWins++;
    }
  }

  const winXp = verifiedWins * XP_PER_VERIFIED_WIN;
  if (winXp > 0) {
    sources.push({
      id: "verified-wins",
      label: `${verifiedWins} verified hackathon win${verifiedWins !== 1 ? "s" : ""}`,
      xp: winXp,
      icon: "trophy",
    });
  }

  const evidenceXp = evidenceClaims * XP_PER_EVIDENCE_CLAIM;
  if (evidenceXp > 0) {
    sources.push({
      id: "evidence",
      label: `${evidenceClaims} evidence-backed claim${evidenceClaims !== 1 ? "s" : ""}`,
      xp: evidenceXp,
      icon: "shield",
    });
  }

  // ── Multi-ecosystem bonus ──
  const ecosystems = new Set(projects.map((p) => p.ecosystem).filter(Boolean));
  let ecoBonus = 0;
  if (ecosystems.size >= 4) ecoBonus = XP_MULTI_ECOSYSTEM_4;
  else if (ecosystems.size >= 2) ecoBonus = XP_MULTI_ECOSYSTEM_2;
  if (ecoBonus > 0) {
    sources.push({
      id: "multi-ecosystem",
      label: `${ecosystems.size} ecosystem${ecosystems.size !== 1 ? "s" : ""} shipped`,
      xp: ecoBonus,
      icon: "globe",
    });
  }

  // ── GitHub stars ──
  const totalStars = stats?.totalStars || 0;
  const starXp = totalStars * XP_PER_STAR;
  if (starXp > 0) {
    sources.push({
      id: "stars",
      label: `${totalStars} GitHub star${totalStars !== 1 ? "s" : ""}`,
      xp: starXp,
      icon: "star",
    });
  }

  // ── Community followers ──
  const followerCount = user?.followerCount || 0;
  const followerXp = followerCount * XP_PER_FOLLOWER;
  if (followerXp > 0) {
    sources.push({
      id: "followers",
      label: `${followerCount} follower${followerCount !== 1 ? "s" : ""}`,
      xp: followerXp,
      icon: "users",
    });
  }

  // ── Ships log check-ins ──
  const checkinCount = (portfolio.recentActivity || []).filter(
    (a) => a.type === "check_in" || a.type === "ships_log_update"
  ).length;
  const checkinXp = checkinCount * XP_PER_CHECKIN;
  if (checkinXp > 0) {
    sources.push({
      id: "checkins",
      label: `${checkinCount} ship check-in${checkinCount !== 1 ? "s" : ""}`,
      xp: checkinXp,
      icon: "anchor",
    });
  }

  const totalXp = sources.reduce((sum, s) => sum + s.xp, 0);
  const level = levelFromXp(totalXp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpIntoLevel = totalXp - currentLevelXp;
  const xpForNextLevel = nextLevelXp - currentLevelXp;
  const progressPct = xpForNextLevel > 0 ? Math.round((xpIntoLevel / xpForNextLevel) * 100) : 100;

  const streak = computeBuilderStreak(portfolio);

  return {
    totalXp,
    level,
    levelTitle: getLevelTitle(level),
    xpIntoLevel,
    xpForNextLevel,
    progressPct,
    xpToNextLevel: nextLevelXp - totalXp,
    sources: sources.sort((a, b) => b.xp - a.xp),
    streak,
  };
}

/**
 * Compute shipping streak from project activity.
 *
 * A "streak" counts consecutive 30-day windows where the builder had
 * activity (project submission, ships log check-in, or milestone verification).
 * Derived from recentActivity timestamps + project createdAt dates.
 *
 * @returns {object} { current, longest, lastActiveDate }
 */
export function computeBuilderStreak(portfolio) {
  if (!portfolio) return { current: 0, longest: 0, lastActiveDate: null };

  const { projects, recentActivity } = portfolio;

  // Collect all activity dates (as day-strings YYYY-MM-DD)
  const activityDays = new Set();

  for (const project of projects || []) {
    const created = project.createdAt || project.submittedAt;
    if (created) {
      const date = typeof created === "object" && created.toDate ? created.toDate() : new Date(created);
      if (!isNaN(date.getTime())) activityDays.add(toDayString(date));
    }
  }

  for (const activity of recentActivity || []) {
    const ts = activity.timestamp;
    if (ts) {
      const date = typeof ts === "object" && ts.toDate ? ts.toDate() : new Date(ts);
      if (!isNaN(date.getTime())) activityDays.add(toDayString(date));
    }
  }

  if (activityDays.size === 0) {
    return { current: 0, longest: 0, lastActiveDate: null };
  }

  const sortedDays = Array.from(activityDays).sort();
  const lastActiveDate = sortedDays[sortedDays.length - 1];

  // Compute streak in 30-day windows
  // Current streak: count backwards from the most recent activity day,
  // checking if there's activity in each preceding 30-day window
  const now = new Date();
  const lastActive = new Date(lastActiveDate);
  const daysSinceLastActive = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));

  let current = 0;
  if (daysSinceLastActive <= 30) {
    current = 1;
    // Walk backwards in 30-day windows
    let windowEnd = new Date(lastActive);
    for (let i = 1; i < 365; i++) {
      const windowStart = new Date(windowEnd);
      windowStart.setDate(windowStart.getDate() - 30);
      const hasActivityInWindow = sortedDays.some((day) => {
        const d = new Date(day);
        return d >= windowStart && d < windowEnd;
      });
      if (hasActivityInWindow) {
        current++;
        windowEnd = windowStart;
      } else {
        break;
      }
    }
  }

  // Longest streak: scan all activity days
  let longest = 0;
  let tempStreak = 0;
  let prevWindowEnd = null;
  for (const day of sortedDays) {
    const dayDate = new Date(day);
    if (prevWindowEnd) {
      const diff = (prevWindowEnd - dayDate) / (1000 * 60 * 60 * 24);
      if (diff <= 30) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    longest = Math.max(longest, tempStreak);
    prevWindowEnd = dayDate;
  }

  return { current, longest: Math.max(longest, current), lastActiveDate };
}

/**
 * Level titles for flavor — gives builders a sense of identity.
 */
export function getLevelTitle(level) {
  if (level >= 20) return "Admiral";
  if (level >= 15) return "Commodore";
  if (level >= 10) return "Captain";
  if (level >= 7) return "Commander";
  if (level >= 5) return "Navigator";
  if (level >= 3) return "Pilot";
  return "Deckhand";
}

function toDayString(date) {
  return date.toISOString().split("T")[0];
}

function emptyXp() {
  return {
    totalXp: 0,
    level: 1,
    levelTitle: "Deckhand",
    xpIntoLevel: 0,
    xpForNextLevel: 100,
    progressPct: 0,
    xpToNextLevel: 100,
    sources: [],
    streak: { current: 0, longest: 0, lastActiveDate: null },
  };
}
