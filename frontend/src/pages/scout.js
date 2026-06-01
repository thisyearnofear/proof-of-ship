/**
 * Proof Scout Portfolio Page
 *
 * Displays the autonomous scout agent's public portfolio:
 * - Current positions (backed projects)
 * - PnL and win rate
 * - Recent reasoning traces
 * - "Copy Scout" CTA for social trading
 *
 * Routes: /scout
 */

import React, { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { useUser } from "@/stores/authStore";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { trackEvent } from "@/lib/analytics";
import {
  CpuChipIcon,
  ChartBarIcon,
  TrophyIcon,
  BanknotesIcon,
  BoltIcon,
  ArrowTopRightOnSquareIcon,
  LightBulbIcon,
  ShareIcon,
  CheckCircleIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

function useAgentRuns() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "agent_runs"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newRuns = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRuns(newRuns);
      setLoading(false);
    }, (error) => {
      console.warn('Agent runs feed unavailable:', error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { runs, loading };
}

function computePortfolioStats(runs) {
  const executions = runs.filter((r) => r.type === "execution");
  const scouts = runs.filter((r) => r.type === "scout");

  const totalBacked = executions.reduce((s, r) => s + (r.totalBacked || 0), 0);
  const totalStaked = executions.reduce((s, r) => s + (r.totalStaked || 0), 0);
  const totalFailed = executions.reduce((s, r) => s + (r.totalFailed || 0), 0);
  const totalEvaluated = scouts.reduce((s, r) => s + (r.projectsEvaluated || 0), 0);

  const winRate = totalBacked + totalFailed > 0
    ? Math.round((totalBacked / (totalBacked + totalFailed)) * 100)
    : 0;

  return { totalBacked, totalStaked, totalFailed, totalEvaluated, winRate };
}

export default function ScoutPortfolioPage() {
  const { currentUser } = useUser();
  const { runs, loading } = useAgentRuns();
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [subStatus, setSubStatus] = useState(null);
  const [subLoading, setSubLoading] = useState(false);

  const stats = useMemo(() => computePortfolioStats(runs), [runs]);

  // Fetch subscription status
  useEffect(() => {
    if (!currentUser) return;
    fetch("/api/agent/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", userId: currentUser.uid }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSubStatus(data);
      })
      .catch(() => {});
  }, [currentUser]);

  const handleSubscribe = async () => {
    if (!currentUser) {
      alert("Please sign in to copy the Scout.");
      return;
    }
    setSubLoading(true);
    try {
      const res = await fetch("/api/agent/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", userId: currentUser.uid }),
      });
      const data = await res.json();
      if (data.success) {
        setSubStatus({ subscribed: true, status: "active" });
        trackEvent("copy_scout_subscribed", { user: currentUser.uid });
      }
    } catch (e) {
      console.error("Subscribe failed:", e);
    } finally {
      setSubLoading(false);
      setCopyModalOpen(false);
    }
  };

  // Recent reasoning traces from scout runs
  const reasoningTraces = useMemo(() => {
    const traces = [];
    for (const run of runs) {
      if (run.reasoningTrace && Array.isArray(run.reasoningTrace)) {
        for (const t of run.reasoningTrace) {
          traces.push({
            runId: run.id,
            timestamp: run.timestamp,
            project: t.project,
            trace: t.trace,
          });
        }
      } else if (run.reasoningTrace) {
        traces.push({
          runId: run.id,
          timestamp: run.timestamp,
          project: "Scout Analysis",
          trace: typeof run.reasoningTrace === "string" ? run.reasoningTrace : JSON.stringify(run.reasoningTrace, null, 2),
        });
      }
    }
    return traces.slice(0, 10);
  }, [runs]);

  // Recent executions
  const recentExecutions = useMemo(() => {
    return runs
      .filter((r) => r.type === "execution")
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        timestamp: r.timestamp,
        backed: r.totalBacked || 0,
        failed: r.totalFailed || 0,
        staked: r.totalStaked || 0,
        txHashes: (r.transactions || []).filter((t) => t.status === "success").map((t) => t.txHash),
      }));
  }, [runs]);

  const handleCopyScout = () => {
    trackEvent("copy_scout_clicked", { user: currentUser?.uid || "anonymous" });
    setCopyModalOpen(true);
  };

  const handleShare = () => {
    trackEvent("scout_portfolio_shared", { user: currentUser?.uid || "anonymous" });
    const text = `Proof Scout has evaluated ${stats.totalEvaluated} projects and executed ${stats.totalBacked} backings on Arc. Copy the agent:`;
    const url = typeof window !== "undefined" ? window.location.href : "https://proofofship.app/scout";
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      <Head>
        <title>Proof Scout — Autonomous Agent Portfolio</title>
        <meta name="description" content="Follow the Proof Scout AI agent. Real-time project evaluation, on-chain backing execution, and transparent reasoning traces." />
        <meta property="og:title" content="Proof Scout — Autonomous Agent Portfolio" />
        <meta property="og:description" content="AI agent that evaluates and backs blockchain projects on Arc. Copy-trade its portfolio." />
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* Hero */}
        <div className="bg-gradient-to-b from-indigo-900/20 to-slate-950 border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative">
                    <CpuChipIcon className="w-8 h-8 text-cyan-400 dark:text-cyan-500" />
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse border-2 border-slate-900" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-cyan-400 dark:text-cyan-500">Autonomous Agent</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Proof Scout</h1>
                <p className="text-slate-400 dark:text-slate-500 max-w-xl">
                  An AI agent that continuously evaluates builder projects, generates reasoning traces, and executes backings on Arc with USDC. Every decision is transparent and on-chain.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="text-xs"
                >
                  <ShareIcon className="w-3.5 h-3.5 mr-1" />
                  Share
                </Button>
                {subStatus?.subscribed ? (
                  <Button
                    disabled
                    className="bg-emerald-600 text-white text-xs opacity-80 cursor-default"
                  >
                    <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                    Copying Scout
                  </Button>
                ) : (
                  <Button
                    onClick={handleCopyScout}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs"
                  >
                    <BoltIcon className="w-3.5 h-3.5 mr-1" />
                    Copy Scout
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          {/* Stats */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-800 p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Projects Evaluated</div>
                  <div className="text-2xl font-bold text-white">{stats.totalEvaluated}</div>
                </Card>
                <Card className="bg-slate-900 border-slate-800 p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Backings Executed</div>
                  <div className="text-2xl font-bold text-emerald-400">{stats.totalBacked}</div>
                </Card>
                <Card className="bg-slate-900 border-slate-800 p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Staked</div>
                  <div className="text-2xl font-bold text-cyan-400 dark:text-cyan-500">${stats.totalStaked.toFixed(2)}</div>
                </Card>
                <Card className="bg-slate-900 border-slate-800 p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Success Rate</div>
                  <div className="text-2xl font-bold text-amber-400">{stats.winRate}%</div>
                </Card>
              </div>

              {/* Reasoning Traces */}
              {reasoningTraces.length > 0 && (
                <section>
                  <h2 className="text-sm font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <LightBulbIcon className="w-4 h-4 text-amber-400" />
                    Latest Reasoning Traces
                  </h2>
                  <div className="space-y-3">
                    {reasoningTraces.map((t, idx) => (
                      <Link key={`${t.runId}-${idx}`} href={`/scout/trace/${t.runId}`} className="block">
                        <Card className="bg-slate-900 border-slate-800 p-4 hover:border-cyan-500/30 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-400">
                              {t.project}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {t.timestamp ? new Date(t.timestamp).toLocaleString() : ""}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 dark:text-slate-500 leading-relaxed line-clamp-3">{t.trace}</p>
                          <div className="mt-2 text-[10px] text-cyan-400 dark:text-cyan-500 hover:underline">View full trace →</div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Recent On-Chain Executions */}
              {recentExecutions.length > 0 && (
                <section>
                  <h2 className="text-sm font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BanknotesIcon className="w-4 h-4 text-emerald-400" />
                    Recent Arc Settlements
                  </h2>
                  <div className="space-y-2">
                    {recentExecutions.map((exec) => (
                      <Card key={exec.id} className="bg-slate-900 border-slate-800 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-900/30 rounded-lg flex items-center justify-center">
                            <TrophyIcon className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-200">
                              {exec.backed} backing{exec.backed !== 1 ? "s" : ""} · ${exec.staked.toFixed(2)} USDC
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {exec.timestamp ? new Date(exec.timestamp).toLocaleString() : ""}
                            </div>
                          </div>
                        </div>
                        {exec.txHashes?.[0] && (
                          <a
                            href={`https://explorer.arc.network/tx/${exec.txHashes[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-cyan-400 dark:text-cyan-500 hover:underline flex items-center gap-1"
                          >
                            View <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                          </a>
                        )}
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Prediction Market Preview */}
              <section>
                <h2 className="text-sm font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <GlobeAltIcon className="w-4 h-4 text-pink-400 dark:text-pink-500" />
                  Prediction Market Preview
                </h2>
                <Card className="bg-gradient-to-br from-pink-900/20 to-slate-900 border-pink-500/20 p-5">
                  <p className="text-sm text-slate-300 dark:text-slate-500 mb-4">
                    The Payout Verifier agent can serve as an oracle for prediction markets. When the verifier attests a project shipped, the market resolves automatically.
                  </p>
                  <div className="space-y-3">
                    {reasoningTraces.slice(0, 2).map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-200 truncate">
                            Will {t.project} ship by June 1?
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Resolved by Verifier agent on Arc
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-[10px] text-emerald-400">Yes 72%</div>
                            <div className="text-[10px] text-rose-400">No 28%</div>
                          </div>
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '72%' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {reasoningTraces.length === 0 && (
                      <div className="text-sm text-slate-400 dark:text-slate-500 italic">
                        Run the Scout to generate prediction markets for top projects.
                      </div>
                    )}
                  </div>
                    <div className="mt-3 text-[10px] text-pink-300/80 text-center">
                      Coming soon — USDC markets on Arc with verifier oracle resolution
                    </div>
                </Card>
              </section>

              {/* Live Activity */}
              <section>
                <h2 className="text-sm font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4 text-cyan-400 dark:text-cyan-500" />
                  Agent Activity Feed
                </h2>
                <div className="space-y-2">
                  {runs.slice(0, 10).map((run) => (
                    <Card key={run.id} className="bg-slate-900 border-slate-800 p-3 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        run.type === "execution" ? "bg-emerald-500" :
                        run.type === "scout" ? "bg-purple-500" :
                        run.type === "underwrite" ? "bg-blue-500" :
                        "bg-slate-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-300 dark:text-slate-500 truncate">
                          {run.type === "execution" ? `Executed ${run.totalBacked || 0} backings` :
                           run.type === "scout" ? `Evaluated ${run.projectsEvaluated || 0} projects, recommended ${run.projectsBacked || 0}` :
                           run.type === "underwrite" ? `Analyzed ${run.project?.name || "project"}` :
                           "Agent run"}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {run.timestamp ? new Date(run.timestamp).toLocaleString() : ""}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 hidden sm:inline">{run.id}</span>
                    </Card>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {/* Copy Scout Modal */}
      {copyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-700 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white mb-2">Copy the Scout</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
              When you copy the Scout, your wallet automatically backs the same projects the agent recommends. You keep full custody — the agent just signals, your wallet executes.
            </p>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-300 dark:text-slate-500">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                <span>Deposit USDC into your copy-trade balance</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300 dark:text-slate-500">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                <span>Auto-back every project the scout recommends</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300 dark:text-slate-500">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                <span>1% agent fee on each fill (paid to Scout)</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setCopyModalOpen(false)}
                variant="outline"
                className="flex-1 text-xs"
              >
                Close
              </Button>
              <Button
                onClick={handleSubscribe}
                disabled={subLoading}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white text-xs"
              >
                {subLoading ? "Subscribing..." : "Start Copying"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

