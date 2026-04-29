/**
 * Build Page — unified Credit Profile + Dashboard for builders
 */

import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useWallet } from "@/contexts/WalletContext";
import { useBuilderCredit } from "@/contexts/WalletContext";
import { FinancialProvider } from "@/contexts/FinancialContext";


import FundingInterface from "@/components/FundingInterface";
import DeveloperDashboard from "@/components/DeveloperDashboard";
import CrossChainTransfer from "@/components/CrossChainTransfer";
import TransferHistory from "@/components/TransferHistory";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  CubeIcon,
  StarIcon,
  FolderIcon,
  CalendarIcon,
  UserGroupIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import TabBar from "@/components/common/TabBar";
import ScoreBar from "@/components/common/ScoreBar";

export default function BuildPage() {
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
  } = useWallet();
  const { creditProfile, developerProjects, projectDetails, contractLoading, usdcBalance } = useBuilderCredit();
  const [activeTab, setActiveTab] = useState("credit");
  const [previewUsername, setPreviewUsername] = useState('');
  const [previewResult, setPreviewResult] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const isActuallyConnected = activeChainFamily === 'solana' ? solanaConnected : connected;
  const handleConnect = activeChainFamily === 'solana' ? connectSolana : connect;

  const handlePreviewScore = async (e) => {
    e.preventDefault();
    const username = previewUsername.trim();
    if (!username) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewResult(null);
    try {
      const res = await fetch(`/api/score/preview?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!data.success) {
        setPreviewError(data.error || 'Could not fetch score');
        return;
      }
      setPreviewResult(data.data);
    } catch (err) {
      setPreviewError('Failed to connect. Please try again.');
    } finally {
      setPreviewLoading(false);
    }
  };

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
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  EVM (Metamask)
                </button>
                <button
                  onClick={() => setActiveChainFamily('solana')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeChainFamily === 'solana' 
                      ? 'bg-white text-purple-600 shadow-sm' 
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
            <form onSubmit={handlePreviewScore} className="flex gap-2">
              <input
                type="text"
                placeholder="GitHub username"
                value={previewUsername}
                onChange={(e) => setPreviewUsername(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border border-default bg-surface text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                disabled={previewLoading}
              />
              <Button
                type="submit"
                disabled={!previewUsername.trim() || previewLoading}
                className="whitespace-nowrap"
              >
                {previewLoading ? '...' : 'Preview'}
              </Button>
            </form>

            {previewResult && (
              <Card className="mt-4 p-5 text-left">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-secondary">Estimated Credit Score</p>
                    <p className="text-3xl font-bold text-primary">{previewResult.estimatedScore}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    previewResult.estimatedScore >= 700 ? 'bg-success-50 text-success-700' :
                    previewResult.estimatedScore >= 550 ? 'bg-warning-50 text-warning-700' :
                    'bg-surface-secondary text-secondary'
                  }`}>
                    {previewResult.tier}
                  </span>
                </div>
                <ScoreBar score={previewResult.estimatedScore} />
                <div className="flex justify-between text-xs text-secondary mt-1 mb-3">
                  <span>400</span><span>550</span><span>700</span><span>850</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-secondary">
                  <span className="flex items-center gap-1"><FolderIcon className="w-4 h-4" /> {previewResult.stats.publicRepos} repos</span>
                  <span className="flex items-center gap-1"><StarIcon className="w-4 h-4" /> {previewResult.stats.totalStars} stars</span>
                  <span className="flex items-center gap-1"><UserGroupIcon className="w-4 h-4" /> {previewResult.stats.followers} followers</span>
                  <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {Math.floor(previewResult.stats.accountAgeDays / 365)}y on GitHub</span>
                </div>
                <p className="mt-4 text-xs text-secondary italic">
                  This is an estimate based on public data. Connect your wallet to unlock your full credit profile with activity and community scores.
                </p>
              </Card>
            )}

            {previewError && (
              <p className="mt-2 text-sm text-error-600">{previewError}</p>
            )}
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  const score = creditProfile?.creditScore || 0;
  const totalCredit = creditProfile?.totalAmount || "0";
  const usedCredit = creditProfile?.usedAmount || "0";
  const reputation = creditProfile?.reputation || 0;
  const tier = score >= 800 ? "Elite" : score >= 700 ? "Proven" : score >= 550 ? "Rising" : score >= 400 ? "New" : "Unscored";

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
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Credit Tab */}
        {activeTab === "credit" && (
          <div className="space-y-6">
            {/* Score + Balance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-secondary">Credit Score</p>
                    <p className="text-4xl font-bold text-primary">{score || "—"}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      tier === "Elite" ? "bg-secondary-50 text-secondary-700" :
                      tier === "Proven" ? "bg-success-50 text-success-700" :
                      tier === "Rising" ? "bg-warning-50 text-warning-700" :
                      "bg-surface-secondary text-secondary"
                    }`}>{tier} Builder</span>
                  </div>
                  <ChartBarIcon className="w-12 h-12 text-primary-500" />
                </div>
                <ScoreBar score={score} />
                <div className="flex justify-between text-xs text-secondary mt-1">
                  <span>400</span><span>550</span><span>700</span><span>850</span>
                </div>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-secondary">{activeChainFamily === 'solana' ? 'SOL Balance' : 'USDC Balance'}</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {activeChainFamily === 'solana' ? '' : '$'}{usdcBalance || "0.00"}{activeChainFamily === 'solana' ? ' SOL' : ''}
                </p>
                <div className="mt-4">
                  <p className="text-sm text-secondary">Reputation</p>
                  <p className="text-lg font-semibold text-primary">{reputation}</p>
                </div>
              </Card>
            </div>

            {/* Credit Line Breakdown */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-success-600" /> Funding Capacity
                </h2>
                <div className="text-right">
                  <p className="text-xs text-secondary uppercase font-bold tracking-wider">Total Available</p>
                  <p className="text-2xl font-black text-primary">${totalCredit}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual breakdown bar */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-secondary font-medium">Utilization</span>
                      <span className="text-primary font-bold">{Math.round((parseFloat(usedCredit) / parseFloat(totalCredit)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex">
                      <div 
                        className="bg-warning-500 h-full transition-all duration-500" 
                        style={{ width: `${(parseFloat(usedCredit) / parseFloat(totalCredit)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-surface-secondary rounded-xl border border-default">
                      <p className="text-[10px] text-secondary uppercase font-bold mb-1">Used</p>
                      <p className="text-lg font-bold text-warning-600">${usedCredit}</p>
                    </div>
                    <div className="p-3 bg-success-50 rounded-xl border border-success-100">
                      <p className="text-[10px] text-success-600 uppercase font-bold mb-1">Remaining</p>
                      <p className="text-lg font-bold text-success-700">
                        ${(parseFloat(totalCredit) - parseFloat(usedCredit)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sources breakdown */}
                <div className="space-y-3">
                  <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-primary">Base Limit</span>
                      <span className="text-sm font-bold text-primary">${creditProfile?.baseAmount || "0"}</span>
                    </div>
                    <p className="text-[10px] text-primary-600">Calculated from your on-chain reputation and GitHub history.</p>
                  </div>

                  <div className="p-4 bg-secondary-50/50 rounded-xl border border-secondary-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-secondary">Market Boost</span>
                      <span className="text-sm font-bold text-secondary">+${creditProfile?.marketBoost || "0"}</span>
                    </div>
                    <p className="text-[10px] text-secondary-600">2x multiplier bonus from backer confidence in your projects.</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick project list */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <RocketLaunchIcon className="w-5 h-5 text-primary-500" />
                  Your Projects ({developerProjects?.length || 0})
                </h2>
                <button onClick={() => setActiveTab("projects")} className="text-sm text-primary-500 hover:underline">
                  View all →
                </button>
              </div>
              {(!projectDetails || projectDetails.length === 0) ? (
                <div className="text-center py-6 text-secondary">
                  <p>No projects yet.</p>
                  <Link href="/projects/new" className="text-primary-500 hover:underline text-sm mt-2 inline-block">
                    Submit your first project →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {projectDetails.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                      <div>
                        <p className="font-medium text-primary">{p.name}</p>
                        <p className="text-xs text-secondary">
                          {p.milestonesCompleted}/{p.milestonesCount} milestones • ${p.fundingAmount} USDC
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.isActive ? "bg-success-50 text-success-700" : "bg-surface-secondary text-secondary"
                      }`}>
                        {p.isActive ? "Active" : "Done"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* How to improve */}
            <Card className="p-6 bg-primary-50 border-primary-200">
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-primary-500" /> How to Improve Your Credit
              </h2>
              <ul className="space-y-2 text-sm text-secondary">
                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500" /> Complete project milestones to increase reputation</li>
                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500" /> Get backers to stake on your projects</li>
                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500" /> Win prizes to repay backers and boost your reputation</li>
                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500" /> Ship consistently across hackathons</li>
              </ul>
            </Card>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && <DeveloperDashboard />}

        {/* Funding Tab */}
        {activeTab === "funding" && (
          <div className="space-y-6">
            <FundingInterface
              creditScore={creditProfile?.creditScore || 0}
              onFundingComplete={() => setActiveTab("credit")}
            />
          </div>
        )}

        {/* Cross-Chain Tab */}
        {activeTab === "crosschain" && (
          <div className="space-y-8">
            <CrossChainTransfer />
            <TransferHistory />
          </div>
        )}
      </div>
    </>
    </FinancialProvider>
  );
}
