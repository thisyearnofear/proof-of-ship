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
import { useRouter } from "next/router";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { trackEvent } from "@/lib/analytics";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProofBadgeGroup } from "@/components/common/ProofBadge";
import { computeLeaderboardBadges } from "@/lib/badges/computeBadges";
import {
  TrophyIcon,
  RocketLaunchIcon,
  BanknotesIcon,
  FireIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";

const TABS = [
  { id: "proof-builders", label: "Proof Builders", icon: TrophyIcon },
  { id: "projects", label: "Proven Projects", icon: FireIcon },
  { id: "hackathons", label: "Hackathons", icon: BoltIcon },
  { id: "builders", label: "Top Builders", icon: RocketLaunchIcon },
  { id: "backers", label: "Top Backers", icon: BanknotesIcon },
];

const TAB_EXPLAINERS = {
  "proof-builders": "Builders ranked by verified wins, evidence coverage, and proof-backed project claims — the most credible in the ecosystem.",
  "projects": "Projects ranked by onchain evidence, verified hackathon claims, and overall credibility score.",
  "hackathons": "Hackathons ranked by payout speed, winner payment rates, and builder satisfaction.",
  "builders": "Top builders by shipping velocity, project submissions, and milestone completions.",
  "backers": "Top backers by staking volume, projects backed, and portfolio performance.",
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState("proof-builders");
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

  // Resolve highlighted entry from ?ref= query param
  const highlightedEntry = useMemo(() => {
    const ref = router.query.ref;
    if (!ref || typeof ref !== "string") return null;
    // Format: "type-rank" e.g. "proof-builder-3" or "hackathon-1"
    const parts = ref.split("-");
    const rankStr = parts[parts.length - 1];
    const rank = parseInt(rankStr, 10);
    // Determine which list to search based on the ref type
    let searchList = [];
    let ogType = null;
    if (ref.startsWith("proof-builder")) {
      searchList = entries.proofBuilders;
      ogType = "proof-builder";
    } else if (ref.startsWith("project")) {
      searchList = entries.projects;
      ogType = "project";
    } else if (ref.startsWith("hackathon")) {
      searchList = entries.hackathons;
      ogType = "hackathon";
    } else if (ref.startsWith("builder")) {
      searchList = entries.builders;
      ogType = "builder";
    } else if (ref.startsWith("backer")) {
      searchList = entries.backers;
      ogType = "backer";
    }
    if (!ogType || searchList.length === 0) return null;
    const entry = searchList[rank - 1];
    if (!entry) return null;
    return { entry, rank, ogType };
  }, [router.query.ref, entries]);

  // Build OG image URL for the highlighted entry
  const ogImageUrl = useMemo(() => {
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
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://proofofship.app';
    return `${origin}/api/og/leaderboard?${params.toString()}`;
  }, [highlightedEntry]);

  // Build share title for the highlighted entry
  const ogTitle = useMemo(() => {
    if (!highlightedEntry) return "Leaderboard | Proof of Ship";
    const { entry, rank, ogType } = highlightedEntry;
    const labels = {
      "proof-builder": "Proof Builder",
      project: "Proven Project",
      hackathon: "Hackathon",
      builder: "Top Builder",
      backer: "Top Backer",
    };
    const label = labels[ogType] || ogType;
    const name = entry.name || entry.address || "Builder";
    return `#${rank} ${label}: ${name} | Proof of Ship`;
  }, [highlightedEntry]);

  // Build description for the highlighted entry
  const ogDescription = useMemo(() => {
    if (!highlightedEntry) return "Top builders and backers ranked by proof strength, payout behavior, and shipping velocity.";
    const { entry, rank, ogType } = highlightedEntry;
    const name = entry.name || entry.address || "Builder";
    const scoreStr = entry.score ? `Score: ${entry.score}` : "";
    const evidenceStr = entry.evidenceCoverage ? ` · ${entry.evidenceCoverage}% evidence coverage` : "";
    const movementStr = entry.movement === "up" ? " · Moving up!" : entry.movement === "new" ? " · New entry!" : "";
    return `#${rank} ${name}${scoreStr}${evidenceStr}${movementStr} — Proof of Ship leaderboard`;
  }, [highlightedEntry]);

  const currentList =
    tab === "builders" ? entries.builders :
    tab === "proof-builders" ? entries.proofBuilders :
    tab === "projects" ? entries.projects :
    tab === "backers" ? entries.backers :
    entries.hackathons;

  return (
    <ErrorBoundary name="LeaderboardPage" errorMessage="Failed to load leaderboard.">
      <Head>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Proof of Ship" />
        <meta property="og:url" content={`https://proofofship.app${router.asPath}`} />
        {ogImageUrl && (
          <meta property="og:image" content={ogImageUrl} />
        )}
        {ogImageUrl && (
          <meta property="og:image:width" content="1200" />
        )}
        {ogImageUrl && (
          <meta property="og:image:height" content="630" />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        {ogImageUrl && (
          <meta name="twitter:image" content={ogImageUrl} />
        )}
        {ogTitle && (
          <meta name="twitter:title" content={ogTitle} />
        )}
        {ogDescription && (
          <meta name="twitter:description" content={ogDescription} />
        )}
      </Head>
      <div className="min-h-screen bg-surface-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <TrophyIcon className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />
              <h1 className="text-3xl font-bold text-text-primary">Leaderboard</h1>
            </div>
            <p className="text-text-secondary">
              Discover the most credible builders, projects, and hackathons by proof strength, payout behavior, and shipping velocity.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex flex-wrap gap-2 mb-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-surface-primary text-text-secondary hover:bg-surface-tertiary border border-border-primary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab explainer */}
          <p className="text-sm text-text-tertiary mb-6 ml-1">
            {TAB_EXPLAINERS[tab]}
          </p>

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

function MovementIndicator({ entry }) {
  // Show a directional arrow if movement data exists; otherwise show a subtle "stable" dot
  if (entry.movement === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400" title="Moved up">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </span>
    );
  }
  if (entry.movement === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-500 dark:text-red-400" title="Moved down">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    );
  }
  if (entry.movement === "new") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
        New
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] text-tertiary">
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
        <circle cx="12" cy="12" r="4" />
      </svg>
    </span>
  );
}

function ShareButton({ text, url, entryType, entry, rank }) {
  const baseUrl = (typeof window !== 'undefined' ? window.location.origin : 'https://proofofship.app');
  const ogRef = entryType && entry && rank ? `${entryType}-${rank}` : null;
  const shareUrl = url || (ogRef ? `${baseUrl}/leaderboard?ref=${ogRef}` : `${baseUrl}/leaderboard`);

  const handleShare = (platform) => {
    trackEvent("leaderboard_share_clicked", {
      platform,
      entry_type: entryType,
      rank,
      entry_name: entry?.name || entry?.title || null,
    });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleShare("x");
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
        }}
        className="p-1.5 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-blue-500 dark:text-blue-400 transition-colors"
        title="Share on X"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleShare("farcaster");
          const fcText = text.replace(/@proofofship/g, '').trim();
          window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(fcText)}%20${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
        }}
        className="p-1.5 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-purple-500 dark:text-purple-400 transition-colors"
        title="Share on Farcaster"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.336 2.1h11.328l-.84 10.257L12 14.1l-4.824-1.743L6.336 2.1zM4.2 5.556l.672 8.166H8.4l.42 4.176h3.18l.42-4.176h3.528l.672-8.166H4.2z" />
        </svg>
      </button>
    </div>
  );
}

