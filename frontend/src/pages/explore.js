/**
 * Explore v2 — Projects + Hackathons + Builders with trending signals,
 * advanced filter/sort, bookmarks, pagination, and grid/list views.
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useEnhancedGithub } from "@/providers/Github/EnhancedGithubProvider";
import { useUser } from "@/contexts/UserContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import useFollow from "@/hooks/useFollow";
import { useToastActions } from "@/components/common/Toast";
import { ConfirmModal } from "@/components/common/Modal";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import TabBar from "@/components/common/TabBar";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import LiveAgentTicker from "@/components/common/LiveAgentTicker";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SkeletonProjectGrid, SkeletonBlock, LoadingSpinner } from "@/components/common/LoadingStates";
import { ECOSYSTEM_CONFIGS } from "@/config/ecosystems";
import { getProjectQuality } from "@/lib/projects/projectQuality";
import { filterProjects, sortProjects, calculateProjectStats } from "@/utils/projectUtils";
import {
  CalendarIcon,
  TrophyIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  BookmarkIcon as BookmarkOutline,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";

const CATEGORY_OPTIONS = [
  { id: "defi", label: "DeFi" },
  { id: "gaming", label: "Gaming" },
  { id: "rwa", label: "RWA" },
  { id: "infrastructure", label: "Infra" },
  { id: "social", label: "Social" },
  { id: "ai-agents", label: "AI Agents" },
  { id: "payments", label: "Payments" },
  { id: "nft", label: "NFT" },
  { id: "dao", label: "DAO" },
  { id: "other", label: "Other" },
];

const SORT_OPTIONS = [
  { id: "trending", label: "Trending" },
  { id: "created", label: "Newest" },
  { id: "health", label: "Quality" },
  { id: "name", label: "Name" },
  { id: "recent", label: "Activity" },
];

const BUILDER_SORT_OPTIONS = [
  { id: "projects", label: "Most projects" },
  { id: "stars", label: "Most stars" },
  { id: "health", label: "Quality" },
  { id: "followers", label: "Most followed" },
  { id: "recent", label: "Recently active" },
  { id: "name", label: "Name" },
];

const ECOSYSTEM_OPTIONS = Object.entries(ECOSYSTEM_CONFIGS).map(([id, cfg]) => ({
  id,
  label: `${cfg.icon} ${cfg.shortName}`,
}));

const ITEMS_PER_PAGE = 12;

export default function ExplorePage() {
  const router = useRouter();
  const tab = router.query.tab || "projects";
  const setTab = (t) => {
    router.replace(
      { pathname: router.pathname, query: t === "projects" ? {} : { tab: t } },
      undefined,
      { shallow: true }
    );
  };

  const tabs = [
    { id: "projects", label: "Projects" },
    { id: "builders", label: "Builders" },
    { id: "hackathons", label: "Hackathons" },
  ];

  return (
    <ErrorBoundary name="ExplorePage" errorMessage="Failed to load. Please refresh.">
      <Head>
        <title>Explore — Proof of Ship</title>
      </Head>
      <div className="min-h-screen bg-surface-secondary">
        <LiveAgentTicker />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumbs items={[{ label: "Explore" }]} />
          <TabBar
            tabs={tabs}
            activeTab={tab}
            onChange={setTab}
            variant="pill"
            className="mb-6"
          />
          {tab === "projects" ? <ProjectsTab /> : tab === "builders" ? <BuildersTab /> : <HackathonsTab />}
        </div>
      </div>
    </ErrorBoundary>
  );
}

/* ── Active Filter Chips ── */
function ActiveFilterChips({ filters, onRemove, onClearAll }) {
  if (!filters || filters.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Filters:</span>
      {filters.map((f, i) => (
        <span
          key={`${f.label}-${i}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
        >
          {f.label}
          <button
            onClick={() => onRemove(f.key)}
            className="hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
          >
            <XMarkIcon className="w-3 h-3" />
          </button>
        </span>
      ))}
      {filters.length > 0 && (
        <button
          onClick={onClearAll}
          className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium ml-1"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

/* ── Projects Tab ── */
function ProjectsTab() {
  const router = useRouter();
  const { projectData, loading, errors } = useEnhancedGithub();
  const { currentUser } = useUser();
  const { bookmarks, isBookmarked, toggleBookmark, loaded: bookmarksLoaded } = useBookmarks();

  // Filter/sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEcosystems, setSelectedEcosystems] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minQualityScore, setMinQualityScore] = useState(0);
  const [fundingOnly, setFundingOnly] = useState(false);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [sortBy, setSortBy] = useState("trending");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [showTrending, setShowTrending] = useState(true);
  const resultsRef = useRef(null);

  // Sync filters from URL on mount
  useEffect(() => {
    const { q, ecosystems, categories, quality, funding, bookmarked, sort, view } = router.query || {};
    if (q) setSearchQuery(String(q));
    if (ecosystems) setSelectedEcosystems(String(ecosystems).split(",").filter(Boolean));
    if (categories) setSelectedCategories(String(categories).split(",").filter(Boolean));
    if (quality) setMinQualityScore(Number(quality));
    if (funding === "1") setFundingOnly(true);
    if (bookmarked === "1") setBookmarksOnly(true);
    if (sort) setSortBy(String(sort));
    if (view) setViewMode(String(view));
  }, []);

  // Keep URL in sync with filters (shallow)
  useEffect(() => {
    const q = {};
    if (searchQuery) q.q = searchQuery;
    if (selectedEcosystems.length > 0) q.ecosystems = selectedEcosystems.join(",");
    if (selectedCategories.length > 0) q.categories = selectedCategories.join(",");
    if (minQualityScore > 0) q.quality = String(minQualityScore);
    if (fundingOnly) q.funding = "1";
    if (bookmarksOnly) q.bookmarked = "1";
    if (sortBy !== "trending") q.sort = sortBy;
    if (viewMode !== "grid") q.view = viewMode;
    router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true });
  }, [searchQuery, selectedEcosystems, selectedCategories, minQualityScore, fundingOnly, bookmarksOnly, sortBy, viewMode]);

  // Flatten and process projects
  const allProjects = useMemo(() => {
    if (!projectData) return [];
    const flat = [];
    Object.entries(projectData).forEach(([eco, list]) => {
      if (Array.isArray(list)) {
        list.forEach((p) => flat.push({ ...p, ecosystem: p.ecosystem || eco }));
      }
    });
    return flat;
  }, [projectData]);

  // Compute trending projects (top 3 by activity + health)
  const trendingProjects = useMemo(() => {
    return allProjects
      .filter((p) => p.stats?.isActive || (p.stats?.healthScore || 0) >= 40)
      .map((p) => {
        const daysSinceCommit = p.stats?.lastCommit
          ? Math.floor((Date.now() - new Date(p.stats.lastCommit).getTime()) / (1000 * 60 * 60 * 24))
          : 365;
        const activityScore = daysSinceCommit <= 7 ? 40 : daysSinceCommit <= 30 ? 30 : daysSinceCommit <= 90 ? 20 : 10;
        const healthScore = (p.stats?.healthScore || 0) * 0.3;
        const consistency = Math.min((p.stats?.commits || 0) / 5, 20);
        const crossChain = p.chains?.length > 1 ? 10 : 3;
        const quality = getProjectQuality(p).score * 0.05;
        return {
          ...p,
          trendingScore: Math.round(activityScore + healthScore + consistency + crossChain + quality),
        };
      })
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 3);
  }, [allProjects]);

  const handleFilterToggle = useCallback((arr, setter, value) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    setPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedEcosystems([]);
    setSelectedCategories([]);
    setMinQualityScore(0);
    setFundingOnly(false);
    setBookmarksOnly(false);
    setSortBy("trending");
    setPage(1);
  }, []);

  const hasActiveFilters =
    searchQuery ||
    selectedEcosystems.length > 0 ||
    selectedCategories.length > 0 ||
    minQualityScore > 0 ||
    fundingOnly ||
    bookmarksOnly;

  // Build active filter chips
  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (searchQuery) chips.push({ key: "search", label: `"${searchQuery}"` });
    selectedEcosystems.forEach((e) => {
      const cfg = ECOSYSTEM_CONFIGS[e];
      chips.push({ key: `eco-${e}`, label: cfg ? `${cfg.icon} ${cfg.shortName}` : e });
    });
    selectedCategories.forEach((c) => {
      const cat = CATEGORY_OPTIONS.find((o) => o.id === c);
      chips.push({ key: `cat-${c}`, label: cat ? cat.label : c });
    });
    if (minQualityScore > 0) chips.push({ key: "quality", label: `≥${minQualityScore}% quality` });
    if (fundingOnly) chips.push({ key: "funding", label: "Seeking funding" });
    if (bookmarksOnly) chips.push({ key: "bookmarks", label: "Bookmarked" });
    return chips;
  }, [searchQuery, selectedEcosystems, selectedCategories, minQualityScore, fundingOnly, bookmarksOnly]);

  const removeFilterChip = useCallback((key) => {
    if (key === "search") setSearchQuery("");
    else if (key.startsWith("eco-")) setSelectedEcosystems((prev) => prev.filter((e) => `eco-${e}` !== key));
    else if (key.startsWith("cat-")) setSelectedCategories((prev) => prev.filter((c) => `cat-${c}` !== key));
    else if (key === "quality") setMinQualityScore(0);
    else if (key === "funding") setFundingOnly(false);
    else if (key === "bookmarks") setBookmarksOnly(false);
    setPage(1);
  }, []);

  // Filter and sort
  const processedProjects = useMemo(() => {
    let list = [...allProjects];

    // Bookmark filter
    if (bookmarksOnly && bookmarksLoaded) {
      list = list.filter((p) => isBookmarked(p.slug));
    }

    // Ecosystem filter
    if (selectedEcosystems.length > 0) {
      list = list.filter((p) => selectedEcosystems.includes(p.ecosystem));
    }

    // Category filter
    if (selectedCategories.length > 0) {
      list = list.filter((p) => selectedCategories.includes(p.category));
    }

    // Quality score filter
    if (minQualityScore > 0) {
      list = list.filter((p) => getProjectQuality(p).score >= minQualityScore);
    }

    // Funding filter
    if (fundingOnly) {
      list = list.filter((p) => p.lookingForFunding);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = filterProjects(list, { search: q });
    }

    // Sort
    if (sortBy === "trending") {
      list = list
        .map((p) => {
          const quality = getProjectQuality(p);
          // Trending score: activity (40%) + quality (30%) + engagement (20%) + recency (10%)
          const daysSince = p.stats?.lastCommit
            ? (Date.now() - new Date(p.stats.lastCommit).getTime()) / (1000 * 60 * 60 * 24)
            : 365;
          const recencyScore = daysSince <= 7 ? 40 : daysSince <= 30 ? 30 : daysSince <= 90 ? 20 : daysSince <= 180 ? 10 : 0;
          const qualityScore = quality.score * 0.3;
          const engagement = Math.min((p.stats?.stars || 0) * 0.5 + (p.stats?.forks || 0) * 0.3, 20);
          return { ...p, _sortScore: recencyScore + qualityScore + engagement };
        })
        .sort((a, b) => b._sortScore - a._sortScore);
    } else {
      list = sortProjects(list, sortBy, sortBy === "name" ? "asc" : "desc");
    }

    return list;
  }, [allProjects, selectedEcosystems, selectedCategories, minQualityScore, fundingOnly, bookmarksOnly, bookmarksLoaded, isBookmarked, sortBy, searchQuery]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(processedProjects.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [processedProjects, currentPage]);

  const stats = useMemo(() => calculateProjectStats(processedProjects), [processedProjects]);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (Object.keys(errors).length > 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600">Failed to load projects. Please refresh.</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-12 w-full rounded-xl" />
        <SkeletonBlock className="h-32 w-full rounded-xl" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <SkeletonBlock className="h-6 w-48 rounded" />
        <SkeletonProjectGrid count={6} />
      </div>
    );
  }

  return (
    <>
      {/* ── Trending Section ── */}
      {showTrending && trendingProjects.length > 0 && !hasActiveFilters && (
        <TrendingSection
          projects={trendingProjects}
          onDismiss={() => setShowTrending(false)}
          onProjectClick={(p) => router.push(`/projects/${p.ecosystem || "base"}/${p.slug}`)}
          isBookmarked={isBookmarked}
          onToggleBookmark={toggleBookmark}
        />
      )}

      {/* ── Search & Controls Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects by name, description, or owner..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label === "Trending" ? "🔥 Trending" : opt.label === "Newest" ? "🆕 Newest" : opt.label === "Quality" ? "⭐ Quality" : opt.label === "Activity" ? "📊 Activity" : opt.label}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                : "border-gray-300 dark:border-gray-600 text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
            title="Filters"
          >
            <FunnelIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Active Filter Chips ── */}
      <ActiveFilterChips
        filters={activeFilterChips}
        onRemove={removeFilterChip}
        onClearAll={clearAllFilters}
      />

      {/* ── Filters Panel ── */}
      {showFilters && (
        <Card className="p-5 mb-4 border-2 border-blue-100 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Ecosystem */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Ecosystem
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ECOSYSTEM_OPTIONS.map((eco) => (
                  <button
                    key={eco.id}
                    onClick={() => handleFilterToggle(selectedEcosystems, setSelectedEcosystems, eco.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedEcosystems.includes(eco.id)
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {eco.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleFilterToggle(selectedCategories, setSelectedCategories, cat.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategories.includes(cat.id)
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Score */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Min quality score: {minQualityScore}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minQualityScore}
                onChange={(e) => { setMinQualityScore(Number(e.target.value)); setPage(1); }}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Any</span>
                <span>100</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fundingOnly}
                  onChange={(e) => { setFundingOnly(e.target.checked); setPage(1); }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Seeking funding</span>
              </label>
              {bookmarksLoaded && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookmarksOnly}
                    onChange={(e) => { setBookmarksOnly(e.target.checked); setPage(1); }}
                    className="rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Bookmarked only</span>
                </label>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── Results bar ── */}
      <div ref={resultsRef} className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {hasActiveFilters || searchQuery ? (
            <>
              <span className="font-medium text-gray-900 dark:text-gray-100">{processedProjects.length}</span> result
              {processedProjects.length !== 1 ? "s" : ""}
              {searchQuery && <> for &ldquo;{searchQuery}&rdquo;</>}
            </>
          ) : (
            <>
              <span className="font-medium text-gray-900 dark:text-gray-100">{stats.total}</span> projects across{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">{stats.ecosystems}</span> ecosystems
            </>
          )}
        </p>
        {bookmarksLoaded && bookmarks.length > 0 && !bookmarksOnly && (
          <button
            onClick={() => { setBookmarksOnly(true); setPage(1); }}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"
          >
            <BookmarkSolid className="w-3.5 h-3.5" />
            {bookmarks.length} bookmarked
          </button>
        )}
      </div>

      {/* ── Project Grid / List ── */}
      {pagedProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No projects found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            {hasActiveFilters
              ? "Try adjusting your filters or search query."
              : "Be the first to submit a project!"}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          )}
          {!currentUser && (
            <Link href="/login">
              <Button className="ml-2">Sign in to submit</Button>
            </Link>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagedProjects.map((project) => (
            <ExploreProjectCard
              key={project.slug}
              project={project}
              isBookmarked={isBookmarked(project.slug)}
              onToggleBookmark={() => toggleBookmark(project.slug)}
              onClick={() => router.push(`/projects/${project.ecosystem || "base"}/${project.slug}`)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {pagedProjects.map((project) => (
            <ExploreProjectListItem
              key={project.slug}
              project={project}
              isBookmarked={isBookmarked(project.slug)}
              onToggleBookmark={() => toggleBookmark(project.slug)}
              onClick={() => router.push(`/projects/${project.ecosystem || "base"}/${project.slug}`)}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); scrollToResults(); }}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4 inline mr-1" />
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => { setPage(pageNum); scrollToResults(); }}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === currentPage
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); scrollToResults(); }}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Next
              <ChevronRightIcon className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Builders Tab ── */
function BuildersTab() {
  const router = useRouter();
  const { currentUser } = useUser();

  const [builders, setBuilders] = useState([]);
  const [totalBuilders, setTotalBuilders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEcosystem, setSelectedEcosystem] = useState("");
  const [sortBy, setSortBy] = useState("projects");
  const [page, setPage] = useState(1);
  const resultsRef = useRef(null);

  // Fetch builders from API
  useEffect(() => {
    let cancelled = false;
    async function fetchBuilders() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append("limit", "200");
        if (searchQuery) params.append("search", searchQuery);
        if (selectedEcosystem) params.append("ecosystem", selectedEcosystem);
        if (sortBy) params.append("sort", sortBy);

        const res = await fetch(`/api/builders?${params}`);
        if (!res.ok) throw new Error("Failed to load builders");
        const data = await res.json();
        if (!cancelled) {
          setBuilders(data.builders || []);
          setTotalBuilders(data.total || 0);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchBuilders();
    return () => { cancelled = true; };
  }, [searchQuery, selectedEcosystem, sortBy]);

  // Paginate locally
  const totalPages = Math.max(1, Math.ceil(builders.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedBuilders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return builders.slice(start, start + ITEMS_PER_PAGE);
  }, [builders, currentPage]);

  // Active filter chips
  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (searchQuery) chips.push({ key: "search", label: `"${searchQuery}"` });
    if (selectedEcosystem) {
      const cfg = ECOSYSTEM_CONFIGS[selectedEcosystem];
      chips.push({ key: "ecosystem", label: cfg ? `${cfg.icon} ${cfg.shortName}` : selectedEcosystem });
    }
    return chips;
  }, [searchQuery, selectedEcosystem]);

  const removeFilterChip = useCallback((key) => {
    if (key === "search") setSearchQuery("");
    if (key === "ecosystem") setSelectedEcosystem("");
    setPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedEcosystem("");
    setSortBy("projects");
    setPage(1);
  }, []);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const hasActiveFilters = searchQuery || selectedEcosystem;

  if (loading && builders.length === 0) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-12 w-full rounded-xl" />
        <SkeletonBlock className="h-6 w-48 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600">⚠️ {error}</p>
      </Card>
    );
  }

  return (
    <>
      {/* ── Search & Controls Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search builders by name, bio, or GitHub handle..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Ecosystem filter */}
          <select
            value={selectedEcosystem}
            onChange={(e) => { setSelectedEcosystem(e.target.value); setPage(1); }}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All ecosystems</option>
            {ECOSYSTEM_OPTIONS.map((eco) => (
              <option key={eco.id} value={eco.id}>{eco.label}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            {BUILDER_SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Active Filter Chips ── */}
      <ActiveFilterChips
        filters={activeFilterChips}
        onRemove={removeFilterChip}
        onClearAll={clearAllFilters}
      />

      {/* ── Results bar ── */}
      <div ref={resultsRef} className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {hasActiveFilters ? (
            <>
              <span className="font-medium text-gray-900 dark:text-gray-100">{builders.length}</span> builder
              {builders.length !== 1 ? "s" : ""}
              {searchQuery && <> for &ldquo;{searchQuery}&rdquo;</>}
            </>
          ) : (
            <>
              <span className="font-medium text-gray-900 dark:text-gray-100">{totalBuilders}</span> active builders
            </>
          )}
        </p>
      </div>

      {/* ── Builder Grid ── */}
      {pagedBuilders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <UsersIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No builders found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            {hasActiveFilters
              ? "Try adjusting your search or filters."
              : "No builders have submitted projects yet."}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagedBuilders.map((builder) => (
            <ExploreBuilderCard
              key={builder.uid}
              builder={builder}
              currentUserId={currentUser?.uid}
              onClick={() => router.push(`/u/${builder.githubUsername}`)}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); scrollToResults(); }}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4 inline mr-1" />
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => { setPage(pageNum); scrollToResults(); }}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === currentPage
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); scrollToResults(); }}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Next
              <ChevronRightIcon className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Follow Button for Builder Cards ── */
function ExploreBuilderFollowButton({ builder, currentUserId }) {
  const isSelf = currentUserId && builder.uid === currentUserId;
  const toast = useToastActions();
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const { following, loading, toggleFollow } = useFollow(
    isSelf ? null : builder.uid,
    false,
    builder.followerCount || 0,
    (error, newFollowing) => {
      const name = builder.displayName || builder.githubUsername;
      if (error) {
        toast.error(`Failed to update follow status for ${name}: ${error.message || error}`);
      } else if (newFollowing) {
        toast.success(`Started following ${name}`);
      } else {
        toast.success(`Unfollowed ${name}`);
      }
    }
  );

  if (!currentUserId || isSelf) return null;

  const name = builder.displayName || builder.githubUsername || "this builder";

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (following) {
            setShowUnfollowModal(true);
          } else {
            toggleFollow();
          }
        }}
        disabled={loading}
        className={`ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
          following
            ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>

      <ConfirmModal
        isOpen={showUnfollowModal}
        onClose={() => setShowUnfollowModal(false)}
        onConfirm={async () => {
          setShowUnfollowModal(false);
          toggleFollow();
        }}
        title={`Unfollow @${name}?`}
        message={`You will no longer see ${name}'s activity in your feed.`}
        confirmText="Unfollow"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}

/* ── Explore Builder Card ── */
function ExploreBuilderCard({ builder, onClick, currentUserId }) {
  const [imgError, setImgError] = useState(false);

  // Compute primary ecosystem and secondary ones
  const primaryEco = builder.ecosystems?.[0];
  const extraEcosystems = builder.ecosystems?.length > 1 ? builder.ecosystems.length - 1 : 0;

  // Quality tier
  const healthTier =
    builder.averageHealth >= 80 ? "top" :
    builder.averageHealth >= 60 ? "good" :
    builder.averageHealth >= 40 ? "fair" : "low";

  const tierColors = {
    top: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    good: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    fair: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    low: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 group"
    >
      {/* Top gradient bar */}
      <div className={`h-2 ${
        healthTier === "top" ? "bg-gradient-to-r from-green-400 to-emerald-500" :
        healthTier === "good" ? "bg-gradient-to-r from-yellow-400 to-amber-500" :
        healthTier === "fair" ? "bg-gradient-to-r from-orange-300 to-orange-400" :
        "bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500"
      }`} />

      <div className="p-4">
        {/* Avatar + Name */}
        <div className="flex items-center gap-3 mb-3">
          {builder.photoURL && !imgError ? (
            <img
              src={builder.photoURL}
              alt={builder.displayName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700 flex-shrink-0"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {builder.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {builder.displayName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              @{builder.githubUsername}
            </p>
          </div>
        </div>

        {/* Bio */}
        {builder.bio && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 min-h-[2rem]">
            {builder.bio}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <CodeBracketIcon className="w-3.5 h-3.5" />
            {builder.projectCount} {builder.projectCount === 1 ? "project" : "projects"}
          </span>
          {builder.totalStars > 0 && (
            <span className="flex items-center gap-1">
              <StarIcon className="w-3.5 h-3.5" />
              {builder.totalStars}
            </span>
          )}
          {builder.followerCount > 0 && (
            <span>{builder.followerCount} followers</span>
          )}
        </div>

        {/* Ecosystem badges + Follow button */}
        <div className="flex flex-wrap items-center gap-1.5">
          {primaryEco && ECOSYSTEM_CONFIGS[primaryEco] && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px] font-medium">
              {ECOSYSTEM_CONFIGS[primaryEco].icon} {ECOSYSTEM_CONFIGS[primaryEco].shortName}
            </span>
          )}
          {extraEcosystems > 0 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">+{extraEcosystems} more</span>
          )}
          {builder.averageHealth > 0 && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${tierColors[healthTier]}`}>
              {builder.averageHealth}%
            </span>
          )}
          <ExploreBuilderFollowButton builder={builder} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}

/* ── Trending Section ── */
function TrendingSection({ projects, onDismiss, onProjectClick, isBookmarked, onToggleBookmark }) {
  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 rounded-2xl border-2 border-orange-200 dark:border-orange-800 p-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200/20 dark:bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-200/20 dark:bg-amber-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-200">
                <ArrowTrendingUpIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Trending Now
                  <SparklesIcon className="w-4 h-4 text-orange-500" />
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Most active and highest quality projects right now
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Dismiss"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {projects.map((project, index) => (
              <div
                key={project.slug}
                onClick={() => onProjectClick(project)}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-orange-100 dark:border-orange-800/50 group relative"
              >
                {/* Rank badge */}
                <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center shadow-lg z-10">
                  {index + 1}
                </div>

                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate pr-2">
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {project.ecosystem?.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs font-bold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                      {project.trendingScore}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleBookmark(project.slug); }}
                      className={`p-1 rounded-md transition-colors ${
                        isBookmarked(project.slug)
                          ? "text-amber-500 hover:text-amber-600"
                          : "text-gray-300 dark:text-gray-600 hover:text-amber-400 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {isBookmarked(project.slug) ? (
                        <BookmarkSolid className="w-4 h-4" />
                      ) : (
                        <BookmarkOutline className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 min-h-[2rem]">
                  {project.description || "Active project"}
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      project.trendingScore >= 80 ? "bg-green-500" : project.trendingScore >= 60 ? "bg-yellow-500" : "bg-orange-500"
                    }`} />
                    Score {project.trendingScore}
                  </span>
                  {project.stats?.commits > 0 && (
                    <span>{project.stats.commits} commits</span>
                  )}
                  {project.stats?.healthScore && (
                    <span>{project.stats.healthScore}% health</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Explore Project Card (Grid) ── */
function ExploreProjectCard({ project, isBookmarked, onToggleBookmark, onClick }) {
  const ecosystemConfig = ECOSYSTEM_CONFIGS[project.ecosystem];
  const quality = getProjectQuality(project);

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 group"
    >
      {/* Image */}
      {project.imageUrl ? (
        <div className="h-32 overflow-hidden">
          <img
            src={project.imageUrl}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="h-16 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600" />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {ecosystemConfig && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  {ecosystemConfig.icon} {ecosystemConfig.shortName}
                </span>
              )}
              {project.category && (
                <span className="text-xs text-gray-400 dark:text-gray-500">· {project.category}</span>
              )}
            </div>
          </div>

          {/* Bookmark */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
            className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
              isBookmarked
                ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20"
                : "text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            }`}
            title={isBookmarked ? "Remove bookmark" : "Bookmark project"}
          >
            {isBookmarked ? (
              <BookmarkSolid className="w-4 h-4" />
            ) : (
              <BookmarkOutline className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 min-h-[2rem]">
            {project.description}
          </p>
        )}

        {/* Tags */}
        {Array.isArray(project.tags) && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px] font-medium"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="text-[10px] text-gray-400">+{project.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Stats + Quality */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {project.stats?.commits > 0 && <span>{project.stats.commits} commits</span>}
            {project.stats?.stars > 0 && <span>{project.stats.stars} ★</span>}
            {project.lookingForFunding && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">Funding</span>
            )}
          </div>

          {/* Quality score bar */}
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  quality.score >= 80
                    ? "bg-green-500"
                    : quality.score >= 60
                    ? "bg-yellow-500"
                    : quality.score >= 40
                    ? "bg-orange-400"
                    : "bg-gray-300"
                }`}
                style={{ width: `${quality.score}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${
              quality.score >= 80
                ? "text-green-600 dark:text-green-400"
                : quality.score >= 60
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-gray-400"
            }`}>
              {quality.score}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Explore Project List Item ── */
function ExploreProjectListItem({ project, isBookmarked, onToggleBookmark, onClick }) {
  const ecosystemConfig = ECOSYSTEM_CONFIGS[project.ecosystem];
  const quality = getProjectQuality(project);

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 group"
    >
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        {project.imageUrl ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={project.imageUrl}
              alt={project.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex-shrink-0 flex items-center justify-center">
            <span className="text-2xl">{ecosystemConfig?.icon || "📦"}</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {project.name}
            </h3>
            {ecosystemConfig && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {ecosystemConfig.icon} {ecosystemConfig.shortName}
              </span>
            )}
            {project.lookingForFunding && (
              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium flex-shrink-0">
                Funding
              </span>
            )}
          </div>
          {project.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
              {project.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {project.stats?.commits > 0 && <span>{project.stats.commits} commits</span>}
            {project.stats?.stars > 0 && <span>{project.stats.stars} ★</span>}
            <span className={`font-medium ${
              quality.score >= 80
                ? "text-green-600 dark:text-green-400"
                : quality.score >= 60
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-gray-400"
            }`}>
              {quality.score}% quality
            </span>
            {project.category && <span>· {project.category}</span>}
          </div>
        </div>

        {/* Bookmark + Arrow */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
            className={`p-1.5 rounded-lg transition-all ${
              isBookmarked
                ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20"
                : "text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-amber-400"
            }`}
            title={isBookmarked ? "Remove bookmark" : "Bookmark project"}
          >
            {isBookmarked ? (
              <BookmarkSolid className="w-4 h-4" />
            ) : (
              <BookmarkOutline className="w-4 h-4" />
            )}
          </button>
          <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors" />
        </div>
      </div>
    </div>
  );
}

/* ── Hackathons Tab ── */
function HackathonsTab() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter !== "all") params.append("status", filter);
        const res = await fetch(`/api/hackathons?${params}`);
        if (!res.ok) throw new Error("Failed to fetch hackathons");
        const data = await res.json();
        setHackathons(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter]);

  const grouped = useMemo(
    () => ({
      upcoming: hackathons.filter((h) => h.status === "upcoming"),
      active: hackathons.filter((h) => h.status === "active"),
      completed: hackathons.filter((h) => h.status === "completed"),
    }),
    [hackathons]
  );

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  if (error) return <Card className="p-8 text-center"><p className="text-red-600">⚠️ {error}</p></Card>;

  const empty = !grouped.upcoming.length && !grouped.active.length && !grouped.completed.length;

  return (
    <>
      <div className="flex gap-1 bg-white rounded-lg p-1 border w-fit mb-6">
        {["all", "upcoming", "active", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === f ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {empty ? (
        <div className="text-center py-16">
          <TrophyIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hackathons found</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            Hackathon data is loaded from the platform database. Check back soon or submit your hackathon
            project!
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg text-sm">
            <span>🏆</span>
            <span className="text-teal-700 font-medium">Currently building for: Arc Nano Payments Hackathon</span>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { key: "active", title: "Active", icon: <UsersIcon className="h-5 w-5 text-green-600" />, bg: "bg-green-50" },
            { key: "upcoming", title: "Upcoming", icon: <CalendarIcon className="h-5 w-5 text-blue-600" />, bg: "bg-blue-50" },
            { key: "completed", title: "Completed", icon: <TrophyIcon className="h-5 w-5 text-yellow-600" />, bg: "bg-yellow-50" },
          ].map(
            ({ key, title, icon, bg }) =>
              grouped[key].length > 0 && (
                <div key={key} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${bg}`}>{icon}</div>
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    <span className="text-gray-400 text-sm">({grouped[key].length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grouped[key].map((h) => (
                      <Card key={h.id} className="hover:shadow-md transition-shadow">
                        <Link href={`/hackathons/${h.id}`} className="block p-5">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            {h.ecosystem?.toUpperCase()}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900 mt-2">{h.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(h.startDate).toLocaleDateString()} –{" "}
                            {new Date(h.endDate).toLocaleDateString()}
                          </p>
                          {h.prizePool && (
                            <p className="text-sm font-medium text-gray-900 mt-2">
                              ${h.prizePool.toLocaleString()} in prizes
                            </p>
                          )}
                        </Link>
                      </Card>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      )}
    </>
  );
}
