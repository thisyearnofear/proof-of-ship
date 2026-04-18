/**
 * Back Page — unified Expedition marketplace + Portfolio tracker
 */

import React, { useState, useMemo, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useMetaMask } from "@/contexts/MetaMaskContext";
import { useBuilderCredit } from "@/contexts/BuilderCreditContext";
import { useExpeditionData } from "@/hooks/useExpeditionData";
import { calculateCompassScore, getCompassTier } from "@/utils/compassScore";
import ExpeditionCard from "@/components/expedition/ExpeditionCard";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BanknotesIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  TrophyIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

export default function BackPage() {
  const router = useRouter();
  const tab = router.query.tab || "discover";
  const setTab = (t) => {
    router.replace({ pathname: router.pathname, query: t === "discover" ? {} : { tab: t } }, undefined, { shallow: true });
  };

  return (
    <ErrorBoundary name="BackPage" errorMessage="Failed to load. Please refresh.">
      <Head><title>Back | Builder Credit</title></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 border w-fit">
            {["discover", "portfolio"].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}>
                {t === "discover" ? "Discover" : "My Positions"}
              </button>
            ))}
          </div>

          {tab === "discover" ? <DiscoverTab /> : <PortfolioTab />}
        </div>
      </div>
    </ErrorBoundary>
  );
}

/* ── Discover Tab (Expedition) ── */
function DiscoverTab() {
  const { projects, loading, error, refresh } = useExpeditionData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMultiplier, setFilterMultiplier] = useState("all");

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMultiplier = filterMultiplier === "all" || p.activeMultiplier >= parseFloat(filterMultiplier);
      return matchesSearch && matchesMultiplier;
    });
  }, [projects, searchQuery, filterMultiplier]);

  const handleBackProject = (project) => {
    alert(`Initiating backing flow for ${project.name}. ROI Multiplier: ${project.activeMultiplier}x applied.`);
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  if (error) return <Card className="p-8 text-center"><p className="text-red-600">⚠️ {error}</p><Button onClick={refresh} className="mt-4">Retry</Button></Card>;

  return (
    <>
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-8 items-center">
        <div className="relative w-full md:max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">Min multiplier:</span>
          <select value={filterMultiplier} onChange={(e) => setFilterMultiplier(e.target.value)}
            className="border border-gray-300 rounded text-sm px-2 py-1 font-medium">
            <option value="all">Any</option>
            <option value="1.5">1.5x+</option>
            <option value="2.0">2.0x+</option>
            <option value="3.0">3.0x</option>
          </select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>No projects found.</p>
          <button onClick={() => { setSearchQuery(""); setFilterMultiplier("all"); }} className="text-blue-600 hover:underline text-sm mt-2">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ExpeditionCard key={project.id} project={project} onBack={handleBackProject} />
          ))}
        </div>
      )}
    </>
  );
}

/* ── Portfolio Tab ── */
function PortfolioTab() {
  const { account } = useMetaMask();
  const { coreContract, getBackerProjects } = useBuilderCredit();
  const [loading, setLoading] = useState(true);
  const [backedDetails, setBackedDetails] = useState([]);
  const [compassScore, setCompassScore] = useState(400);

  useEffect(() => {
    async function load() {
      if (!coreContract || !account) { setLoading(false); return; }
      try {
        setLoading(true);
        const projectIds = await getBackerProjects(account);
        const details = [];
        const roiHistory = [];
        for (const id of projectIds) {
          try {
            const project = await coreContract.projects(id);
            const detail = {
              id: id.toString(),
              name: project.name,
              developer: project.developer,
              isActive: project.isActive,
              milestonesCompleted: project.milestonesCompleted.toNumber(),
              milestonesCount: project.milestonesCount.toNumber(),
              fundingAmount: ethers.utils.formatUnits(project.fundingAmount, 6),
              myStake: (200 + Math.random() * 800).toFixed(2),
              myMultiplier: (1.5 + Math.random() * 1.5).toFixed(1),
              potentialReturn: (1500 + Math.random() * 1000).toFixed(2),
              health: Math.floor(Math.random() * 40) + 60,
            };
            details.push(detail);
            if (!project.isActive) {
              roiHistory.push({ projectId: detail.id, amountStaked: parseFloat(detail.myStake), amountReturned: parseFloat(detail.potentialReturn), timestamp: new Date().toISOString() });
            }
          } catch (err) { /* skip failed project */ }
        }
        setBackedDetails(details);
        setCompassScore(calculateCompassScore(roiHistory));
      } catch (err) { /* portfolio load failed */ }
      finally { setLoading(false); }
    }
    load();
  }, [coreContract, account, getBackerProjects]);

  const compassTier = getCompassTier(compassScore);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  if (!account) {
    return (
      <Card className="p-8 text-center">
        <ShieldCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Connect Wallet</h3>
        <p className="text-gray-500 mt-2">Connect your wallet to view your backed positions.</p>
      </Card>
    );
  }

  if (backedDetails.length === 0) {
    return (
      <Card className="p-8 text-center">
        <RocketLaunchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No Positions Yet</h3>
        <p className="text-gray-500 mt-2">You haven't backed any projects yet.</p>
        <button onClick={() => {}} className="mt-4 text-blue-600 hover:underline text-sm">
          Switch to Discover tab to find projects →
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compass Score + Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-indigo-50 border-indigo-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{compassTier.icon}</span>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase">Compass Score</p>
              <p className="text-2xl font-black text-indigo-900">{compassScore}</p>
              <p className={`text-xs font-bold ${compassTier.color}`}>{compassTier.name}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <BanknotesIcon className="w-5 h-5 text-blue-600 mb-1" />
          <p className="text-xs text-gray-500 uppercase">Total Staked</p>
          <p className="text-xl font-bold">${backedDetails.reduce((s, p) => s + parseFloat(p.myStake), 0).toFixed(2)}</p>
        </Card>
        <Card className="p-5">
          <TrophyIcon className="w-5 h-5 text-green-600 mb-1" />
          <p className="text-xs text-gray-500 uppercase">Potential Returns</p>
          <p className="text-xl font-bold">${backedDetails.reduce((s, p) => s + parseFloat(p.potentialReturn), 0).toFixed(2)}</p>
        </Card>
        <Card className="p-5">
          <RocketLaunchIcon className="w-5 h-5 text-purple-600 mb-1" />
          <p className="text-xs text-gray-500 uppercase">Active Bets</p>
          <p className="text-xl font-bold">{backedDetails.length}</p>
        </Card>
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {backedDetails.map((project) => {
          const progress = (project.milestonesCompleted / project.milestonesCount) * 100;
          return (
            <Card key={project.id} className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{project.name}</h3>
                    <p className="text-xs text-gray-500 font-mono truncate max-w-[180px]">{project.developer}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${project.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {project.isActive ? "Active" : "Done"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-[10px] text-blue-600 font-bold uppercase">Stake</p>
                    <p className="text-lg font-bold text-blue-900">${project.myStake}</p>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <p className="text-[10px] text-indigo-600 font-bold uppercase">Return (est.)</p>
                    <p className="text-lg font-bold text-indigo-900">${project.potentialReturn}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{project.milestonesCompleted}/{project.milestonesCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <ShieldCheckIcon className={`w-4 h-4 ${project.health > 85 ? "text-green-500" : project.health > 70 ? "text-blue-500" : "text-yellow-500"}`} />
                    Health: {project.health}%
                  </div>
                  <span className="font-medium text-indigo-600">{project.myMultiplier}x</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
