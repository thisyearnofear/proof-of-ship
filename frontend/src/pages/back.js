/**
 * Back Page — unified Expedition marketplace + Portfolio tracker
 */

import React, { useState, useMemo, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useWallet } from "@/contexts/WalletContext";
import { useBuilderCredit } from "@/contexts/WalletContext";
import { useExpeditionData } from "@/hooks/useExpeditionData";
import { useNanopayment } from "@/contexts/WalletContext";
import { calculateCompassScore, getCompassTier } from "@/utils/compassScore";
import ExpeditionCard from "@/components/expedition/ExpeditionCard";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import TabBar from "@/components/common/TabBar";
import NanopaymentWidget from "@/components/common/NanopaymentWidget";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import ErrorBoundary from "@/components/ErrorBoundary";
import TransactionFeed from "@/components/common/TransactionFeed";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BanknotesIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  TrophyIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function BackPage() {
  const router = useRouter();
  const tab = router.query.tab || "discover";
  const setTab = (t) => {
    router.replace({ pathname: router.pathname, query: t === "discover" ? {} : { tab: t } }, undefined, { shallow: true });
  };

  const tabs = [
    { id: 'discover', label: 'Discover' },
    { id: 'portfolio', label: 'My Positions' },
    { id: 'economy', label: 'Economy' },
  ];

  return (
    <ErrorBoundary name="BackPage" errorMessage="Failed to load. Please refresh.">
      <Head><title>Back | Builder Credit</title></Head>
      <div className="min-h-screen bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <TabBar
            tabs={tabs}
            activeTab={tab}
            onChange={setTab}
            variant="pill"
            className="mb-6"
          />

          {tab === "discover" ? <DiscoverTab /> : tab === "portfolio" ? <PortfolioTab setTab={setTab} /> : <EconomyTab />}
        </div>
      </div>
    </ErrorBoundary>
  );
}

