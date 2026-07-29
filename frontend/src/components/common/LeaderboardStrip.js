/**
 * LeaderboardStrip — Homepage metrics strip
 *
 * Shows dynamic leaderboard highlights below the hero: top proof builder,
 * fastest paying hackathon, most proven project, and aggregate trust stats.
 * Falls back gracefully when API data is unavailable.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrophyIcon,
  BoltIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

function StatCard({ icon, label, value, sublabel, href, accentColor = "bg-blue-500" }) {
  const content = (
    <div className="group relative rounded-xl border border-default bg-surface/80 backdrop-blur-sm p-4 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 cursor-pointer min-h-[100px] flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${accentColor} text-white shadow-sm`}>
          {icon}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
          {label}
        </span>
      </div>
      <div>
        <div className="text-lg sm:text-xl font-bold text-primary truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {value || "—"}
        </div>
        {sublabel && (
          <p className="text-xs text-tertiary mt-0.5 truncate">{sublabel}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}

export default function LeaderboardStrip() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [lbRes, statsRes] = await Promise.allSettled([
          fetch("/api/hackathons/leaderboard"),
          fetch("/api/platform/stats"),
        ]);

        if (cancelled) return;

        const lbData = lbRes.status === "fulfilled" && lbRes.value.ok
          ? await lbRes.value.json()
          : null;

        const statsData = statsRes.status === "fulfilled" && statsRes.value.ok
          ? await statsRes.value.json()
          : null;

        setData({ lbData, statsData });
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Derive values
  const topBuilder = data?.lbData?.builders?.[0];
  const fastestHackathon = data?.lbData?.hackathons
    ?.filter((h) => h.avgPayoutDays !== null && h.avgPayoutDays >= 0)
    ?.sort((a, b) => a.avgPayoutDays - b.avgPayoutDays)?.[0];
  // Only highlight a project when it has meaningful proof (evidence > 0 or verified wins).
  // Showing "0% evidence coverage" for the top project damages credibility.
  const topProject = data?.lbData?.projects?.find(
    (p) => (p.evidenceCoverage || 0) > 0 || (p.verifiedWins || 0) > 0,
  );
  const stats = data?.statsData;

  const verifiedWins = stats?.totalVerifiedWins || topBuilder?.verifiedWins || 0;
  const totalPayoutsConfirmed = stats?.totalPayoutsConfirmed || fastestHackathon?.totalPrizeAmount || 0;

  return (
    <div className="w-full animate-fade-in-up">
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-default bg-surface/50 p-4 animate-pulse">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
              <div className="h-3 w-24 bg-gray-100 dark:bg-gray-600 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Top Proof Builder */}
          <StatCard
            icon={<TrophyIcon className="w-4 h-4" />}
            label="Top Proof Builder"
            value={topBuilder?.name || "Be the first"}
            sublabel={topBuilder ? `${topBuilder.score || 0} proof score` : "Submit a project to rank"}
            href="/leaderboard"
            accentColor="bg-amber-500"
          />

          {/* Fastest Paying Hackathon */}
          <StatCard
            icon={<BoltIcon className="w-4 h-4" />}
            label="Fastest Payout"
            value={fastestHackathon?.name || "Track payouts"}
            sublabel={fastestHackathon ? `${fastestHackathon.avgPayoutDays}d avg · ${fastestHackathon.payoutCompletionRate}% paid` : "See hackathon rankings"}
            href="/leaderboard"
            accentColor="bg-emerald-500"
          />

          {/* Most Proven Project */}
          <StatCard
            icon={<ShieldCheckIcon className="w-4 h-4" />}
            label="Most Proven Project"
            value={topProject?.name || "No projects yet"}
            sublabel={
              topProject
                ? `${topProject.avgProofScore || 0} proof score${topProject.verifiedWins > 0 ? ` · ${topProject.verifiedWins} win${topProject.verifiedWins > 1 ? "s" : ""}` : ""}`
                : "Add proof to your project"
            }
            href="/leaderboard"
            accentColor="bg-blue-500"
          />

          {/* Aggregate trust stat */}
          <StatCard
            icon={<SparklesIcon className="w-4 h-4" />}
            label="Network Stats"
            value={
              stats?.totalVerifiedWins > 0
                ? `${stats.totalVerifiedWins} verified wins`
                : topBuilder?.verifiedWins > 0
                  ? `${topBuilder.verifiedWins}+ verified wins`
                  : "Proof Network"
            }
            sublabel={
              stats?.totalPayoutsConfirmed > 0
                ? `$${(stats.totalPayoutsConfirmed / 1000).toFixed(0)}k+ payouts confirmed`
                : fastestHackathon?.totalPrizeAmount > 0
                  ? `$${(fastestHackathon.totalPrizeAmount / 1000).toFixed(0)}k in prizes tracked`
                  : "Growing daily"
            }
            href="/leaderboard"
            accentColor="bg-purple-500"
          />
        </div>
      )}

      {/* "See full leaderboard" link */}
      <div className="text-center mt-3">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group"
        >
          <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
          <span>Explore all leaderboards</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
}
