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
import { LoadingSpinner } from "@/components/common/LoadingStates";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NETWORK_CONFIGS } from "@/config/networks";
import {
  CalendarIcon,
  TrophyIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

export default function ExplorePage() {
  const router = useRouter();
  const tab = router.query.tab || "projects";

  const setTab = (t) => {
    router.replace({ pathname: router.pathname, query: t === "projects" ? {} : { tab: t } }, undefined, { shallow: true });
  };

  return (
    <ErrorBoundary name="ExplorePage" errorMessage="Failed to load. Please refresh.">
      <Head>
        <title>Explore | Builder Credit</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Tab switcher */}
          <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 border w-fit">
            {["projects", "hackathons"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

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

  useEffect(() => {
    const { ecosystem: ecoQ, chains: chainsQ, sectors: sectorsQ } = router.query || {};
    if (ecoQ && ["celo", "base", "linea", "all"].includes(ecoQ)) setEcosystem(String(ecoQ));
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
    ecos.forEach((eco) => {
      const list = projectData[eco] || [];
      result[eco] = list.filter((p) => {
        if (chains.length > 0 && (!p.chains || !p.chains.some((c) => chains.includes(c)))) return false;
        if (sectors.length > 0 && (!p.sectors || !p.sectors.some((s) => sectors.includes(s)))) return false;
        return true;
      });
    });
    return result;
  }, [projectData, ecosystem, chains, sectors]);

  const chainOptions = useMemo(() => {
    const shortNames = { 44787: "Celo", 59141: "Linea", 84532: "Base", 421614: "Arbitrum", 11155111: "Ethereum", 11155420: "Optimism" };
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

  return (
    <>
      <Card className="p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <select value={ecosystem} onChange={(e) => setEcosystem(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-xs font-medium">
            <option value="all">All Ecosystems</option>
            <option value="celo">Celo</option>
            <option value="base">Base</option>
            <option value="linea">Linea</option>
          </select>
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

  const grouped = {
    upcoming: hackathons.filter((h) => h.status === "upcoming"),
    active: hackathons.filter((h) => h.status === "active"),
    completed: hackathons.filter((h) => h.status === "completed"),
  };

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
        <div className="text-center py-16 text-gray-500">No hackathons found.</div>
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
