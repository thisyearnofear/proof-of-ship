/**
 * Build Page — unified Credit Profile + Dashboard for builders
 */

import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMetaMask } from "@/contexts/MetaMaskContext";
import { useBuilderCredit } from "@/contexts/BuilderCreditContext";
import { LiFiProvider } from "@/contexts/LiFiContext";
import { CircleWalletProvider } from "@/contexts/CircleWalletContext";
import { UserBehaviorProvider } from "@/contexts/UserBehaviorContext";
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
} from "@heroicons/react/24/outline";
import TabBar from "@/components/common/TabBar";
import ScoreBar from "@/components/common/ScoreBar";

export default function BuildPage() {
  const { connected, connect, loading: metaMaskLoading } = useMetaMask();
  const { creditProfile, developerProjects, projectDetails, contractLoading, usdcBalance } = useBuilderCredit();
  const [activeTab, setActiveTab] = useState("credit");
  const [previewUsername, setPreviewUsername] = useState('');
  const [previewResult, setPreviewResult] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  if (!connected) {
    return (
      <>
        <Head><title>Build | Builder Credit</title></Head>
        <div className="py-12 max-w-xl mx-auto px-4 text-center space-y-8">
          <div>
            <ShieldCheckIcon className="w-16 h-16 mx-auto text-gray-400" />
            <h1 className="mt-4 text-2xl font-bold text-primary">Builder Hub</h1>
            <p className="mt-2 text-secondary">
              Connect your wallet to view your credit score, request funding, and manage projects.
            </p>
            <Button onClick={connect} className="mt-6 bg-blue-600 text-white px-6 py-3">
              Connect Wallet
            </Button>
          </div>

          <div className="border-t border-slate-200 pt-8">
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
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 bg-white text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={previewLoading}
              />
              <Button
                type="submit"
                disabled={!previewUsername.trim() || previewLoading}
                className="bg-blue-600 text-white px-5 py-3 text-sm font-semibold whitespace-nowrap"
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
                    previewResult.estimatedScore >= 700 ? 'bg-green-100 text-green-700' :
                    previewResult.estimatedScore >= 550 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {previewResult.tier}
                  </span>
                </div>
                <ScoreBar score={previewResult.estimatedScore} />
                <div className="flex justify-between text-xs text-gray-400 mt-1 mb-3">
                  <span>400</span><span>550</span><span>700</span><span>850</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-secondary">
                  <span>📦 {previewResult.stats.publicRepos} repos</span>
                  <span>⭐ {previewResult.stats.totalStars} stars</span>
                  <span>👥 {previewResult.stats.followers} followers</span>
                  <span>📅 {Math.floor(previewResult.stats.accountAgeDays / 365)}y on GitHub</span>
                </div>
                <p className="mt-4 text-xs text-secondary italic">
                  This is an estimate based on public data. Connect your wallet to unlock your full credit profile with activity and community scores.
                </p>
              </Card>
            )}

            {previewError && (
              <p className="mt-2 text-sm text-red-600">{previewError}</p>
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
    <LiFiProvider>
    <CircleWalletProvider>
    <UserBehaviorProvider>
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
                      tier === "Elite" ? "bg-purple-100 text-purple-700" :
                      tier === "Proven" ? "bg-green-100 text-green-700" :
                      tier === "Rising" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-secondary"
                    }`}>{tier} Builder</span>
                  </div>
                  <ChartBarIcon className="w-12 h-12 text-blue-500" />
                </div>
                <ScoreBar score={score} />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>400</span><span>550</span><span>700</span><span>850</span>
                </div>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-secondary">USDC Balance</p>
                <p className="text-2xl font-bold text-primary mt-1">${usdcBalance || "0.00"}</p>
                <div className="mt-4">
                  <p className="text-sm text-secondary">Reputation</p>
                  <p className="text-lg font-semibold text-primary">{reputation}</p>
                </div>
              </Card>
            </div>

            {/* Credit Line */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5 text-green-600" /> Credit Line
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-secondary">Total Available</p>
                  <p className="text-xl font-bold text-green-700">${totalCredit}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Used</p>
                  <p className="text-xl font-bold text-orange-600">${usedCredit}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Remaining</p>
                  <p className="text-xl font-bold text-blue-700">
                    ${(parseFloat(totalCredit) - parseFloat(usedCredit)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Max Multiplier</p>
                  <p className="text-xl font-bold text-purple-700">
                    {score >= 800 ? "1.5x" : score >= 700 ? "2.0x" : score >= 600 ? "2.5x" : "3.0x"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Quick project list */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <RocketLaunchIcon className="w-5 h-5 text-blue-600" />
                  Your Projects ({developerProjects?.length || 0})
                </h2>
                <button onClick={() => setActiveTab("projects")} className="text-sm text-blue-600 hover:underline">
                  View all →
                </button>
              </div>
              {(!projectDetails || projectDetails.length === 0) ? (
                <div className="text-center py-6 text-secondary">
                  <p>No projects yet.</p>
                  <Link href="/projects/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
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
                        p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-secondary"
                      }`}>
                        {p.isActive ? "Active" : "Done"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* How to improve */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" /> How to Improve Your Credit
              </h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Complete project milestones to increase reputation</li>
                <li>✅ Get backers to stake on your projects</li>
                <li>✅ Pledge expected prizes as collateral</li>
                <li>✅ Ship consistently across hackathons</li>
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
    </UserBehaviorProvider>
    </CircleWalletProvider>
    </LiFiProvider>
  );
}
