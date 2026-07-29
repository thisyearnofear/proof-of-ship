import { describe, it, expect } from "vitest";
import {
  computeBuilderXp,
  computeBuilderStreak,
  xpForLevel,
  levelFromXp,
  getLevelTitle,
} from "./builderXp";

describe("builderXp", () => {
  describe("xpForLevel / levelFromXp", () => {
    it("returns 0 XP for level 1", () => {
      expect(xpForLevel(1)).toBe(0);
    });

    it("uses quadratic scaling: level 2 = 100, level 3 = 400", () => {
      expect(xpForLevel(2)).toBe(100);
      expect(xpForLevel(3)).toBe(400);
      expect(xpForLevel(5)).toBe(1600);
    });

    it("levelFromXp is the inverse of xpForLevel", () => {
      expect(levelFromXp(0)).toBe(1);
      expect(levelFromXp(100)).toBe(2);
      expect(levelFromXp(399)).toBe(2);
      expect(levelFromXp(400)).toBe(3);
      expect(levelFromXp(1600)).toBe(5);
    });

    it("handles negative XP gracefully", () => {
      expect(levelFromXp(-100)).toBe(1);
    });
  });

  describe("getLevelTitle", () => {
    it("returns Deckhand for low levels", () => {
      expect(getLevelTitle(1)).toBe("Deckhand");
      expect(getLevelTitle(2)).toBe("Deckhand");
    });

    it("returns Captain at level 10", () => {
      expect(getLevelTitle(10)).toBe("Captain");
    });

    it("returns Admiral at level 20+", () => {
      expect(getLevelTitle(20)).toBe("Admiral");
      expect(getLevelTitle(50)).toBe("Admiral");
    });
  });

  describe("computeBuilderXp", () => {
    it("returns empty XP for null portfolio", () => {
      const result = computeBuilderXp(null);
      expect(result.totalXp).toBe(0);
      expect(result.level).toBe(1);
      expect(result.sources).toEqual([]);
    });

    it("returns empty XP for portfolio without projects", () => {
      const result = computeBuilderXp({ user: {}, projects: null });
      expect(result.totalXp).toBe(0);
    });

    it("awards 50 XP per published project", () => {
      const portfolio = {
        user: {},
        projects: [{ ecosystem: "base" }, { ecosystem: "base" }],
        stats: {},
      };
      const result = computeBuilderXp(portfolio);
      expect(result.totalXp).toBe(100); // 2 * 50
      expect(result.sources.find((s) => s.id === "projects").xp).toBe(100);
    });

    it("awards 200 XP per verified hackathon win", () => {
      const portfolio = {
        user: {},
        projects: [{
          ecosystem: "base",
          hackathons: [
            { outcome: "winner", payoutVerifiedAt: "2026-01-01" },
            { outcome: "finalist" }, // not a win
            { outcome: "bounty winner", payoutTxHash: "0x123" },
          ],
        }],
        stats: {},
      };
      const result = computeBuilderXp(portfolio);
      const winSource = result.sources.find((s) => s.id === "verified-wins");
      expect(winSource.xp).toBe(400); // 2 * 200
    });

    it("awards 75 XP per evidence-backed claim", () => {
      const portfolio = {
        user: {},
        projects: [{
          ecosystem: "base",
          hackathons: [
            { announcementUrl: "https://example.com" },
            { payoutTxHash: "0x123" },
            { outcome: "submitted" }, // no evidence
          ],
        }],
        stats: {},
      };
      const result = computeBuilderXp(portfolio);
      const evidenceSource = result.sources.find((s) => s.id === "evidence");
      expect(evidenceSource.xp).toBe(150); // 2 * 75
    });

    it("awards multi-ecosystem bonus for 2+ ecosystems", () => {
      const portfolio = {
        user: {},
        projects: [
          { ecosystem: "base" },
          { ecosystem: "celo" },
        ],
        stats: {},
      };
      const result = computeBuilderXp(portfolio);
      const ecoSource = result.sources.find((s) => s.id === "multi-ecosystem");
      expect(ecoSource.xp).toBe(100); // 2 ecosystems
    });

    it("awards larger multi-ecosystem bonus for 4+ ecosystems", () => {
      const portfolio = {
        user: {},
        projects: [
          { ecosystem: "base" },
          { ecosystem: "celo" },
          { ecosystem: "arbitrum" },
          { ecosystem: "optimism" },
        ],
        stats: {},
      };
      const result = computeBuilderXp(portfolio);
      const ecoSource = result.sources.find((s) => s.id === "multi-ecosystem");
      expect(ecoSource.xp).toBe(250); // 4+ ecosystems
    });

    it("awards XP for GitHub stars", () => {
      const portfolio = {
        user: {},
        projects: [{ ecosystem: "base" }],
        stats: { totalStars: 50 },
      };
      const result = computeBuilderXp(portfolio);
      const starSource = result.sources.find((s) => s.id === "stars");
      expect(starSource.xp).toBe(100); // 50 * 2
    });

    it("awards XP for followers", () => {
      const portfolio = {
        user: { followerCount: 5 },
        projects: [{ ecosystem: "base" }],
        stats: {},
      };
      const result = computeBuilderXp(portfolio);
      const followerSource = result.sources.find((s) => s.id === "followers");
      expect(followerSource.xp).toBe(50); // 5 * 10
    });

    it("computes level and progress correctly", () => {
      const portfolio = {
        user: {},
        projects: Array.from({ length: 4 }, () => ({ ecosystem: "base" })),
        stats: {},
      };
      const result = computeBuilderXp(portfolio);
      // 4 projects = 200 XP → level 2 (100 XP), 100 XP into level 2
      expect(result.totalXp).toBe(200);
      expect(result.level).toBe(2);
      expect(result.xpIntoLevel).toBe(100);
      expect(result.progressPct).toBeGreaterThan(0);
    });

    it("sorts sources by XP descending", () => {
      const portfolio = {
        user: { followerCount: 20 },
        projects: [
          { ecosystem: "base", hackathons: [{ outcome: "winner", payoutVerifiedAt: "2026-01-01" }] },
          { ecosystem: "celo" },
        ],
        stats: { totalStars: 10 },
      };
      const result = computeBuilderXp(portfolio);
      for (let i = 1; i < result.sources.length; i++) {
        expect(result.sources[i - 1].xp).toBeGreaterThanOrEqual(result.sources[i].xp);
      }
    });
  });

  describe("computeBuilderStreak", () => {
    it("returns zero streak for null portfolio", () => {
      const result = computeBuilderStreak(null);
      expect(result.current).toBe(0);
      expect(result.longest).toBe(0);
    });

    it("returns zero streak for no activity", () => {
      const result = computeBuilderStreak({ projects: [], recentActivity: [] });
      expect(result.current).toBe(0);
    });

    it("detects current streak from recent activity", () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const portfolio = {
        projects: [],
        recentActivity: [{ type: "check_in", timestamp: recentDate.toISOString() }],
      };
      const result = computeBuilderStreak(portfolio);
      expect(result.current).toBeGreaterThanOrEqual(1);
    });

    it("detects project creation as activity", () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const portfolio = {
        projects: [{ createdAt: recentDate.toISOString() }],
        recentActivity: [],
      };
      const result = computeBuilderStreak(portfolio);
      expect(result.current).toBeGreaterThanOrEqual(1);
      expect(result.lastActiveDate).toBeTruthy();
    });
  });
});
