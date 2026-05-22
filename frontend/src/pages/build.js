/**
 * Build Page — unified Credit Profile + Dashboard for builders
 */

import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useWallet } from "@/contexts/WalletContext";
import { useBuilderCredit } from "@/contexts/WalletContext";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/router";
import { FinancialProvider } from "@/contexts/FinancialContext";

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
import CreditTab from "@/components/build/CreditTab";

export default function BuildPage() {
  const { userRole } = useUser();
  const router = useRouter();
  const wallet = useWallet();
  const builderCredit = useBuilderCredit();
  const [activeTab, setActiveTab] = useState("credit");

  const {
    connected,
    connect,
    loading: metaMaskLoading,
    activeChainFamily,
    setActiveChainFamily,
    solanaConnected,
    connectSolana,
    disconnectSolana,
    solanaAddress
  } = wallet;
  const { creditProfile, developerProjects, projectDetails, contractLoading, usdcBalance } = builderCredit;

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
  const handleConnect = activeChainFamily === 'solana' ? connectSolana : connect;

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
                      ? 'bg-surface text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  EVM (Metamask)
                </button>
                <button
                  onClick={() => setActiveChainFamily('solana')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeChainFamily === 'solana' 
                      ? 'bg-surface text-purple-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Solana
                </button>
              </div>
            </div>

            <ShieldCheckIcon className={`w-16 h-16 mx-auto ${activeChainFamily === 'solana' ? 'text-purple-500' : 'text-blue-500'}`} />
            <h1 className="mt-4 text-2xl font-bold text-primary">Builder Hub</h1>
            <p className="mt-2 text-secondary">
              Connect your {activeChainFamily === 'solana' ? 'Solana' : 'EVM'} wallet to view your credit score, request funding, and manage projects.
            </p>
            <Button 
              onClick={handleConnect} 
              className={`mt-6 ${activeChainFamily === 'solana' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
            >
              Connect {activeChainFamily === 'solana' ? 'Solana' : 'Wallet'}
            </Button>
          </div>

          <div className="border-t border-default pt-8">
            <h2 className="text-lg font-semibold text-primary mb-2">🔍 Preview Your Score</h2>
            <p className="text-sm text-secondary mb-4">
              Enter your GitHub username to see an estimated credit score — no login required.
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
    <FinancialProvider>
    <>
      <Head><title>Build | Builder Credit</title></Head>
      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeChainFamily === 'solana' && solanaConnected && solanaAddress && (
          <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900">
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
            <CreditTab
              creditProfile={creditProfile}
              usdcBalance={usdcBalance}
              chainBalances={builderCredit.chainBalances || {}}
              activeChainFamily={activeChainFamily}
              developerProjects={developerProjects}
              projectDetails={projectDetails}
              setActiveTab={setActiveTab}
              onSwitchChain={(family) => builderCredit.switchChain(family)}
              isLoadingBalances={builderCredit.isFetchingBalances}
            />
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
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Rail 1</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-full">Pre-prize</span>
                      </div>
                      <h3 className="text-lg font-bold text-primary">Launch a Bags Token</h3>
                      <p className="text-sm text-secondary mt-1 max-w-xl">
                        Don't have a prize pipeline yet? Launch a project token on Solana via Bags. 
                        Community buys in, you earn fee-share yield from trading volume.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="flex-shrink-0 border-purple-300 text-purple-700 hover:bg-purple-600 hover:text-white"
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
    </FinancialProvider>
  );
}
