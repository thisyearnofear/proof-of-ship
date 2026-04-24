/**
 * Explore Page — unified Projects + Hackathons view
 */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useEnhancedGithub } from "@/providers/Github/EnhancedGithubProvider";
import { useReputation } from "@/contexts/ReputationContext";
import HybridDashboard from "@/components/dashboard/HybridDashboard";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import TabBar from "@/components/common/TabBar";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { SkeletonProjectGrid } from "@/components/common/SkeletonLoader";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NETWORK_CONFIGS } from "@/config/networks";
import { ECOSYSTEM_CONFIGS } from "@/config/ecosystems";
import {
  CalendarIcon,
  TrophyIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function ExplorePage() {
  const router = useRouter();
  const tab = router.query.tab || "projects";

  const setTab = (t) => {
    router.replace({ pathname: router.pathname, query: t === "projects" ? {} : { tab: t } }, undefined, { shallow: true });
  };

  const tabs = [
    { id: 'projects', label: 'Projects' },
    { id: 'hackathons', label: 'Hackathons' },
  ];

  return (
    <ErrorBoundary name="ExplorePage" errorMessage="Failed to load. Please refresh.">
      <Head>
        <title>Explore | Builder Credit</title>
      </Head>
      <div className="min-h-screen bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumbs items={[{ label: "Explore" }]} />
          {/* Tab switcher */}
          <TabBar
            tabs={tabs}
            activeTab={tab}
            onChange={setTab}
            variant="pill"
            className="mb-6"
          />

          {tab === "projects" ? <ProjectsTab /> : <HackathonsTab />}
        </div>
      </div>
    </ErrorBoundary>
  );
}

/* ── Projects Tab ── */
function ProjectsTab() {
  const router = useRouter();
  const { projectData, loading, errors } = useEnhancedGithub();
  const { userProfile } = useReputation();

  const [ecosystem, setEcosystem] = useState("all");
  const [chains, setChains] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const { ecosystem: ecoQ, chains: chainsQ, sectors: sectorsQ } = router.query || {};
    if (ecoQ && (ecoQ === "all" || ecoQ in ECOSYSTEM_CONFIGS)) setEcosystem(String(ecoQ));
    if (chainsQ) setChains(String(chainsQ).split(",").filter(Boolean));
    if (sectorsQ) setSectors(String(sectorsQ).split(",").filter(Boolean));
  }, [router.query]);

  useEffect(() => {
    const q = { ...(router.query.tab ? { tab: router.query.tab } : {}) };
    if (ecosystem !== "all") q.ecosystem = ecosystem;
    if (chains.length > 0) q.chains = chains.join(",");
    if (sectors.length > 0) q.sectors = sectors.join(",");
    router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true });
  }, [ecosystem, chains, sectors]);

  const filteredData = useMemo(() => {
    const result = {};
    if (!projectData) return result;
    const ecos = ecosystem === "all" ? Object.keys(projectData) : [ecosystem];
    const q = searchQuery.toLowerCase().trim();
    ecos.forEach((eco) => {
      const list = projectData[eco] || [];
      result[eco] = list.filter((p) => {
        if (q && !(p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))) return false;
        if (chains.length > 0 && (!p.chains || !p.chains.some((c) => chains.includes(c)))) return false;
        if (sectors.length > 0 && (!p.sectors || !p.sectors.some((s) => sectors.includes(s)))) return false;
        return true;
      });
    });
    return result;
  }, [projectData, ecosystem, chains, sectors, searchQuery]);

  const chainOptions = useMemo(() => {
    const shortNames = { 44787: "Celo", 59141: "Linea", 84532: "Base", 421614: "Arbitrum", 11155111: "Ethereum", 11155420: "Optimism", 5042002: "Arc" };
    return Object.values(NETWORK_CONFIGS).map((c) => ({ id: String(c.chainId), name: shortNames[c.chainId] || c.name }));
  }, []);

  const sectorOptions = [
    { id: "defi", name: "💰 DeFi" }, { id: "gaming", name: "🎮 Gaming" }, { id: "rwa", name: "🏢 RWA" },
    { id: "health", name: "🏥 Health" }, { id: "infrastructure", name: "🏗️ Infra" }, { id: "social", name: "👥 Social" },
    { id: "nft", name: "🖼️ NFT" }, { id: "dao", name: "🗳️ DAO" }, { id: "marketplace", name: "🛍️ Market" }, { id: "bridge", name: "🌉 Bridge" },
  ];

  if (Object.keys(errors).length > 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600">Failed to load projects. Please refresh.</p>
      </Card>
    );
  }

  const totalProjects = useMemo(() => {
    return Object.values(filteredData).reduce((sum, list) => sum + list.length, 0);
  }, [filteredData]);

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search projects by name, description, or category... (⌘K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-search-input
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-100"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {totalProjects} result{totalProjects !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
        </p>
      )}

      <Card className="p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <select value={ecosystem} onChange={(e) => setEcosystem(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-xs font-medium">
            <option value="all">All Ecosystems</option>
            {Object.values(ECOSYSTEM_CONFIGS).map((eco) => (
              <option key={eco.id} value={eco.id}>{eco.icon} {eco.shortName}</option>
            ))}
          </select>
          {ecosystem !== "all" && (
            <Link href={`/ecosystems/${ecosystem}`} className="text-xs text-blue-600 hover:underline">
              View port →
            </Link>
          )}
          <span className="text-gray-300">|</span>
          {chainOptions.map((opt) => {
            const active = chains.includes(opt.id);
            return (
              <button key={opt.id} onClick={() => setChains((prev) => active ? prev.filter((id) => id !== opt.id) : [...prev, opt.id])}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${active ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
                {opt.name}
              </button>
            );
          })}
          <span className="text-gray-300">|</span>
          {sectorOptions.map((opt) => {
            const active = sectors.includes(opt.id);
            return (
              <button key={opt.id} onClick={() => setSectors((prev) => active ? prev.filter((id) => id !== opt.id) : [...prev, opt.id])}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${active ? "bg-green-100 text-green-700" : "text-gray-500 hover:text-gray-700"}`}>
                {opt.name}
              </button>
            );
          })}
          {(chains.length > 0 || sectors.length > 0 || ecosystem !== "all") && (
            <button onClick={() => { setEcosystem("all"); setChains([]); setSectors([]); }} className="px-2 py-1 rounded text-xs font-medium text-red-500 hover:text-red-700">✕ Clear</button>
          )}
        </div>
      </Card>
      <HybridDashboard
        projects={filteredData}
        loading={loading}
        userProfile={userProfile}
        onProjectClick={(p) => router.push(`/projects/${p.ecosystem}/${p.slug}`)}
      />
    </>
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

  const grouped = useMemo(() => ({
    upcoming: hackathons.filter((h) => h.status === "upcoming"),
    active: hackathons.filter((h) => h.status === "active"),
    completed: hackathons.filter((h) => h.status === "completed"),
  }), [hackathons]);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  if (error) return <Card className="p-8 text-center"><p className="text-red-600">⚠️ {error}</p></Card>;

  const empty = !grouped.upcoming.length && !grouped.active.length && !grouped.completed.length;

  return (
    <>
      <div className="flex gap-1 bg-white rounded-lg p-1 border w-fit mb-6">
        {["all", "upcoming", "active", "completed"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {empty ? (
        <div className="text-center py-16">
          <TrophyIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hackathons found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Hackathon data is loaded from the platform database. Check back soon or submit your hackathon project!
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 rounded-lg text-sm">
            <span>🏆</span>
            <span className="text-teal-700 dark:text-teal-300 font-medium">Currently building for: Arc Nano Payments Hackathon</span>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { key: "active", title: "Active", icon: <UsersIcon className="h-5 w-5 text-green-600" />, bg: "bg-green-50" },
            { key: "upcoming", title: "Upcoming", icon: <CalendarIcon className="h-5 w-5 text-blue-600" />, bg: "bg-blue-50" },
            { key: "completed", title: "Completed", icon: <TrophyIcon className="h-5 w-5 text-yellow-600" />, bg: "bg-yellow-50" },
          ].map(({ key, title, icon, bg }) =>
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
                          {new Date(h.startDate).toLocaleDateString()} – {new Date(h.endDate).toLocaleDateString()}
                        </p>
                        {h.prizePool && <p className="text-sm font-medium text-gray-900 mt-2">${h.prizePool.toLocaleString()} in prizes</p>}
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