/* ── Discover Tab (Expedition) ── */
function DiscoverTab() {
  const { projects, loading, error, refresh } = useExpeditionData();
  const { connected, connect } = useWallet();
  const { backProject } = useBuilderCredit();
  const { payForScout, agentPrices, loading: nanopaymentLoading } = useNanopayment();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMultiplier, setFilterMultiplier] = useState("all");
  const [backingProject, setBackingProject] = useState(null);
  const [backingAmount, setBackingAmount] = useState("");
  const [backingMultiplier, setBackingMultiplier] = useState("150");
  const [backingStatus, setBackingStatus] = useState(null);
  const [backingError, setBackingError] = useState(null);
  const [scoutData, setScoutData] = useState(null);
  const [scouting, setScouting] = useState(false);

  const runAIScout = async () => {
    setScouting(true);
    try {
      const result = await payForScout();
      if (result.success) {
        setScoutData(result.data);
      }
    } catch (err) {
      console.error("Scout failed:", err);
    } finally {
      setScouting(false);
    }
  };

  useEffect(() => {
    fetch("/api/agent/scout", {
      headers: { "x-demo-key": "demo" }
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data?.success && setScoutData(data))
      .catch(() => {});
  }, []);

  // Helper: check if a project was AI-backed
  const getScoutScore = (projectId) => {
    if (!scoutData?.projects) return null;
    return scoutData.projects.find((p) => p.id === projectId || p.slug === projectId);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMultiplier = filterMultiplier === "all" || p.activeMultiplier >= parseFloat(filterMultiplier);
      return matchesSearch && matchesMultiplier;
    });
  }, [projects, searchQuery, filterMultiplier]);

  const handleBackProject = (project) => {
    if (!connected) { connect(); return; }
    setBackingProject(project);
    setBackingAmount("");
    setBackingMultiplier("150");
    setBackingStatus(null);
    setBackingError(null);
  };

  const submitBacking = async () => {
    if (!backingProject || !backingAmount || parseFloat(backingAmount) <= 0) return;
    try {
      setBackingStatus("pending");
      setBackingError(null);
      await backProject(backingProject.id, parseInt(backingMultiplier), parseFloat(backingAmount));
      setBackingStatus("success");
      refresh();
    } catch (err) {
      setBackingStatus("error");
      setBackingError(err.message || "Transaction failed");
    }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  if (error) return <Card className="p-8 text-center"><p className="text-red-600">⚠️ {error}</p><Button onClick={refresh} className="mt-4">Retry</Button></Card>;

  return (
    <>
      {/* AI Scout Banner with Nanopayment */}
      <Card className="p-3 mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔭</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-indigo-900">AI Scout</span>
                {scoutData && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    {scoutData.summary.recommended} recommended
                  </span>
                )}
              </div>
              <span className="text-xs text-indigo-600">
                {scoutData 
                  ? `evaluated ${scoutData.summary.evaluated} projects · ${scoutData.summary.totalStake}`
                  : `0.01 USDC per scan · powered by Circle Nanopayments`
                }
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={runAIScout}
            disabled={scouting}
            className="flex items-center gap-2"
          >
            {scouting ? (
              <>
                <LoadingSpinner size="sm" />
                Scanning...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Run Scout · $0.01
              </>
            )}
          </Button>
        </div>
      </Card>

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
            <ExpeditionCard key={project.id} project={project} onBack={handleBackProject} scoutScore={getScoutScore(project.id || project.slug)} />
          ))}
        </div>
      )}

      {/* Backing Modal */}
      {backingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !backingStatus && setBackingProject(null)}>
          <Card className="w-full max-w-md p-6 bg-white" onClick={(e) => e.stopPropagation()}>
            {backingStatus === "success" ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">✅</p>
                <p className="font-bold text-green-700">Backed successfully!</p>
                <p className="text-sm text-gray-500 mt-1">{backingAmount} USDC at {parseInt(backingMultiplier) / 100}x on {backingProject.name}</p>
                <button onClick={() => setBackingProject(null)} className="mt-4 text-sm text-blue-600 hover:underline">Close</button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Back {backingProject.name}</h3>
                <p className="text-sm text-gray-500 mb-4">Stake USDC with a multiplier. Returns paid when milestones complete.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USDC)</label>
                    <input type="number" min="1" step="1" value={backingAmount} onChange={(e) => setBackingAmount(e.target.value)}
                      placeholder="100" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Multiplier</label>
                    <div className="flex gap-2">
                      {[{ v: "150", l: "1.5x" }, { v: "200", l: "2x" }, { v: "300", l: "3x" }].map(({ v, l }) => (
                        <button key={v} onClick={() => setBackingMultiplier(v)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                            backingMultiplier === v ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}>{l}</button>
                      ))}
                    </div>
                  </div>

                  {backingAmount && parseFloat(backingAmount) > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 text-sm">
                      <span className="text-gray-600">Potential return: </span>
                      <span className="font-bold text-green-700">
                        ${(parseFloat(backingAmount) * parseInt(backingMultiplier) / 100).toFixed(2)} USDC
                      </span>
                    </div>
                  )}

                  {backingError && <p className="text-sm text-red-600">{backingError}</p>}

                  <div className="flex gap-2">
                    <button onClick={() => setBackingProject(null)} disabled={backingStatus === "pending"}
                      className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50">Cancel</button>
                    <button onClick={submitBacking} disabled={!backingAmount || parseFloat(backingAmount) <= 0 || backingStatus === "pending"}
                      className="flex-1 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                      {backingStatus === "pending" ? "Confirming..." : "Confirm Backing"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

