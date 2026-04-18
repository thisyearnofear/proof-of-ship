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

function ScoreBar({ score, min = 400, max = 850 }) {
  const pct = Math.max(0, Math.min(100, ((score - min) / (max - min)) * 100));
  const color = score >= 700 ? "bg-green-500" : score >= 550 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function BuildPage() {
  const { connected, connect, loading: metaMaskLoading } = useMetaMask();
  const { creditProfile, developerProjects, projectDetails, contractLoading, usdcBalance } = useBuilderCredit();
  const [activeTab, setActiveTab] = useState("credit");

  const loading = metaMaskLoading || contractLoading;

  if (!connected) {
    return (
      <>
        <Head><title>Build | Builder Credit</title></Head>
        <div className="py-16 text-center">
          <ShieldCheckIcon className="w-16 h-16 mx-auto text-gray-400" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Builder Hub</h1>
          <p className="mt-2 text-gray-600 max-w-md mx-auto">
            Connect your wallet to view your credit score, request funding, and manage projects.
          </p>
          <Button onClick={connect} className="mt-6 bg-blue-600 text-white px-6 py-3">
            Connect Wallet
          </Button>
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
    { id: "credit", name: "Credit" },
    { id: "projects", name: "Projects" },
    { id: "funding", name: "Get Funded" },
    { id: "crosschain", name: "Cross-Chain" },
  ];

  return (
    <LiFiProvider>
    <CircleWalletProvider>
    <UserBehaviorProvider>
    <>
      <Head><title>Build | Builder Credit</title></Head>
      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 border w-fit">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === t.id ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}>
              {t.name}
            </button>
          ))}
        </div>

        {/* Credit Tab */}
        {activeTab === "credit" && (
          <div className="space-y-6">
            {/* Score + Balance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Credit Score</p>
                    <p className="text-4xl font-bold text-gray-900">{score || "—"}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      tier === "Elite" ? "bg-purple-100 text-purple-700" :
                      tier === "Proven" ? "bg-green-100 text-green-700" :
                      tier === "Rising" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-600"
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
                <p className="text-sm text-gray-500">USDC Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${usdcBalance || "0.00"}</p>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Reputation</p>
                  <p className="text-lg font-semibold text-gray-900">{reputation}</p>
                </div>
              </Card>
            </div>

            {/* Credit Line */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5 text-green-600" /> Credit Line
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Available</p>
                  <p className="text-xl font-bold text-green-700">${totalCredit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Used</p>
                  <p className="text-xl font-bold text-orange-600">${usedCredit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Remaining</p>
                  <p className="text-xl font-bold text-blue-700">
                    ${(parseFloat(totalCredit) - parseFloat(usedCredit)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Max Multiplier</p>
                  <p className="text-xl font-bold text-purple-700">
                    {score >= 800 ? "1.5x" : score >= 700 ? "2.0x" : score >= 600 ? "2.5x" : "3.0x"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Quick project list */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <RocketLaunchIcon className="w-5 h-5 text-blue-600" />
                  Your Projects ({developerProjects?.length || 0})
                </h2>
                <button onClick={() => setActiveTab("projects")} className="text-sm text-blue-600 hover:underline">
                  View all →
                </button>
              </div>
              {(!projectDetails || projectDetails.length === 0) ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No projects yet.</p>
                  <Link href="/projects/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                    Submit your first project →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {projectDetails.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.milestonesCompleted}/{p.milestonesCount} milestones • ${p.fundingAmount} USDC
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
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
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
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
