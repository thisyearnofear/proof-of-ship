/**
 * Leaderboard Page — Torque-powered rankings
 *
 * Shows top builders (by project submissions and milestones)
 * and top backers (by staking volume and unique projects backed).
 * Data comes from the Firestore activities collection, with Torque
 * events enriching the dataset once configured.
 */

import React, { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  TrophyIcon,
  RocketLaunchIcon,
  BanknotesIcon,
  FireIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

const TABS = [
  { id: "builders", label: "Top Builders", icon: RocketLaunchIcon },
  { id: "backers", label: "Top Backers", icon: BanknotesIcon },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState("builders");
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState({ builders: [], backers: [] });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/torque/leaderboard");
        if (!res.ok) throw new Error("Failed to load leaderboard");
        const data = await res.json();
        if (!cancelled) {
          setEntries({
            builders: data.builders || [],
            backers: data.backers || [],
          });
        }
      } catch (err) {
        console.warn("Leaderboard fetch failed:", err);
        if (!cancelled) {
          setEntries({ builders: [], backers: [] });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const currentList = tab === "builders" ? entries.builders : entries.backers;

  return (
    <ErrorBoundary name="LeaderboardPage" errorMessage="Failed to load leaderboard.">
      <Head>
        <title>Leaderboard | Proof of Ship</title>
        <meta name="description" content="Top builders and backers in the Proof of Ship ecosystem." />
      </Head>
      <div className="min-h-screen bg-surface-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <TrophyIcon className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-text-primary">Leaderboard</h1>
            </div>
            <p className="text-text-secondary">
              Top contributors in the Proof of Ship ecosystem, ranked by shipping velocity.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 mb-6">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.id
                      ? "bg-indigo-600 text-white"
                      : "bg-surface-primary text-text-secondary hover:bg-surface-tertiary border border-border-primary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : currentList.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <LeaderboardList entries={currentList} type={tab} />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

function LeaderboardList({ entries, type }) {
  return (
    <div className="space-y-3">
      {entries.map((entry, idx) => (
        <LeaderboardRow key={entry.address || idx} entry={entry} rank={idx + 1} type={type} />
      ))}
    </div>
  );
}

function LeaderboardRow({ entry, rank, type }) {
  const rankStyles = {
    1: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700",
    2: "bg-gray-50 dark:bg-gray-800/30 border-gray-300 dark:border-gray-600",
    3: "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700",
  };

  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
        rankStyles[rank] || "bg-surface-primary border-border-primary"
      }`}
    >
      {/* Rank */}
      <div className="w-12 text-center text-lg font-bold">{medal}</div>

      {/* Identity */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-primary truncate">
            {entry.name || truncateAddress(entry.address)}
          </span>
          {entry.snsDomain && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              {entry.snsDomain}
            </span>
          )}
        </div>
        <p className="text-xs text-text-tertiary mt-0.5">
          {type === "builders"
            ? `${entry.projectCount || 0} projects · ${entry.milestoneCount || 0} milestones`
            : `$${Number(entry.totalBacked || 0).toLocaleString()} staked · ${entry.projectsBacked || 0} projects`}
        </p>
      </div>

      {/* Score */}
      <div className="text-right">
        <div className="text-lg font-bold text-text-primary flex items-center gap-1 justify-end">
          <FireIcon className="w-4 h-4 text-orange-500" />
          {entry.velocity || entry.score || 0}
        </div>
        <p className="text-xs text-text-tertiary">
          {type === "builders" ? "shipping velocity" : "backing score"}
        </p>
      </div>

      {/* Address link */}
      {entry.address && (
        <a
          href={`https://explorer.solana.com/address/${entry.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-tertiary hover:text-text-secondary"
          title="View on Solana Explorer"
        >
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

function EmptyState({ tab }) {
  return (
    <Card className="p-12 text-center">
      <TrophyIcon className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        No {tab === "builders" ? "builders" : "backers"} yet
      </h3>
      <p className="text-text-secondary mb-6 max-w-md mx-auto">
        {tab === "builders"
          ? "Be the first to submit a project and climb the leaderboard."
          : "Be the first to back a project and earn your spot."}
      </p>
      <Link href={tab === "builders" ? "/build" : "/back"}>
        <Button>{tab === "builders" ? "Submit a project" : "Back a project"}</Button>
      </Link>
    </Card>
  );
}

function truncateAddress(addr) {
  if (!addr) return "Unknown";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}
