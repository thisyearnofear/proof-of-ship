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
import { BoltIcon } from "@heroicons/react/24/solid";

const TABS = [
  { id: "builders", label: "Top Builders", icon: RocketLaunchIcon },
  { id: "proof-builders", label: "Proof Builders", icon: TrophyIcon },
  { id: "projects", label: "Proven Projects", icon: FireIcon },
  { id: "backers", label: "Top Backers", icon: BanknotesIcon },
  { id: "hackathons", label: "Hackathons", icon: TrophyIcon },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState("builders");
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState({ builders: [], proofBuilders: [], projects: [], backers: [], hackathons: [] });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/torque/leaderboard");
        if (!res.ok) throw new Error("Failed to load leaderboard");
        const data = await res.json();
        if (!cancelled) {
          setEntries((prev) => ({
            ...prev,
            builders: (data.builders || []).map((b) => ({ ...b, source: b.source || "firestore" })),
            backers: (data.backers || []).map((b) => ({ ...b, source: b.source || "firestore" })),
          }));
        }
      } catch (err) {
        console.warn("Leaderboard fetch failed:", err);
        if (!cancelled) {
          setEntries({ builders: [], proofBuilders: [], projects: [], backers: [], hackathons: [] });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Fetch hackathon leaderboard separately
    async function loadHackathons() {
      try {
        const res = await fetch("/api/hackathons/leaderboard");
        if (!res.ok) throw new Error("Failed to load hackathon leaderboard");
        const data = await res.json();
        if (!cancelled) {
          setEntries((prev) => ({
            ...prev,
            hackathons: data.hackathons || [],
            proofBuilders: data.builders || [],
            projects: data.projects || [],
          }));
        }
      } catch (err) {
        console.warn("Hackathon leaderboard fetch failed:", err);
      }
    }
    load();
    loadHackathons();
    return () => { cancelled = true; };
  }, []);

  const currentList =
    tab === "builders" ? entries.builders :
    tab === "proof-builders" ? entries.proofBuilders :
    tab === "projects" ? entries.projects :
    tab === "backers" ? entries.backers :
    entries.hackathons;

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
              Discover the most credible builders, projects, and hackathons by proof strength, payout behavior, and shipping velocity.
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
          ) : tab === "hackathons" ? (
            <>
              <FastestPayoutHero entries={currentList} />
              <HackathonLeaderboardList entries={currentList} />
            </>
          ) : tab === "proof-builders" ? (
            <ProofBuildersList entries={currentList} />
          ) : tab === "projects" ? (
            <ProvenProjectsList entries={currentList} />
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
    2: "bg-gray-50 dark:bg-gray-800/30 border-secondary",
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
        {entry.source === "torque" && (
          <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
            Torque
          </span>
        )}
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
  const config = {
    builders: {
      label: "builders",
      message: "Be the first to submit a project and climb the leaderboard.",
      link: "/build",
      cta: "Submit a project",
    },
    "proof-builders": {
      label: "proof builders",
      message: "No proof-backed builders yet. Add hackathon evidence to your project and become discoverable.",
      link: "/build",
      cta: "Add proof to a project",
    },
    projects: {
      label: "proven projects",
      message: "No proven projects yet. Submit a project with evidence-backed hackathon claims to attract backers.",
      link: "/build",
      cta: "Submit a proven project",
    },
    backers: {
      label: "backers",
      message: "Be the first to back a project and earn your spot.",
      link: "/back",
      cta: "Back a project",
    },
    hackathons: {
      label: "hackathons",
      message: "No hackathon data yet. Submit a project with hackathon claims to start ranking.",
      link: "/build",
      cta: "Submit a project",
    },
  };

  const c = config[tab] || config.builders;

  return (
    <Card className="p-12 text-center">
      <TrophyIcon className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        No {c.label} yet
      </h3>
      <p className="text-text-secondary mb-6 max-w-md mx-auto">
        {c.message}
      </p>
      <Link href={c.link}>
        <Button>{c.cta}</Button>
      </Link>
    </Card>
  );
}

