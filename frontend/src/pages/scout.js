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

import React from "react";
import Head from "next/head";
import { useUser } from "@/stores/authStore";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { trackEvent } from "@/lib/analytics";
import useScoutRuns from "@/hooks/useScoutRuns";
import useCopyScout from "@/hooks/useCopyScout";
import {
  ScoutHeader,
  PortfolioStats,
  ReasoningTraces,
  RecentSettlements,
  PredictionMarketPreview,
  ActivityFeed,
  CopyScoutModal,
} from "@/components/scout";

const SHARE_TEXT = (stats) =>
  `Proof Scout has evaluated ${stats.totalEvaluated} projects and executed ${stats.totalBacked} backings on Arc. Copy the agent:`;
const SHARE_URL = (typeof window !== "undefined" ? window.location.href : "https://proofofship.app/scout");

export default function ScoutPortfolioPage() {
  const { currentUser } = useUser();
  const { runs, loading, stats, reasoningTraces, recentExecutions } = useScoutRuns();
  const copy = useCopyScout(currentUser);

  const handleShare = () => {
    trackEvent("scout_portfolio_shared", { user: currentUser?.uid || "anonymous" });
    const text = SHARE_TEXT(stats);
    const url = SHARE_URL;
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
        <ScoutHeader subscribed={copy.subscribed} onShare={handleShare} onCopy={copy.openModal} />

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <PortfolioStats stats={stats} />
              <ReasoningTraces traces={reasoningTraces} />
              <RecentSettlements executions={recentExecutions} />
              <PredictionMarketPreview traces={reasoningTraces} />
              <ActivityFeed runs={runs} />
            </>
          )}
        </div>
      </div>

      {copy.modalOpen && (
        <CopyScoutModal
          onClose={copy.closeModal}
          onConfirm={copy.subscribe}
          loading={copy.loading}
        />
      )}
    </>
  );
}