/* ── Portfolio Tab ── */
function PortfolioTab({ setTab }) {
  const wallet = useWallet();
  const { getBackerProjects, chainId, signer } = useBuilderCredit();
  const [loading, setLoading] = useState(true);
  const [backedDetails, setBackedDetails] = useState([]);
  const [compassScore, setCompassScore] = useState(400);

  // Load portfolio when wallet changes
  useEffect(() => {
    async function load() {
      if (!wallet.account || !signer || typeof chainId !== 'number') {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const projectIds = await getBackerProjects(wallet.account);
        
        if (!projectIds || projectIds.length === 0) {
          setBackedDetails([]);
          setCompassScore(400);
          setLoading(false);
          return;
        }
        
        // Get contracts to read on-chain data
        const { creditService } = await import('@/services/creditService');
        const contracts = creditService.getContracts(chainId, signer);
        if (!contracts) {
          setLoading(false);
          return;
        }
        
        const details = [];
        const roiHistory = [];
        for (const id of projectIds) {
          try {
            const project = await contracts.core.projects(id);
            // Read this backer's actual backing from the contract
            const backings = [];
            let idx = 0;
            try {
              while (true) {
                const b = await contracts.core.projectBackings(id, idx);
                backings.push(b);
                idx++;
              }
            } catch (e) { /* end of array */ }

            const myBacking = backings.find(
              (b) => b.backer.toLowerCase() === wallet.account?.toLowerCase()
            );
            const stakeAmount = myBacking
              ? parseFloat(ethers.utils.formatUnits(myBacking.amount, 6))
              : 0;
            const multiplier = myBacking
              ? myBacking.multiplier.toNumber() / 100
              : 0;

            const detail = {
              id: id.toString(),
              name: project.name,
              developer: project.developer,
              isActive: project.isActive,
              milestonesCompleted: project.milestonesCompleted.toNumber(),
              milestonesCount: project.milestonesCount.toNumber(),
              fundingAmount: ethers.utils.formatUnits(project.fundingAmount, 6),
              myStake: stakeAmount.toFixed(2),
              myMultiplier: multiplier.toFixed(1),
              potentialReturn: (stakeAmount * multiplier).toFixed(2),
              claimed: myBacking?.claimed || false,
            };
            details.push(detail);
            if (!project.isActive && stakeAmount > 0) {
              roiHistory.push({ projectId: detail.id, amountStaked: stakeAmount, amountReturned: parseFloat(detail.potentialReturn), timestamp: new Date().toISOString() });
            }
          } catch (err) { /* skip failed project */ }
        }
        setBackedDetails(details);
        setCompassScore(calculateCompassScore(roiHistory));
      } catch (err) { /* portfolio load failed */ }
      finally { setLoading(false); }
    }
    load();
  }, [wallet.account, signer, chainId, getBackerProjects]);

  const compassTier = getCompassTier(compassScore);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  if (!wallet.account) {
    return (
      <Card className="p-8 text-center">
        <ShieldCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Connect Wallet</h3>
        <p className="text-gray-500 mt-2">Connect your wallet to view your backed positions.</p>
        <Button onClick={() => wallet.connect()} className="mt-4">Connect Wallet</Button>
      </Card>
    );
  }

  if (backedDetails.length === 0) {
    return (
      <Card className="p-8 text-center">
        <RocketLaunchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No Positions Yet</h3>
        <p className="text-gray-500 mt-2">You haven&apos;t backed any projects yet.</p>
        <Button onClick={() => setTab('discover')} variant="primary" className="mt-4">
          Discover Projects to Back
        </Button>
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
                  <span className={`font-medium ${project.claimed ? "text-green-600" : "text-gray-500"}`}>
                    {project.claimed ? "✓ Claimed" : "Pending"}
                  </span>
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

/* ── Economy Tab (Agentic Economy) ── */
function EconomyTab() {
  return (
    <div className="space-y-6">
      {/* Explainer */}
      <Card className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Agentic Economy</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Pay-per-query AI analysis powered by x402 nanopayments on Circle&apos;s Arc L2. Each agent call costs fractions of a cent — settled instantly in USDC.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '🔭', name: 'AI Scout', cost: '$0.01', desc: 'Scans all projects, recommends micro-backings' },
            { icon: '📊', name: 'AI Underwriter', cost: '$0.05', desc: 'Deep project health score with AI analysis' },
            { icon: '✅', name: 'AI Verifier', cost: '$0.01', desc: 'Automated PR code review and milestone verification' },
          ].map((agent) => (
            <div key={agent.name} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{agent.icon}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{agent.name}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{agent.desc}</p>
              <span className="text-xs font-bold text-teal-600">{agent.cost} USDC</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">💳 Agent Dashboard</h3>
          <NanopaymentWidget compact={false} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">📜 Transaction History</h3>
          <TransactionFeed maxItems={15} />
        </div>
      </div>

      {/* How it works */}
      <Card className="p-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          User → 402 Payment Required → Circle Gateway settles USDC on Arc → AI Agent returns results → Agent pays AIsa for AI inference
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Zero gas fees · Sub-second settlement · Powered by Circle</p>
      </Card>
    </div>
  );
}