function truncateAddress(addr) {
  if (!addr) return "Unknown";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function ProofBuildersList({ entries }) {
  return (
    <div className="space-y-3">
      {entries.map((entry, idx) => (
        <div key={entry.id || idx} className="flex items-center gap-4 p-4 rounded-xl border bg-surface-primary border-border-primary hover:shadow-md transition-all">
          <div className="w-12 text-center text-lg font-bold">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary truncate">{entry.name || 'Builder'}</span>
              {entry.ecosystem ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-gray-600 dark:text-gray-400 uppercase">{entry.ecosystem}</span>
              ) : null}
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">
              {entry.proofBackedProjectCount || 0} proof-backed project{entry.proofBackedProjectCount === 1 ? '' : 's'} · {entry.verifiedWins || 0} verified win{entry.verifiedWins === 1 ? '' : 's'} · {entry.totalClaims || 0} claims
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-right text-sm min-w-[260px]">
            <div>
              <div className="font-bold text-text-primary">{entry.avgProofScore || 0}</div>
              <div className="text-xs text-text-tertiary">avg proof</div>
            </div>
            <div>
              <div className="font-bold text-emerald-600">{entry.evidenceCoverage || 0}%</div>
              <div className="text-xs text-text-tertiary">evidence</div>
            </div>
            <div>
              <div className="font-bold text-amber-600">{entry.score || 0}</div>
              <div className="text-xs text-text-tertiary">proof score</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProvenProjectsList({ entries }) {
  return (
    <div className="space-y-3">
      {entries.map((entry, idx) => (
        <div key={entry.slug || idx} className="flex items-center gap-4 p-4 rounded-xl border bg-surface-primary border-border-primary hover:shadow-md transition-all">
          <div className="w-12 text-center text-lg font-bold">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary truncate">{entry.name}</span>
              {entry.ecosystem ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-gray-600 dark:text-gray-400 uppercase">{entry.ecosystem}</span>
              ) : null}
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">
              {entry.verifiedWins || 0} verified win{entry.verifiedWins === 1 ? '' : 's'} · {entry.evidenceBackedClaims || 0}/{entry.totalClaims || 0} evidence-backed claims
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-right text-sm min-w-[260px]">
            <div>
              <div className="font-bold text-text-primary">{entry.avgProofScore || 0}</div>
              <div className="text-xs text-text-tertiary">avg proof</div>
            </div>
            <div>
              <div className="font-bold text-emerald-600">{entry.evidenceCoverage || 0}%</div>
              <div className="text-xs text-text-tertiary">evidence</div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <div>
                <div className="font-bold text-amber-600">{entry.score || 0}</div>
                <div className="text-xs text-text-tertiary">credibility</div>
              </div>
              {entry.slug ? (
                <Link href={`/projects/${entry.ecosystem}/${entry.slug}`} className="text-text-tertiary hover:text-text-secondary">
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FastestPayoutHero({ entries }) {
  // Find entries with actual payout speed data, sorted fastest first
  const withSpeedData = entries
    .filter((e) => e.avgPayoutDays !== null && e.avgPayoutDays >= 0)
    .sort((a, b) => a.avgPayoutDays - b.avgPayoutDays);

  if (withSpeedData.length === 0) return null;

  const fastest = withSpeedData[0];
  const runnerUp = withSpeedData[1] || null;

  return (
    <div className="mb-8 rounded-2xl border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/10 dark:to-orange-900/10 overflow-hidden">
      {/* Hero header */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-400 shadow-lg shadow-yellow-200/50">
            <BoltIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="inline-block text-xs font-bold tracking-wider text-yellow-700 dark:text-yellow-400 uppercase bg-yellow-200/60 dark:bg-yellow-800/40 px-2.5 py-0.5 rounded-full">
              Fastest Paying
            </span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {fastest.name}
            </h2>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 ml-[52px]">
          Pays winners in <span className="font-semibold text-emerald-700 dark:text-emerald-400">{fastest.avgPayoutDays} days</span> on average
          {fastest.payoutCompletionRate > 0 && ` with a ${fastest.payoutCompletionRate}% payout rate`}
        </p>
      </div>

      {/* Metric cards */}
      <div className="px-6 pb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-yellow-200/60 p-3.5 text-center">
          <div className="flex items-center justify-center gap-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {fastest.avgPayoutDays}
            <span className="text-sm font-normal text-gray-500">days</span>
          </div>
          <p className="text-xs text-secondary mt-1">Average payout time</p>
        </div>

        <div className="rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-yellow-200/60 p-3.5 text-center">
          <div className={`text-2xl font-bold ${fastest.payoutCompletionRate >= 80 ? 'text-green-700 dark:text-green-400' : fastest.payoutCompletionRate >= 50 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
            {fastest.payoutCompletionRate}%
          </div>
          <p className="text-xs text-secondary mt-1">Winners paid</p>
        </div>

        <div className="rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-yellow-200/60 p-3.5 text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {fastest.builderCount}
          </div>
          <p className="text-xs text-secondary mt-1">Active builders</p>
        </div>

        <div className="rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-yellow-200/60 p-3.5 text-center">
          <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
            {fastest.totalPrizeAmount > 0 ? `$${Math.round(fastest.totalPrizeAmount / 1000)}k` : '—'}
          </div>
          <p className="text-xs text-secondary mt-1">Total prizes</p>
        </div>
      </div>

      {/* Runner up if available */}
      {runnerUp && (
        <div className="border-t border-yellow-200/50 px-6 py-3 flex items-center justify-between bg-white/40 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <BoltIcon className="w-4 h-4 text-yellow-500" />
              {runnerUp.name}
            </span>
            <span className="text-xs text-secondary">
              · {runnerUp.builderCount} builder{runnerUp.builderCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{runnerUp.avgPayoutDays}d avg</span>
            <span className={`font-semibold ${runnerUp.payoutCompletionRate >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
              {runnerUp.payoutCompletionRate}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function HackathonLeaderboardList({ entries }) {
  return (
    <div className="space-y-3">
      {entries.map((entry, idx) => (
        <HackathonLeaderboardRow key={entry.name} entry={entry} rank={idx + 1} />
      ))}
    </div>
  );
}

function HackathonLeaderboardRow({ entry, rank }) {
  const rankStyles = {
    1: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700",
    2: "bg-gray-50 dark:bg-gray-800/30 border-secondary",
    3: "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700",
  };

  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

  // Payout speed color coding (lower days = faster = greener)
  const payoutSpeedColor = entry.avgPayoutDays !== null
    ? entry.avgPayoutDays <= 7
      ? 'text-emerald-600'
      : entry.avgPayoutDays <= 30
        ? 'text-green-600'
        : entry.avgPayoutDays <= 90
          ? 'text-amber-600'
          : 'text-red-600'
    : 'text-text-tertiary';

  const payoutSpeedLabel = entry.avgPayoutDays !== null
    ? entry.avgPayoutDays <= 7
      ? 'lightning fast'
      : entry.avgPayoutDays <= 30
        ? 'fast'
        : entry.avgPayoutDays <= 90
          ? 'moderate'
          : 'slow'
    : null;

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
            {entry.name}
          </span>
          {entry.ecosystem && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-gray-600 dark:text-gray-400 uppercase">
              {entry.ecosystem}
            </span>
          )}
        </div>
        <p className="text-xs text-text-tertiary mt-0.5">
          {entry.totalProjects} project{entry.totalProjects !== 1 ? 's' : ''} · {entry.winners || 0} winner{(entry.winners || 0) !== 1 ? 's' : ''} · {entry.builderCount || 0} builder{(entry.builderCount || 0) !== 1 ? 's' : ''}
          {entry.totalPrizeAmount > 0 && ` · $${(entry.totalPrizeAmount / 1000).toFixed(0)}k prizes`}
        </p>
      </div>

      {/* Payout metrics */}
      <div className="flex items-center gap-6">
        {entry.avgPayoutDays !== null ? (
          <div className="text-right">
            <div className={`text-lg font-bold ${payoutSpeedColor}`}>
              {entry.avgPayoutDays}
              <span className="text-sm ml-0.5">d</span>
            </div>
            <p className={`text-xs ${payoutSpeedColor}`}>{payoutSpeedLabel}</p>
          </div>
        ) : (
          <div className="text-right">
            <div className="text-lg font-bold text-text-tertiary">—</div>
            <p className="text-xs text-text-tertiary">payout speed</p>
          </div>
        )}

        <div className="text-right">
          <div className={`text-lg font-bold ${entry.payoutCompletionRate >= 80 ? 'text-green-600' : entry.payoutCompletionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {entry.payoutCompletionRate}%
          </div>
          <p className="text-xs text-text-tertiary">paid</p>
        </div>
      </div>

      {/* Score */}
      <div className="text-right min-w-[80px]">
        <div className="text-lg font-bold text-text-primary flex items-center gap-1 justify-end">
          <TrophyIcon className="w-4 h-4 text-yellow-500" />
          {entry.score}
        </div>
        <p className="text-xs text-text-tertiary">reputation</p>
      </div>

      {/* Share button — only for ranked hackathons with payout data */}
      {entry.avgPayoutDays !== null && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const text = `🏆 ${entry.name} pays winners in ${entry.avgPayoutDays}d avg with ${entry.payoutCompletionRate}% payout rate — ranked #${rank} on @proofofship`;
            const url = typeof window !== 'undefined' ? 'https://proofofship.app/leaderboard' : '';
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
          }}
          className="p-2 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-blue-500 transition-colors"
          title="Share on X"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>
      )}
    </div>
  );
}
