import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useMetaMask } from '@/contexts/MetaMaskContext';
import { useBuilderCredit } from '@/contexts/BuilderCreditContext';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

function ScoreBar({ score, min = 400, max = 850 }) {
  const pct = Math.max(0, Math.min(100, ((score - min) / (max - min)) * 100));
  const color = score >= 700 ? 'bg-green-500' : score >= 550 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function CreditPage() {
  const { connected, connect, account } = useMetaMask();
  const { creditProfile, developerProjects, projectDetails, contractLoading, formatUSDC, usdcBalance } = useBuilderCredit();

  if (!connected) {
    return (
      <>
        <Head><title>Credit Profile | Builder Credit</title></Head>
        <div className="py-16 text-center">
          <ShieldCheckIcon className="w-16 h-16 mx-auto text-gray-400" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Your Credit Profile</h1>
          <p className="mt-2 text-gray-600 max-w-md mx-auto">
            Connect your wallet to view your credit score, credit line, and backed projects.
          </p>
          <Button onClick={connect} className="mt-6 bg-blue-600 text-white px-6 py-3">
            Connect Wallet
          </Button>
        </div>
      </>
    );
  }

  if (contractLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const score = creditProfile?.creditScore || 0;
  const totalCredit = creditProfile?.totalAmount || '0';
  const usedCredit = creditProfile?.usedAmount || '0';
  const reputation = creditProfile?.reputation || 0;
  const tier = score >= 800 ? 'Elite' : score >= 700 ? 'Proven' : score >= 550 ? 'Rising' : score >= 400 ? 'New' : 'Unscored';

  return (
    <>
      <Head><title>Credit Profile | Builder Credit</title></Head>
      <div className="py-6 max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Credit Profile</h1>

        {/* Score + Credit Line */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Credit Score</p>
                <p className="text-4xl font-bold text-gray-900">{score || '—'}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  tier === 'Elite' ? 'bg-purple-100 text-purple-700' :
                  tier === 'Proven' ? 'bg-green-100 text-green-700' :
                  tier === 'Rising' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
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
            <p className="text-2xl font-bold text-gray-900 mt-1">${usdcBalance || '0.00'}</p>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Reputation</p>
              <p className="text-lg font-semibold text-gray-900">{reputation}</p>
            </div>
          </Card>
        </div>

        {/* Credit Line Details */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
            Credit Line
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
                {score >= 800 ? '1.5x' : score >= 700 ? '2.0x' : score >= 600 ? '2.5x' : '3.0x'}
              </p>
            </div>
          </div>
        </Card>

        {/* Projects */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <RocketLaunchIcon className="w-5 h-5 text-blue-600" />
              Your Projects ({developerProjects?.length || 0})
            </h2>
            <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
              Go to Dashboard →
            </Link>
          </div>

          {(!projectDetails || projectDetails.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              <p>No projects yet.</p>
              <Link href="/projects/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                Submit your first project →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projectDetails.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.milestonesCompleted}/{p.milestonesCount} milestones • ${p.fundingAmount} USDC
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {p.isActive ? 'Active' : 'Completed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* How Credit Works */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
            How to Improve Your Credit
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ Complete project milestones to increase reputation</li>
            <li>✅ Get backers to stake on your projects (2x confidence boost)</li>
            <li>✅ Pledge expected prizes as collateral</li>
            <li>✅ Ship consistently across hackathons</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
