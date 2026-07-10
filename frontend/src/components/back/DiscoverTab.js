import React, { useState, useMemo, useEffect } from "react";
import { useWallet, useNanopayment } from "@/stores/walletStore";
import { useProjectData } from "@/hooks/useProjectData";
import ProjectCard from "@/components/backer/ProjectCard";
import SnsIdentityBadge from "@/components/common/SnsIdentityBadge";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { isValidSolanaAddress } from "@/utils/common";
import { PrivacyBadge } from "@/components/common/PrivacyShield";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import { ECOSYSTEM_FILTER_OPTIONS } from "@/components/explore/constants";

const SORT_OPTIONS = [
  { value: "health", label: "Health" },
  { value: "confidence", label: "Confidence" },
  { value: "multiplier", label: "Multiplier" },
  { value: "newest", label: "Newest" },
];

export default function DiscoverTab() {
  const { projects, loading, error, refresh } = useProjectData();
  const wallet = useWallet();
  const { connected, account } = wallet;

  const { payForScout, loading: nanopaymentLoading, nanopaymentDemoMode } = useNanopayment();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEcosystem, setFilterEcosystem] = useState("all");
  const [filterMultiplier, setFilterMultiplier] = useState("all");
  const [sortBy, setSortBy] = useState("health");
  const [backingProject, setBackingProject] = useState(null);
  const [backingAmount, setBackingAmount] = useState("");
  const [backingMultiplier, setBackingMultiplier] = useState("150");
  const [backingStatus, setBackingStatus] = useState(null);
  const [backingError, setBackingError] = useState(null);
  const [scoutData, setScoutData] = useState(null);
  const [scouting, setScouting] = useState(false);
  const [scoutMessage, setScoutMessage] = useState(null);

  const runAIScout = async () => {
    setScouting(true);
    setScoutMessage(null);
    try {
      const result = await payForScout();
      if (result.success && result.data) {
        setScoutData(result.data);
        setScoutMessage({
          tone: result.data.status === "ok" ? "success" : "warning",
          text: result.data.nextAction || "Scout finished. Review the recommended projects below.",
          detail: `Source: ${result.data.resultSource || 'unknown'} · Payment: ${result.data.agentInfo?.paymentStatus || (result.demoMode ? 'demo' : 'unknown')}`,
        });
      } else {
        setScoutMessage({
          tone: "error",
          text: result.error || result.data?.error || "Scout could not complete this run.",
          detail: result.data?.details || "Try again after checking your payment setup.",
        });
      }
    } catch (err) {
      console.error("Scout failed:", err);
      setScoutMessage({
        tone: "error",
        text: "Scout failed to complete.",
        detail: err.message || "Try again after checking your connection.",
      });
    } finally {
      setScouting(false);
    }
  };

  useEffect(() => {
    fetch("/api/agent/scout", {
      headers: { "x-test-mode": "true" }
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.success || data?.status === "ok") {
          setScoutData(data);
        }
      })
      .catch(() => {});
  }, []);

  const getScoutScore = (projectId) => {
    if (!scoutData?.projects) return null;
    return scoutData.projects.find((p) => p.id === projectId || p.slug === projectId);
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q
        || p.name?.toLowerCase().includes(q)
        || p.description?.toLowerCase().includes(q)
        || p.category?.toLowerCase().includes(q)
        || p.ecosystem?.toLowerCase().includes(q);

      const matchesMultiplier = filterMultiplier === "all"
        || p.activeMultiplier >= parseFloat(filterMultiplier);

      const matchesEcosystem = filterEcosystem === "all"
        || p.ecosystem === filterEcosystem;

      return matchesSearch && matchesMultiplier && matchesEcosystem;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "health":
          return (b.health || 0) - (a.health || 0);
        case "confidence":
          return (b.confidence || 0) - (a.confidence || 0);
        case "multiplier":
          return (b.activeMultiplier || 0) - (a.activeMultiplier || 0);
        case "newest": {
          const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return bDate - aDate;
        }
        default:
          return (b.health || 0) - (a.health || 0);
      }
    });

    return filtered;
  }, [projects, searchQuery, filterMultiplier, filterEcosystem, sortBy]);

  const backingProjectShowsSolName =
    !!backingProject?.developer &&
    (backingProject?.ecosystem === "solana" || isValidSolanaAddress(backingProject.developer));

  const handleBackProject = (project) => {
    if (!connected) { return; }
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
      const { creditService } = await import('@/services/creditService');
      await creditService.backProject(wallet.chainId, wallet.publicClient, wallet.walletClient, backingProject.id, parseInt(backingMultiplier), parseFloat(backingAmount));
      setBackingStatus("success");
      refresh();
    } catch (err) {
      setBackingStatus("error");
      setBackingError(err.message || "Transaction failed");
    }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  if (error) return <Card className="p-8 text-center"><p className="text-red-600 dark:text-red-400">⚠️ {error}</p><Button onClick={refresh} className="mt-4">Retry</Button></Card>;

  return (
    <>
      <Card className="p-4 mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🔭</span>
              <span className="font-medium text-indigo-900">Scout your next project</span>
              {scoutData?.summary && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:text-green-300 rounded-full">
                  {scoutData.summary.recommended} recommended
                </span>
              )}
            </div>
            <p className="text-sm text-indigo-700 max-w-2xl">
              Run one paid scan, review the strongest candidates, then open a project card to decide whether to back it.
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              {scoutData?.summary
                ? `Last scan: ${scoutData.summary.evaluated} projects evaluated · ${scoutData.summary.totalStake}`
                : `Cost: 0.01 USDC per scan · Mode: ${nanopaymentDemoMode ? 'test' : 'live'}`}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={runAIScout}
            disabled={scouting || nanopaymentLoading}
            className="flex items-center gap-2"
          >
            {scouting ? (
              <>
                <LoadingSpinner size="sm" />
                Running scout...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Run Scout · $0.01
              </>
            )}
          </Button>
        </div>

        {scoutMessage && (
          <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            scoutMessage.tone === 'success'
              ? 'border-green-200 bg-green-50 text-green-800 dark:text-green-300'
              : scoutMessage.tone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-red-200 bg-red-50 text-red-800'
          }`}>
            <p className="font-medium">{scoutMessage.text}</p>
            {scoutMessage.detail && <p className="text-xs mt-1 opacity-80">{scoutMessage.detail}</p>}
          </div>
        )}
      </Card>

      <div className="flex flex-col md:flex-row gap-3 mb-6 items-start md:items-center">
        <div className="relative w-full md:max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <select value={filterEcosystem} onChange={(e) => setFilterEcosystem(e.target.value)}
            className="border border-gray-300 rounded text-sm px-2 py-1.5 font-medium bg-white">
            {ECOSYSTEM_FILTER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Min:</span>
          <select value={filterMultiplier} onChange={(e) => setFilterMultiplier(e.target.value)}
            className="border border-gray-300 rounded text-sm px-2 py-1.5 font-medium bg-white">
            <option value="all">Any multiplier</option>
            <option value="1.5">1.5x+</option>
            <option value="2.0">2.0x+</option>
            <option value="3.0">3.0x</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm md:ml-auto">
          <span className="text-gray-500 dark:text-gray-400">Sort:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded text-sm px-2 py-1.5 font-medium bg-white">
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          {filterEcosystem !== 'all' ? ` in ${filterEcosystem}` : ''}
        </p>
        <PrivacyBadge />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-1">No projects match your filters.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
            {projects.length === 0
              ? "Projects need a description, GitHub link, and ecosystem to appear here."
              : "Try broadening your search."}
          </p>
          {projects.length === 0 && (
            <div className="inline-flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200 mb-4">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              When projects appear, your stakes are shielded by default
            </div>
          )}
          <button onClick={() => { setSearchQuery(""); setFilterMultiplier("all"); setFilterEcosystem("all"); }}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onBack={handleBackProject} scoutScore={getScoutScore(project.id || project.slug)} />
          ))}
        </div>
      )}

      {backingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !backingStatus && setBackingProject(null)}>
          <Card className="w-full max-w-md p-6 bg-white" onClick={(e) => e.stopPropagation()}>
            {backingStatus === "success" ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">✅</p>
                <p className="font-bold text-green-700 dark:text-green-300">Backed successfully!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{backingAmount} USDC at {parseInt(backingMultiplier) / 100}x on {backingProject.name}</p>
                <button onClick={() => setBackingProject(null)} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">Close</button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Back {backingProject.name}</h3>
                {backingProjectShowsSolName && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    You&apos;re backing{" "}
                    <SnsIdentityBadge
                      address={backingProject.developer}
                      snsNameOverride={backingProject.builderSnsDomain || null}
                      chainFamily="solana"
                      showFallback={true}
                      showLoading={true}
                      className="text-sm"
                    />{" "}
                    on {backingProject.name}.
                  </p>
                )}
                {connected && account?.toLowerCase() === backingProject.developer?.toLowerCase() ? (
                  <div className="flex items-center gap-2 mb-4 p-2 bg-green-50 border border-green-100 rounded-lg">
                    <span className="text-lg">💎</span>
                    <div>
                      <p className="text-xs font-bold text-green-800 dark:text-green-300 uppercase">Self-Staking Mode</p>
                      <p className="text-[10px] text-green-600 dark:text-green-400 italic">Your stake provides a reputation boost + 2x credit limit boost.</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Stake USDC with a multiplier. Returns paid when the builder wins prizes.</p>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (USDC)</label>
                    <input type="number" min="1" step="1" value={backingAmount} onChange={(e) => setBackingAmount(e.target.value)}
                      placeholder="100" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Multiplier</label>
                    <div className="flex gap-2">
                      {[{ v: "150", l: "1.5x" }, { v: "200", l: "2x" }, { v: "300", l: "3x" }].map(({ v, l }) => (
                        <button key={v} onClick={() => setBackingMultiplier(v)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                            backingMultiplier === v ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                          }`}>{l}</button>
                      ))}
                    </div>
                  </div>

                  {backingAmount && parseFloat(backingAmount) > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Potential return: </span>
                      <span className="font-bold text-green-700 dark:text-green-300">
                        ${(parseFloat(backingAmount) * parseInt(backingMultiplier) / 100).toFixed(2)} USDC
                      </span>
                    </div>
                  )}

                  {backingError && <p className="text-sm text-red-600 dark:text-red-400">{backingError}</p>}

                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-800 dark:text-purple-300">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span className="font-medium">Your stake amount is shielded — other users won&apos;t see your position</span>
                  </div>

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
