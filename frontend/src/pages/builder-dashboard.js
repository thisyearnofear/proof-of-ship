import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import ErrorBoundary from '@/components/ErrorBoundary';

import {
  CalendarIcon,
  TrophyIcon,
  UsersIcon,
  CheckBadgeIcon,
  CurrencyDollarIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

/**
 * Unified Builder Dashboard
 * Brings together hackathons, verification, funding, and portfolio in one view
 * 
 * Follows ENHANCEMENT FIRST by extending existing dashboard patterns
 * Maintains CLEAN separation with dedicated sections
 */

export default function BuilderDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [predictiveCredit, setPredictiveCredit] = useState(null);

  // PERFORMANT: Fetch all dashboard data in parallel
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Simulate fetching data (in production, use actual API calls)
        // This demonstrates the unified dashboard concept
        
        // Note: In a real implementation, we would:
        // 1. Get current user ID from auth
        // 2. Fetch hackathon participation
        // 3. Fetch funding eligibility
        // 4. Fetch portfolio data
        // 5. Combine all data
        
        const [hackathonData, eligibilityData, predictiveData] = await Promise.all([
          fetchMockHackathons(),
          fetchMockEligibility(),
          fetchMockPredictiveCredit()
        ]);

        setHackathons(hackathonData);
        setEligibility(eligibilityData);
        setPredictiveCredit(predictiveData);
        setStats(generateMockStats(hackathonData, eligibilityData));
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorBoundary
          name="BuilderDashboard"
          errorMessage={error}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary
      name="BuilderDashboardPage"
      errorMessage="Failed to load dashboard. Please refresh."
    >
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Builder Dashboard • Onchain Builder Platform</title>
          <meta name="description" content="Your onchain builder dashboard - track hackathons, verify achievements, and check funding eligibility" />
        </Head>

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Builder Dashboard</h1>
            <p className="text-gray-600 mt-1">Your onchain builder activity and achievements</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Stats Overview */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<CalendarIcon className="h-6 w-6 text-blue-600" />}
                  label="Hackathons Participated"
                  value={stats.totalParticipations}
                  bg="bg-blue-50"
                />
                <StatCard
                  icon={<TrophyIcon className="h-6 w-6 text-yellow-600" />}
                  label="Hackathons Won"
                  value={stats.totalWins}
                  bg="bg-yellow-50"
                />
                <StatCard
                  icon={<CheckBadgeIcon className="h-6 w-6 text-green-600" />}
                  label="Verified Achievements"
                  value={stats.verifiedAchievements}
                  bg="bg-green-50"
                />
                <StatCard
                  icon={<CurrencyDollarIcon className="h-6 w-6 text-purple-600" />}
                  label="Estimated Funding"
                  value={`$${stats.estimatedFunding.toLocaleString()}`}
                  bg="bg-purple-50"
                />
              </div>
            )}

            {/* Funding Eligibility & Predictive Credit */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {eligibility && (
                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Reputation Score</h2>
                      <Link 
                        href="/funding" 
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        View Details
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Eligibility Score */}
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-4xl font-bold text-gray-900">
                            {eligibility.eligibilityScore}
                          </span>
                          <span className="text-gray-600">/ 100</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {eligibility.eligible ? 'High Reputation' : 'Building Reputation'}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex-1 w-full">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${eligibility.eligibilityScore}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span>50</span>
                          <span>100</span>
                        </div>
                      </div>
                    </div>

                    {/* Eligibility Factors */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">
                          {eligibility.factors.totalParticipations}
                        </div>
                        <div className="text-gray-500">Participations</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">
                          {eligibility.factors.totalWins}
                        </div>
                        <div className="text-gray-500">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">
                          {eligibility.factors.hasRecentWin ? 'Yes' : 'No'}
                        </div>
                        <div className="text-gray-500">Recent Win</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">
                          {eligibility.eligibilityScore}/100
                        </div>
                        <div className="text-gray-500">Score</div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {predictiveCredit && (
                <Card className="border-blue-200 bg-blue-50/30">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold text-gray-900">Predictive Credit</h2>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">Market Based</span>
                      </div>
                      <Link 
                        href="/market" 
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        Market View
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Market Confidence */}
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-4xl font-bold text-blue-700">
                            {predictiveCredit.marketConfidence}%
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Market Confidence Score
                        </div>
                      </div>

                      {/* Prize Collateral */}
                      <div className="flex-1 text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          ${predictiveCredit.prizeCollateralAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Prize-Collateralized Limit</div>
                      </div>
                    </div>

                    {/* Backer Activity */}
                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">Backer Support</span>
                        <span className="text-blue-700 font-bold">{predictiveCredit.backerCount} backers betting on you</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden flex">
                        <div
                          className="bg-blue-600 h-full"
                          style={{ width: `${predictiveCredit.marketConfidence}%` }}
                        ></div>
                        <div
                          className="bg-blue-300 h-full"
                          style={{ width: `${100 - predictiveCredit.marketConfidence}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Low Confidence</span>
                        <span>High Confidence</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Recent Hackathons */}
            {hackathons.length > 0 && (
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Hackathons</h2>
                    <Link 
                      href="/hackathons" 
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      View All
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {hackathons.slice(0, 3).map(hackathon => (
                      <HackathonDashboardCard key={hackathon.id} hackathon={hackathon} />
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ActionCard
                    icon={<CalendarIcon className="h-6 w-6 text-blue-600" />}
                    title="Find Hackathons"
                    description="Discover upcoming hackathons"
                    href="/hackathons"
                    bg="bg-blue-50"
                  />
                  <ActionCard
                    icon={<CheckBadgeIcon className="h-6 w-6 text-green-600" />}
                    title="Verify Achievements"
                    description="Verify your hackathon wins"
                    href="/verification"
                    bg="bg-green-50"
                  />
                  <ActionCard
                    icon={<CurrencyDollarIcon className="h-6 w-6 text-purple-600" />}
                    title="Apply for Funding"
                    description="Request funding for your projects"
                    href="/funding"
                    bg="bg-purple-50"
                  />
                </div>
              </div>
            </Card>

            {/* Portfolio Summary */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Your Portfolio</h2>
                  <Link 
                    href="/portfolio" 
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View Full Portfolio
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Projects */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Projects</h3>
                    <div className="space-y-3">
                      <PortfolioItem
                        title="DeFi Protocol"
                        ecosystem="Ethereum"
                        status="Deployed"
                        icon={<ChartBarIcon className="h-5 w-5 text-blue-600" />}
                      />
                      <PortfolioItem
                        title="NFT Marketplace"
                        ecosystem="Polygon"
                        status="In Development"
                        icon={<ChartBarIcon className="h-5 w-5 text-purple-600" />}
                      />
                    </div>
                  </div>

                  {/* Achievements */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Achievements</h3>
                    <div className="space-y-3">
                      <PortfolioItem
                        title="ETHGlobal Winner"
                        ecosystem="Ethereum"
                        status="Verified"
                        icon={<TrophyIcon className="h-5 w-5 text-yellow-600" />}
                      />
                      <PortfolioItem
                        title="Polygon Hackathon"
                        ecosystem="Polygon"
                        status="Participated"
                        icon={<TrophyIcon className="h-5 w-5 text-gray-600" />}
                      />
                    </div>
                  </div>

                  {/* Funding History */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Funding History</h3>
                    <div className="space-y-3">
                      <PortfolioItem
                        title="$2,500 Grant"
                        ecosystem="Celo"
                        status="Received"
                        icon={<CurrencyDollarIcon className="h-5 w-5 text-green-600" />}
                      />
                      <PortfolioItem
                        title="$1,000 Prize"
                        ecosystem="Base"
                        status="Pending"
                        icon={<CurrencyDollarIcon className="h-5 w-5 text-yellow-600" />}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Stat Card Component
 * Displays a single statistic
 * 
 * Follows MODULAR principle with clear props interface
 */
function StatCard({ icon, label, value, bg }) {
  return (
    <Card className={`${bg}`}>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white">{icon}</div>
          <div>
            <div className="text-sm text-gray-600">{label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Hackathon Dashboard Card
 * Compact hackathon display for dashboard
 * 
 * Follows DRY principle with consistent layout
 */
function HackathonDashboardCard({ hackathon }) {
  const isUpcoming = new Date(hackathon.startDate) > new Date();
  const isActive = !isUpcoming && new Date(hackathon.endDate) > new Date();

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center font-semibold">
          {hackathon.name.charAt(0)}
        </div>
        <div>
          <div className="font-medium text-gray-900">{hackathon.name}</div>
          <div className="text-sm text-gray-500">
            {hackathon.ecosystem} • 
            {isUpcoming ? 'Upcoming' : isActive ? 'Active' : 'Completed'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {hackathon.participationStatus && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            {hackathon.participationStatus}
          </span>
        )}
        <Button variant="outline" size="xs">
          View
        </Button>
      </div>
    </div>
  );
}

/**
 * Action Card Component
 * Dashboard action card with icon
 * 
 * Follows CLEAN principle with simple props
 */
function ActionCard({ icon, title, description, href, bg }) {
  return (
    <Card className={`${bg} hover:shadow-md transition-shadow`}>
      <Link href={href} className="block p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white">{icon}</div>
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
      </Link>
    </Card>
  );
}

/**
 * Portfolio Item Component
 * Compact portfolio item display
 * 
 * Follows ORGANIZED principle with consistent structure
 */
function PortfolioItem({ title, ecosystem, status, icon }) {
  const statusColors = {
    'Deployed': 'text-green-600',
    'In Development': 'text-blue-600',
    'Verified': 'text-green-600',
    'Participated': 'text-gray-600',
    'Received': 'text-green-600',
    'Pending': 'text-yellow-600'
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="p-1.5 rounded bg-white">{icon}</div>
      <div className="flex-1">
        <div className="font-medium text-gray-900 text-sm">{title}</div>
        <div className="text-xs text-gray-500">{ecosystem}</div>
      </div>
      <div className={`text-xs font-medium ${statusColors[status] || 'text-gray-600'}`}>
        {status}
      </div>
    </div>
  );
}

// MODULAR: Mock data functions for demonstration
// In production, replace with actual API calls
async function fetchMockHackathons() {
  return [
    {
      id: 'ethglobal-nyc-2024',
      name: 'ETHGlobal NYC 2024',
      ecosystem: 'ethereum',
      startDate: '2024-05-15T00:00:00Z',
      endDate: '2024-05-18T00:00:00Z',
      prizePool: 50000,
      participationStatus: 'winner',
      verified: true
    },
    {
      id: 'polygon-hackathon-2024',
      name: 'Polygon Summer Hackathon',
      ecosystem: 'polygon',
      startDate: '2024-06-01T00:00:00Z',
      endDate: '2024-06-30T00:00:00Z',
      prizePool: 25000,
      participationStatus: 'participant',
      verified: false
    },
    {
      id: 'celo-defi-challenge',
      name: 'Celo DeFi Challenge',
      ecosystem: 'celo',
      startDate: '2024-07-10T00:00:00Z',
      endDate: '2024-07-14T00:00:00Z',
      prizePool: 15000,
      participationStatus: null,
      verified: false
    }
  ];
}

async function fetchMockEligibility() {
  return {
    eligible: true,
    eligibilityScore: 75,
    estimatedFundingAmount: 3750,
    factors: {
      totalParticipations: 8,
      totalWins: 3,
      hasRecentWin: true
    }
  };
}

async function fetchMockPredictiveCredit() {
  return {
    marketConfidence: 82,
    prizeCollateralAmount: 5000,
    backerCount: 12,
    totalBets: 2500,
    milestones: [
      { name: 'Beta Launch', confidence: 90 },
      { name: '100 Active Users', confidence: 75 },
      { name: 'Prize Win', confidence: 65 }
    ]
  };
}

function generateMockStats(hackathons, eligibility) {
  return {
    totalParticipations: hackathons.filter(h => h.participationStatus).length,
    totalWins: hackathons.filter(h => h.participationStatus === 'winner').length,
    verifiedAchievements: hackathons.filter(h => h.verified).length,
    estimatedFunding: eligibility.estimatedFundingAmount
  };
}