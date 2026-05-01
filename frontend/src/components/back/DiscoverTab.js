import React, { useState, useMemo, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useBuilderCredit } from "@/contexts/WalletContext";
import { useNanopayment } from "@/contexts/WalletContext";
import { useExpeditionData } from "@/hooks/useExpeditionData";
import ExpeditionCard from "@/components/expedition/ExpeditionCard";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function DiscoverTab() {
  const { projects, loading, error, refresh } = useExpeditionData();
  const { connected, connect, account } = useWallet();
  const { backProject } = useBuilderCredit();
  const { payForScout, loading: nanopaymentLoading } = useNanopayment();
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
                {connected && account?.toLowerCase() === backingProject.developer?.toLowerCase() ? (
                  <div className="flex items-center gap-2 mb-4 p-2 bg-green-50 border border-green-100 rounded-lg">
                    <span className="text-lg">💎</span>
                    <div>
                      <p className="text-xs font-bold text-green-800 uppercase">Self-Staking Mode</p>
                      <p className="text-[10px] text-green-600 italic">Your stake provides a reputation boost + 2x credit limit boost.</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">Stake USDC with a multiplier. Returns paid when the builder wins prizes.</p>
                )}

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
