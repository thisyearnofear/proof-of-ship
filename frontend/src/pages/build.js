/**
 * Build Page — unified Credit Profile + Dashboard for builders
 */

import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useWallet } from "@/stores/walletStore";
import { useBuilderCredit } from "@/stores/walletStore";
import { useUser } from "@/stores/authStore";
import Link from "next/link";
import { useRouter } from "next/router";

import DeveloperDashboard from "@/components/DeveloperDashboard";
import BuilderProjectGrowth from "@/components/projects/BuilderProjectGrowth";
import FundingInterface from "@/components/FundingInterface";
import CrossChainTransfer from "@/components/CrossChainTransfer";
import TransferHistory from "@/components/TransferHistory";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import ScorePreviewCard from "@/components/common/ScorePreviewCard";
import SnsIdentityBadge from "@/components/common/SnsIdentityBadge";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import TabBar from "@/components/common/TabBar";
import Card from "@/components/common/Card";

export default function BuildPage() {
  const { userRole } = useUser();
  const router = useRouter();
  const wallet = useWallet();
  const builderCredit = useBuilderCredit();
  const [activeTab, setActiveTab] = useState("credit");
  const ref = router.query.ref;

  const isPayoutReferral = ref === "payouts";

  const {
    connected,
    loading: metaMaskLoading,
    activeChainFamily,
    setActiveChainFamily,
    solanaConnected,
    disconnectSolana,
    solanaAddress
  } = wallet;
  const { creditProfile, developerProjects, projectDetails, contractLoading, usdcBalance } = builderCredit;

  // Rail detection — which capital rail is this builder on?
  const doesHaveProjects = Array.isArray(developerProjects) && developerProjects.length > 0;
  const hasBagsToken = false; // Bags SDK not yet wired — defaults to false until integration lands
  const hasHackathonWins = Array.isArray(developerProjects) && developerProjects.some(
    p => Array.isArray(p.hackathons) && p.hackathons.some(h => h.outcome === 'winner' || h.outcome === 'finalist')
  );

  // Auto-detect connected wallet — if Solana is connected and EVM isn't,
  // default to Solana without requiring the user to click the toggle
  useEffect(() => {
    if (solanaConnected && !connected && activeChainFamily !== 'solana') {
      setActiveChainFamily('solana');
    } else if (connected && !solanaConnected && activeChainFamily !== 'evm') {
      setActiveChainFamily('evm');
    }
  }, [solanaConnected, connected, activeChainFamily, setActiveChainFamily]);

  // Backers should be on /back, not /build
  useEffect(() => {
    if (userRole === 'backer') {
      router.replace('/back');
    }
  }, [userRole, router]);

  if (userRole === 'backer') {
    return null; // Redirecting
  }

  const isActuallyConnected = activeChainFamily === 'solana' ? solanaConnected : connected;

  const loading = metaMaskLoading || contractLoading;

  if (!isActuallyConnected) {
    return (
      <>
        <Head><title>Build | Builder Credit</title></Head>
        <div className="py-12 max-w-xl mx-auto px-4 text-center space-y-8">
          <div>
            <div className="flex justify-center mb-6">
              <div className="inline-flex p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setActiveChainFamily('evm')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeChainFamily === 'evm' 
                      ? 'bg-surface text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
                  }`}
                >
                  EVM (Metamask)
                </button>
                <button
                  onClick={() => setActiveChainFamily('solana')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeChainFamily === 'solana' 
                      ? 'bg-surface text-purple-600 dark:text-purple-400 shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Solana
                </button>
              </div>
            </div>

            {isPayoutReferral ? (
              <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 shadow-lg shadow-indigo-200/50">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ) : (
              <ShieldCheckIcon className={`w-16 h-16 mx-auto ${activeChainFamily === 'solana' ? 'text-purple-500 dark:text-purple-400' : 'text-blue-500 dark:text-blue-400'}`} />
            )}
            <h1 className="mt-4 text-2xl font-bold text-primary">
              {isPayoutReferral ? "Get Paid Today, Not in 67 Days" : "Builder Hub"}
            </h1>
            <p className="mt-2 text-secondary">
              {isPayoutReferral
                ? "Proof of Ship advances you USDC against your hackathon prize — so you can keep building while the organizers take their time. No interest, no collateral."
                : `Connect your ${activeChainFamily === 'solana' ? 'Solana' : 'EVM'} wallet to view your credit score, request funding, and manage projects.`}
            </p>
            {isPayoutReferral ? (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/login?mode=signup">
                  <Button variant="primary" size="md">Get Funded Now</Button>
                </Link>
                <span className="text-sm text-text-tertiary">or preview your credit score below</span>
              </div>
            ) : (
              <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                Use your browser wallet extension to connect{activeChainFamily === 'solana' ? ' Solana' : ''}.
              </div>
            )}
          </div>

          <div className={isPayoutReferral ? "" : "border-t border-default pt-8"}>
            <h2 className="text-lg font-semibold text-primary mb-2">
              {isPayoutReferral ? "📊 Your Estimated Credit" : "🔍 Preview Your Score"}
            </h2>
            <p className="text-sm text-secondary mb-4">
              {isPayoutReferral
                ? "Enter your GitHub username to see how much USDC you qualify for — no wallet or login required."
                : "Enter your GitHub username to see an estimated credit score — no login required."}
            </p>
            <ScorePreviewCard />
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  const tabs = [
    { id: "credit", label: "Credit" },
    { id: "projects", label: "Projects" },
    { id: "funding", label: "Get Funded" },
    { id: "crosschain", label: "Cross-Chain" },
  ];

  return (
    <>
      <Head><title>Build | Builder Credit</title></Head>
      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Rail progression indicator */}
        <div className="mb-6">
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium">
              <span className={`px-2 py-1 rounded-full ${!hasBagsToken ? 'bg-purple-200 text-purple-800 dark:text-purple-300' : 'bg-purple-100 text-purple-600 dark:text-purple-400'}`}>
                🎒 Rail 1: Bags
              </span>
              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className={`px-2 py-1 rounded-full ${doesHaveProjects && !hasBagsToken ? 'bg-blue-200 text-blue-800 dark:text-blue-300' : !doesHaveProjects ? 'bg-gray-100 text-gray-500 dark:text-gray-400' : 'bg-blue-100 text-blue-600 dark:text-blue-400'}`}>
                💳 Rail 2: Credit
              </span>
              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className={`px-2 py-1 rounded-full ${hasHackathonWins ? 'bg-green-200 text-green-800 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:text-gray-400'}`}>
                🏆 Rail 3: Prize Routing
              </span>
            </div>
            <div className="flex-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              {!doesHaveProjects && !hasBagsToken && !hasHackathonWins && (
                <span>Start on <strong>Rail 1</strong> — launch a project token on Bags, or submit a project to unlock <strong>Rail 2</strong> credit.</span>
              )}
              {doesHaveProjects && !hasHackathonWins && (
                <span>You're on <strong>Rail 2</strong> (credit). Win a hackathon to unlock <strong>Rail 3</strong> — auto-repay backers from your prize.</span>
              )}
              {hasHackathonWins && (
                <span>You're on <strong>Rail 3</strong> (prize routing). Your hackathon wins are verified and can auto-repay backers.</span>
              )}
              {hasBagsToken && !doesHaveProjects && (
                <span>You're on <strong>Rail 1</strong> (Bags). Submit a project with milestones to unlock <strong>Rail 2</strong> credit.</span>
              )}
            </div>
          </div>
        </div>

        {activeChainFamily === 'solana' && solanaConnected && solanaAddress && (
          <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900 dark:text-purple-200">
            Connected builder identity:{" "}
            <SnsIdentityBadge
              address={solanaAddress}
              chainFamily="solana"
              showFallback={true}
              showLoading={true}
              className="text-sm"
            />
          </div>
        )}
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {activeTab === "credit" && (
          <ErrorBoundary name="CreditTab" errorMessage="Failed to load credit data.">
            <div className="p-6 text-center text-text-secondary">Credit dashboard has moved to your <a href="/profile" className="text-blue-600 dark:text-blue-400 underline">profile</a>.</div>
          </ErrorBoundary>
        )}

        {activeTab === "projects" && (
          <ErrorBoundary name="ProjectsTab" errorMessage="Failed to load projects.">
            <div className="space-y-8">
              <BuilderProjectGrowth />
              <div className="border-t border-slate-200 pt-8">
                <DeveloperDashboard />
              </div>
              {/* Bags — Rail 1: launch a project token on Solana */}
              <div className="border-t border-slate-200 pt-8">
                <Card className="p-6 border-t-4 border-t-purple-500 bg-gradient-to-br from-purple-50 to-white">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Rail 1</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 dark:text-purple-300 rounded-full">Pre-prize</span>
                      </div>
                      <h3 className="text-lg font-bold text-primary">Launch a Bags Token</h3>
                      <p className="text-sm text-secondary mt-1 max-w-xl">
                        Don't have a prize pipeline yet? Launch a project token on Solana via Bags. 
                        Community buys in, you earn fee-share yield from trading volume.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="flex-shrink-0 border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white"
                      onClick={() => window.open('https://bags.gg', '_blank')}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      Launch on Bags
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </ErrorBoundary>
        )}

        {activeTab === "funding" && (
          <ErrorBoundary name="FundingTab" errorMessage="Failed to load funding interface.">
            <div className="space-y-6">
              <FundingInterface
                creditScore={creditProfile?.creditScore || 0}
                onFundingComplete={() => setActiveTab("credit")}
              />
            </div>
          </ErrorBoundary>
        )}

        {activeTab === "crosschain" && (
          <ErrorBoundary name="CrossChainTab" errorMessage="Failed to load cross-chain tools.">
            <div className="space-y-8">
              <CrossChainTransfer />
              <TransferHistory />
            </div>
          </ErrorBoundary>
        )}
      </div>
    </>
  );
}
