import React, { useEffect, useMemo, useState, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";

import { useUser } from "@/contexts/UserContext";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/Modal";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import EcosystemSection from "@/components/dashboard/EcosystemSection";
import ErrorBoundary from "@/components/ErrorBoundary";
import BuilderActivityFeed from "@/components/projects/BuilderActivityFeed";
import { useToastActions } from "@/components/common/Toast";
import ethosService from "@/services/EthosService";
import { EthosScoreBadge, EthosProfileLink } from "@/components/ethos";
import useFollow from "@/hooks/useFollow";

import {
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  PlusIcon,
  CodeBracketIcon,
  StarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserPlusIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";

const ECOSYSTEM_ICONS = {
  celo: "\uD83C\uDF31",
  arc: "\u26A1",
  base: "\uD83D\uDD35",
  linea: "\uD83D\uDD34",
  arbitrum: "\uD83D\uDD37",
  ethereum: "\uD83D\uDC8E",
  optimism: "\uD83D\uDD34",
  solana: "\u2600\uFE0F",
};

export default function UserPortfolioPage() {
  const router = useRouter();
  const { username } = router.query;
  const { currentUser } = useUser();

  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ethosUser, setEthosUser] = useState(null);
  const [ethosLoading, setEthosLoading] = useState(false);

  // Filters
  const [selectedEcosystem, setSelectedEcosystem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/portfolio/${username}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load portfolio");
        }

        const data = await res.json();
        if (!cancelled) setPortfolio(data);

        // Fetch Ethos score if wallet address exists
        if (data?.user?.walletAddress && !cancelled) {
          setEthosLoading(true);
          try {
            const ethosData = await ethosService.getScoresByAddress(data.user.walletAddress);
            if (!cancelled) setEthosUser(ethosData);
          } catch (e) {
            console.error("Failed to fetch Ethos score:", e);
          } finally {
            if (!cancelled) setEthosLoading(false);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load portfolio");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [username]);

  // Project map keyed by slug for quick lookups
  const projectMap = useMemo(() => {
    const map = {};
    for (const p of portfolio?.projects || []) {
      map[p.slug || p.id] = p;
    }
    return map;
  }, [portfolio]);

  // Filtered & searched projects
  const filteredProjects = useMemo(() => {
    let list = portfolio?.projects || [];
    if (selectedEcosystem) {
      list = list.filter((p) => p.ecosystem === selectedEcosystem);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [portfolio, selectedEcosystem, searchQuery]);

  const projectsByEcosystem = useMemo(() => {
    const grouped = {};
    for (const p of filteredProjects) {
      const eco = p.ecosystem || "unknown";
      grouped[eco] = grouped[eco] || [];
      grouped[eco].push(p);
    }
    return grouped;
  }, [filteredProjects]);

  const availableEcosystems = useMemo(() => {
    const ecoSet = new Set((portfolio?.projects || []).map((p) => p.ecosystem).filter(Boolean));
    return [...ecoSet].sort();
  }, [portfolio]);

  const isOwner = useMemo(() => {
    if (!currentUser || !portfolio?.user?.uid) return false;
    return currentUser.uid === portfolio.user.uid;
  }, [currentUser, portfolio]);

  // Follow state — only for authenticated non-owner visitors
  const shouldShowFollow = useMemo(() => {
    return currentUser && portfolio?.user?.uid && !isOwner;
  }, [currentUser, portfolio, isOwner]);

  const toast = useToastActions();

  const {
    following,
    followerCount,
    loading: followLoading,
    toggleFollow,
  } = useFollow(
    shouldShowFollow ? portfolio.user.uid : null,
    false,
    portfolio?.user?.followerCount || 0,
    (error, newFollowing) => {
      if (error) {
        toast.error(`Failed to update follow status for ${displayName}: ${error.message || error}`);
      } else if (newFollowing) {
        toast.success(`Started following ${displayName}`);
      } else {
        toast.success(`Unfollowed ${displayName}`);
      }
    }
  );

  const clearFilters = useCallback(() => {
    setSelectedEcosystem(null);
    setSearchQuery("");
  }, []);

  const stats = useMemo(() => {
    if (!portfolio?.stats) return null;
    return portfolio.stats;
  }, [portfolio]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Hero skeleton */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-6 w-40 bg-gray-200 rounded" />
                  <div className="h-4 w-60 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </Card>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
                <div className="h-7 w-24 bg-gray-200 rounded" />
              </Card>
            ))}
          </div>

          {/* Activity skeleton */}
          <Card className="p-6 animate-pulse">
            <div className="h-6 w-40 bg-gray-200 rounded mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-gray-200 rounded" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Projects skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-3" />
                <div className="h-3 w-full bg-gray-100 rounded mb-2" />
                <div className="h-3 w-2/3 bg-gray-100 rounded mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto py-20 px-4">
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XMarkIcon className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Builder not found
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {error}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => router.push("/")}>Go home</Button>
              <Button variant="outline" onClick={() => router.push("/explore")}>
                Explore projects
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const displayName =
    portfolio?.user?.displayName || portfolio?.user?.githubUsername || username;
  const hasProjects = filteredProjects.length > 0;
  const hasAnyFilter = selectedEcosystem || searchQuery.trim();

  return (
    <>
      <Head>
        <title>{displayName} • Builder Profile — Proof of Ship</title>
        <meta
          name="description"
          content={
            portfolio?.user?.bio
              ? `${displayName}: ${portfolio.user.bio}`
              : `Onchain projects by ${displayName} — ${stats?.totalProjects || 0} projects across ${stats?.ecosystems || 0} ecosystems.`
          }
        />
        <meta property="og:title" content={`${displayName} — Proof of Ship`} />
        <meta
          property="og:description"
          content={`${stats?.totalProjects || 0} projects · ${stats?.totalStars || 0} stars · ${stats?.avgHealth || 0}% avg health`}
        />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://proofofship.app/u/${encodeURIComponent(username || "")}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${displayName} — Proof of Ship`} />
        <meta
          name="twitter:description"
          content={`${stats?.totalProjects || 0} projects · ${stats?.totalStars || 0} stars · ${stats?.avgHealth || 0}% avg health`}
        />
        {(portfolio?.user?.githubUsername || username) && (() => {
          const ogParams = new URLSearchParams({
            type: "profile",
            username: portfolio?.user?.githubUsername || username,
            displayName: displayName || "",
            avatar: portfolio?.user?.photoURL || "",
            projectCount: String(stats?.totalProjects || 0),
            ethosScore: ethosUser?.score != null ? String(Math.round(ethosUser.score)) : "",
            ecosystemCount: String(stats?.ecosystems || 0),
            avgHealth: String(stats?.avgHealth || 0),
            totalStars: String(stats?.totalStars || 0),
          });
          return (
            <>
              <meta property="og:image" content={`/api/og?${ogParams.toString()}`} />
              <meta name="twitter:image" content={`/api/og?${ogParams.toString()}`} />
            </>
          );
        })()}
      </Head>

      <ErrorBoundary
        name="UserPortfolio"
        errorMessage="Failed to load portfolio. Please refresh the page."
      >
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* ── Hero Section ── */}
            <Card className="p-6 border-0 shadow-lg rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  {portfolio?.user?.photoURL ? (
                    <img
                      src={portfolio.user.photoURL}
                      alt={displayName}
                      className="w-16 h-16 rounded-full border-2 border-white/30 ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-bold text-xl border border-white/30">
                      {String(displayName).slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-extrabold tracking-tight">
                        {displayName}
                      </h1>
                      {/* Ethos Credibility Score Badge */}
                      {portfolio?.user?.walletAddress ? (
                        ethosLoading ? (
                          <div className="text-xs text-white/70">Loading...</div>
                        ) : ethosUser ? (
                          <EthosScoreBadge
                            score={ethosUser.score}
                            ethosUser={ethosUser}
                            size="sm"
                          />
                        ) : (
                          <EthosScoreBadge score={null} size="sm" showLabel={false} />
                        )
                      ) : null}
                    </div>
                    {portfolio?.user?.bio && (
                      <p className="text-sm text-white/80 mb-1 max-w-lg">
                        {portfolio.user.bio}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
                      {portfolio?.user?.githubUsername && (
                        <a
                          href={`https://github.com/${portfolio.user.githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-white transition-colors"
                        >
                          <GlobeAltIcon className="w-4 h-4" />
                          <span>@{portfolio.user.githubUsername}</span>
                          <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                        </a>
                      )}
                      <span className="text-white/40">•</span>
                      <span>{stats?.totalProjects || 0} project{(stats?.totalProjects || 0) !== 1 ? "s" : ""}</span>
                      <span className="text-white/40">•</span>
                      <span>{stats?.ecosystems || 0} ecosystem{(stats?.ecosystems || 0) !== 1 ? "s" : ""}</span>
                      <span className="text-white/40">•</span>
                      <span className="inline-flex items-center gap-1">
                        <UserPlusIcon className="w-3.5 h-3.5" />
                        <span>{followerCount} follower{(followerCount || 0) !== 1 ? "s" : ""}</span>
                      </span>
                      {ethosUser && portfolio?.user?.walletAddress && (
                        <>
                          <span className="text-white/40">•</span>
                          <EthosProfileLink
                            address={portfolio.user.walletAddress}
                            username={ethosUser.username}
                            className="text-xs text-white/80 hover:text-white"
                          >
                            Ethos Profile
                          </EthosProfileLink>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Follow/Unfollow button — only for authenticated non-owner visitors */}
                  {shouldShowFollow && (
                    <>
                      <Button
                        onClick={() => {
                          if (following) {
                            setShowUnfollowModal(true);
                          } else {
                            toggleFollow();
                          }
                        }}
                        loading={followLoading}
                        leftIcon={
                          following ? (
                            <UserMinusIcon className="w-5 h-5" />
                          ) : (
                            <UserPlusIcon className="w-5 h-5" />
                          )
                        }
                        variant="outline"
                        className={`border transition-colors ${
                          following
                            ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                            : "bg-white text-indigo-600 border-white hover:bg-indigo-50"
                        }`}
                      >
                        {following ? "Following" : "Follow"}
                      </Button>

                      <ConfirmModal
                        isOpen={showUnfollowModal}
                        onClose={() => setShowUnfollowModal(false)}
                        onConfirm={async () => {
                          setShowUnfollowModal(false);
                          toggleFollow();
                        }}
                        title={`Unfollow @${displayName}?`}
                        message={`You will no longer see ${displayName}'s activity in your feed.`}
                        confirmText="Unfollow"
                        cancelText="Cancel"
                        variant="danger"
                      />
                    </>
                  )}

                  {isOwner ? (
                    <Button
                      onClick={() => router.push("/projects/new")}
                      leftIcon={<PlusIcon className="w-5 h-5" />}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50"
                      variant="outline"
                    >
                      Add project
                    </Button>
                  ) : null}
                  <Link href={isOwner ? "/build" : "/projects/new"}>
                    <Button
                      variant="outline"
                      leftIcon={<PlusIcon className="w-5 h-5" />}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50"
                    >
                      {isOwner ? "Manage projects" : "Submit your project"}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* ── Stats Bar ── */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<ChartBarIcon className="w-5 h-5" />}
                  label="Projects"
                  value={stats.totalProjects}
                  color="indigo"
                />
                <StatCard
                  icon={<StarIcon className="w-5 h-5" />}
                  label="Total Stars"
                  value={stats.totalStars}
                  color="amber"
                />
                <StatCard
                  icon={<CodeBracketIcon className="w-5 h-5" />}
                  label="Commits"
                  value={stats.totalCommits}
                  color="blue"
                />
                <StatCard
                  icon={<ArrowTrendingUpIcon className="w-5 h-5" />}
                  label="Avg Health"
                  value={`${stats.avgHealth}%`}
                  color="green"
                />
              </div>
            )}

            {/* ── Activity Feed ── */}
            {portfolio?.recentActivity && portfolio.recentActivity.length > 0 && (
              <BuilderActivityFeed
                activities={portfolio.recentActivity}
                projectMap={projectMap}
                maxItems={10}
              />
            )}

            {/* ── Projects Section ── */}
            <div>
              {/* Section header + filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Projects
                  {hasAnyFilter && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({filteredProjects.length} of {portfolio?.projects?.length || 0})
                    </span>
                  )}
                </h2>

                <div className="flex items-center gap-2">
                  {/* Search */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search projects..."
                      className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-48"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Ecosystem filter */}
                  {availableEcosystems.length > 1 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
                          showFilters || selectedEcosystem
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <AdjustmentsHorizontalIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Filter</span>
                      </button>

                      {showFilters && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowFilters(false)}
                          />
                          <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-gray-200 rounded-xl shadow-xl p-3 min-w-[200px]">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                              Ecosystem
                            </p>
                            <div className="space-y-1">
                              <button
                                onClick={() => {
                                  setSelectedEcosystem(null);
                                  setShowFilters(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                  !selectedEcosystem
                                    ? "bg-indigo-50 text-indigo-700 font-medium"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                All ecosystems
                              </button>
                              {availableEcosystems.map((eco) => (
                                <button
                                  key={eco}
                                  onClick={() => {
                                    setSelectedEcosystem(eco === selectedEcosystem ? null : eco);
                                    setShowFilters(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                                    selectedEcosystem === eco
                                      ? "bg-indigo-50 text-indigo-700 font-medium"
                                      : "text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  <span>{ECOSYSTEM_ICONS[eco] || "🌐"}</span>
                                  <span className="capitalize">{eco}</span>
                                </button>
                              ))}
                            </div>
                            {hasAnyFilter && (
                              <button
                                onClick={clearFilters}
                                className="mt-3 w-full text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium py-2 border-t border-gray-100"
                              >
                                Clear all filters
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Filter chips */}
              {hasAnyFilter && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {selectedEcosystem && (
                    <Chip
                      label={`Ecosystem: ${selectedEcosystem}`}
                      onRemove={() => setSelectedEcosystem(null)}
                    />
                  )}
                  {searchQuery && (
                    <Chip
                      label={`Search: "${searchQuery}"`}
                      onRemove={() => setSearchQuery("")}
                    />
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Projects content */}
              {Object.keys(projectsByEcosystem).length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <CodeBracketIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {hasAnyFilter ? "No matching projects" : "No projects yet"}
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {hasAnyFilter
                      ? "Try adjusting your search or clearing filters."
                      : isOwner
                        ? "Add your first project and start building your onchain portfolio."
                        : "This builder hasn't published any projects yet."}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {hasAnyFilter && (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    )}
                    {isOwner && !hasAnyFilter && (
                      <Button
                        onClick={() => router.push("/projects/new")}
                        leftIcon={<PlusIcon className="w-5 h-5" />}
                      >
                        Add your first project
                      </Button>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  {Object.entries(projectsByEcosystem).map(([ecosystem, projects]) => (
                    <EcosystemSection
                      key={ecosystem}
                      ecosystem={ecosystem}
                      projects={projects}
                      totalProjects={projects.length}
                      isExpanded
                      viewMode="grid"
                      showControls={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </>
  );
}

/** ── Stat Card ── */
function StatCard({ icon, label, value, color = "indigo" }) {
  const colorMap = {
    indigo: "from-indigo-50 to-indigo-100/50 text-indigo-600 border-indigo-200",
    amber: "from-amber-50 to-amber-100/50 text-amber-600 border-amber-200",
    blue: "from-blue-50 to-blue-100/50 text-blue-600 border-blue-200",
    green: "from-green-50 to-green-100/50 text-green-600 border-green-200",
  };

  return (
    <Card className={`p-4 border-0 shadow-sm rounded-xl bg-gradient-to-br ${colorMap[color]} bg-white`}>
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${colorMap[color].split(" ")[0]} ${colorMap[color].split(" ")[1]}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

/** ── Filter Chip ── */
function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
      {label}
      <button onClick={onRemove} className="hover:text-indigo-900">
        <XMarkIcon className="w-3 h-3" />
      </button>
    </span>
  );
}