function generateShareText(entry, rank, type) {
  if (type === "builders") {
    return `#${rank} ${entry.name || truncateAddress(entry.address)} — ${entry.velocity || entry.score || 0} shipping velocity on @proofofship`;
  }
  if (type === "backers") {
    return `#${rank} ${entry.name || truncateAddress(entry.address)} — ${entry.velocity || entry.score || 0} backing score on @proofofship`;
  }
  return `#${rank} ${entry.name || truncateAddress(entry.address)} on @proofofship`;
}

function LeaderboardRow({ entry, rank, type }) {
  const entryBadges = useMemo(() => computeLeaderboardBadges(entry, type === "builders" ? "builder" : "backer"), [entry, type]);
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
      {/* Rank + Movement */}
      <div className="w-14 text-center flex-shrink-0">
        <div className="text-lg font-bold">{medal}</div>
        <div className="-mt-1 flex justify-center">
          <MovementIndicator entry={entry} />
        </div>
      </div>

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
        {/* Badges */}
        {entryBadges.length > 0 && (
          <ProofBadgeGroup badges={entryBadges} size="sm" max={2} className="mt-1" />
        )}
      </div>

      {/* Score */}
      <div className="text-right">
        <div className="text-lg font-bold text-text-primary flex items-center gap-1 justify-end">
          <FireIcon className="w-4 h-4 text-orange-500 dark:text-orange-400" />
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

      {/* Share button */}
      <ShareButton
        text={generateShareText(entry, rank, type)}
        entryType={type === "builders" ? "builder" : "backer"}
        entry={entry}
        rank={rank}
      />

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
      {entries.map((entry, idx) => {
        const entryBadges = computeLeaderboardBadges(entry, "proof-builder");
        return (
          <div key={entry.id || idx} className="flex items-center gap-4 p-4 rounded-xl border bg-surface-primary border-border-primary hover:shadow-md transition-all">
            <div className="w-14 text-center flex-shrink-0">
              <div className="text-lg font-bold">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</div>
              <div className="-mt-1 flex justify-center">
                <MovementIndicator entry={entry} />
              </div>
            </div>
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
              {entryBadges.length > 0 && (
                <ProofBadgeGroup badges={entryBadges} size="sm" max={2} className="mt-1" />
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 text-right text-sm min-w-[260px]">
              <div>
                <div className="font-bold text-text-primary">{entry.avgProofScore || 0}</div>
                <div className="text-xs text-text-tertiary">avg proof</div>
              </div>
              <div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">{entry.evidenceCoverage || 0}%</div>
                <div className="text-xs text-text-tertiary">evidence</div>
              </div>
              <div>
                <div className="font-bold text-amber-600 dark:text-amber-400">{entry.score || 0}</div>
                <div className="text-xs text-text-tertiary">proof score</div>
              </div>
            </div>
            <ShareButton
              text={`#${idx + 1} Proof Builder: ${entry.name || 'Builder'} — ${entry.score || 0} proof score · ${entry.evidenceCoverage || 0}% evidence coverage on @proofofship`}
              entryType="proof-builder"
              entry={entry}
              rank={idx + 1}
            />
          </div>
        );
      })}
    </div>
  );
}

function ProvenProjectsList({ entries }) {
  return (
    <div className="space-y-3">
      {entries.map((entry, idx) => {
        const entryBadges = computeLeaderboardBadges(entry, "project");
        return (
          <div key={entry.slug || idx} className="flex items-center gap-4 p-4 rounded-xl border bg-surface-primary border-border-primary hover:shadow-md transition-all">
            <div className="w-14 text-center flex-shrink-0">
              <div className="text-lg font-bold">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</div>
              <div className="-mt-1 flex justify-center">
                <MovementIndicator entry={entry} />
              </div>
            </div>
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
              {entryBadges.length > 0 && (
                <ProofBadgeGroup badges={entryBadges} size="sm" max={2} className="mt-1" />
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 text-right text-sm min-w-[260px]">
              <div>
                <div className="font-bold text-text-primary">{entry.avgProofScore || 0}</div>
                <div className="text-xs text-text-tertiary">avg proof</div>
              </div>
              <div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">{entry.evidenceCoverage || 0}%</div>
                <div className="text-xs text-text-tertiary">evidence</div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <div>
                  <div className="font-bold text-amber-600 dark:text-amber-400">{entry.score || 0}</div>
                  <div className="text-xs text-text-tertiary">credibility</div>
                </div>
                {entry.slug ? (
                  <Link href={`/projects/${entry.ecosystem}/${entry.slug}`} className="text-text-tertiary hover:text-text-secondary">
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </Link>
                ) : null}
              </div>
            </div>
            <ShareButton
              text={`#${idx + 1} Proven Project: ${entry.name} — ${entry.score || 0} credibility · ${entry.evidenceCoverage || 0}% evidence coverage on @proofofship`}
              entryType="project"
              entry={entry}
              rank={idx + 1}
            />
          </div>
        );
      })}
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mt-0.5">
              {fastest.name}
            </h2>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 ml-[52px]">
          Pays winners in <span className="font-semibold text-emerald-700 dark:text-emerald-300 dark:text-emerald-400">{fastest.avgPayoutDays} days</span> on average
          {fastest.payoutCompletionRate > 0 && ` with a ${fastest.payoutCompletionRate}% payout rate`}
        </p>
      </div>

      {/* Metric cards */}
      <div className="px-6 pb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-yellow-200/60 p-3.5 text-center">
          <div className="flex items-center justify-center gap-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300 dark:text-emerald-400">
            {fastest.avgPayoutDays}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">days</span>
          </div>
          <p className="text-xs text-secondary mt-1">Average payout time</p>
        </div>

        <div className="rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-yellow-200/60 p-3.5 text-center">
          <div className={`text-2xl font-bold ${fastest.payoutCompletionRate >= 80 ? 'text-green-700 dark:text-green-300 dark:text-green-400' : fastest.payoutCompletionRate >= 50 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-300 dark:text-red-400'}`}>
            {fastest.payoutCompletionRate}%
          </div>
          <p className="text-xs text-secondary mt-1">Winners paid</p>
        </div>

        <div className="rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-yellow-200/60 p-3.5 text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 dark:text-white">
            {fastest.builderCount || 0}
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
              <BoltIcon className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
              {runnerUp.name}
            </span>
            <span className="text-xs text-secondary">
              · {runnerUp.builderCount} builder{runnerUp.builderCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{runnerUp.avgPayoutDays}d avg</span>
            <span className={`font-semibold ${runnerUp.payoutCompletionRate >= 80 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
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
        <HackathonLeaderboardRow key={`${entry.name}-${idx}`} entry={entry} rank={idx + 1} />
      ))}
    </div>
  );
}

function HackathonLeaderboardRow({ entry, rank }) {
  const entryBadges = useMemo(() => computeLeaderboardBadges(entry, "hackathon"), [entry]);
  const rankStyles = {
    1: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700",
    2: "bg-gray-50 dark:bg-gray-800/30 border-secondary",
    3: "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700",
  };

  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

  // Payout speed color coding (lower days = faster = greener)
  const payoutSpeedColor = entry.avgPayoutDays !== null
    ? entry.avgPayoutDays <= 7
      ? 'text-emerald-600 dark:text-emerald-400'
      : entry.avgPayoutDays <= 30
        ? 'text-green-600 dark:text-green-400'
        : entry.avgPayoutDays <= 90
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-red-600 dark:text-red-400'
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
      {/* Rank + Movement */}
      <div className="w-14 text-center flex-shrink-0">
        <div className="text-lg font-bold">{medal}</div>
        <div className="-mt-1 flex justify-center">
          <MovementIndicator entry={entry} />
        </div>
      </div>

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
        {entryBadges.length > 0 && (
          <ProofBadgeGroup badges={entryBadges} size="sm" max={2} className="mt-1" />
        )}
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
          <div className={`text-lg font-bold ${entry.payoutCompletionRate >= 80 ? 'text-green-600 dark:text-green-400' : entry.payoutCompletionRate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
            {entry.payoutCompletionRate}%
          </div>
          <p className="text-xs text-text-tertiary">paid</p>
        </div>
      </div>

      {/* Score */}
      <div className="text-right min-w-[80px]">
        <div className="text-lg font-bold text-text-primary flex items-center gap-1 justify-end">
          <TrophyIcon className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
          {entry.score}
        </div>
        <p className="text-xs text-text-tertiary">reputation</p>
      </div>

      {/* Share button — always show for hackathons */}
      <ShareButton
        text={entry.avgPayoutDays !== null
          ? `🏆 ${entry.name} pays winners in ${entry.avgPayoutDays}d avg with ${entry.payoutCompletionRate}% payout rate — ranked #${rank} on @proofofship`
          : `🏆 ${entry.name} — ranked #${rank} hackathon on @proofofship`
        }
        entryType="hackathon"
        entry={entry}
        rank={rank}
      />
    </div>
  );
}
