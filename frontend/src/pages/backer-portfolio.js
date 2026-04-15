import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';

import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useMetaMask } from '@/contexts/MetaMaskContext';
import { useBuilderCredit } from '@/contexts/BuilderCreditContext';

import {
  BanknotesIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon,
  UserGroupIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

export default function BackerPortfolioPage() {
  const { account } = useMetaMask();
  const { coreContract, getBackerProjects } = useBuilderCredit();
  
  const [loading, setLoading] = useState(true);
  const [backedDetails, setBackedDetails] = useState([]);

  useEffect(() => {
    async function loadPortfolio() {
      if (!coreContract || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const projectIds = await getBackerProjects(account);

        const details = [];
        for (const id of projectIds) {
          try {
            const project = await coreContract.projects(id);
            
            details.push({
              id: id.toString(),
              name: project.name,
              developer: project.developer,
              isActive: project.isActive,
              milestonesCompleted: project.milestonesCompleted.toNumber(),
              milestonesCount: project.milestonesCount.toNumber(),
              fundingAmount: ethers.utils.formatUnits(project.fundingAmount, 6),
              // Mocking backer specific data for the UI
              myStake: (200 + Math.random() * 800).toFixed(2),
              myMultiplier: (1.5 + Math.random() * 1.5).toFixed(1),
              potentialReturn: (1500 + Math.random() * 1000).toFixed(2),
              health: Math.floor(Math.random() * 40) + 60 // 60-100%
            });
          } catch (err) {
            console.error(`Failed to load details for project ${id}:`, err);
          }
        }
        setBackedDetails(details);
      } catch (err) {
        console.error("Failed to load portfolio:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, [coreContract, account, getBackerProjects]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary name="BackerPortfolioPage" errorMessage="Failed to load backer portfolio.">
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Backer Portfolio • Builder Credit</title>
        </Head>

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Backer Portfolio</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Track your active bets and project health</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!account ? (
            <Card className="p-8 text-center">
              <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Connect Wallet</h3>
              <p className="text-gray-500 mt-2">Please connect your MetaMask wallet to view your portfolio</p>
              <div className="mt-6">
                <Button className="min-h-touch px-6">Connect MetaMask</Button>
              </div>
            </Card>
          ) : backedDetails.length === 0 ? (
            <Card className="p-8 text-center">
              <RocketLaunchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Active Bets</h3>
              <p className="text-gray-500 mt-2 text-sm sm:text-base">You haven't backed any projects yet. Start by supporting some talented builders!</p>
              <Link href="/expedition" className="mt-6 inline-block">
                <Button className="min-h-touch px-8 bg-indigo-600 hover:bg-indigo-700 text-white">
                  Browse Projects
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <StatCard 
                  label="Total Staked" 
                  value={`$${backedDetails.reduce((sum, p) => sum + parseFloat(p.myStake), 0).toFixed(2)}`}
                  icon={<BanknotesIcon className="w-6 h-6 text-blue-600" />}
                />
                <StatCard 
                  label="Potential Returns" 
                  value={`$${backedDetails.reduce((sum, p) => sum + parseFloat(p.potentialReturn), 0).toFixed(2)}`}
                  icon={<TrophyIcon className="w-6 h-6 text-green-600" />}
                />
                <StatCard 
                  label="Active Bets" 
                  value={backedDetails.length}
                  icon={<RocketLaunchIcon className="w-6 h-6 text-purple-600" />}
                  className="sm:col-span-2 lg:col-span-1"
                />
              </div>

              {/* Projects List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Active Bets</h2>
                  <div className="text-sm text-gray-500">{backedDetails.length} projects</div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {backedDetails.map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

function StatCard({ label, value, icon, className = "" }) {
  return (
    <Card className={`p-5 sm:p-6 ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-gray-50 rounded-lg flex-shrink-0">{icon}</div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function ProjectCard({ project }) {
  const progress = (project.milestonesCompleted / project.milestonesCount) * 100;
  
  return (
    <Card className="flex flex-col h-full border-l-4 border-l-indigo-500 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5 sm:p-6 flex-1">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{project.name}</h3>
            <div className="flex items-center mt-1">
              <p className="text-xs text-gray-500 font-mono truncate max-w-[150px]">
                {project.developer}
              </p>
            </div>
          </div>
          <span className={`flex-shrink-0 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
            project.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {project.isActive ? 'Active' : 'Completed'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-[10px] text-blue-600 mb-1 font-bold uppercase tracking-tight">My Stake</p>
            <p className="text-base sm:text-lg font-bold text-blue-900">${project.myStake}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-[10px] text-indigo-600 mb-1 font-bold uppercase tracking-tight">Return (est.)</p>
            <p className="text-base sm:text-lg font-bold text-indigo-900">${project.potentialReturn}</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Project Progress</span>
            <span className="text-xs sm:text-sm font-bold text-gray-900">
              {project.milestonesCompleted} / {project.milestonesCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2 border-t border-gray-100">
        <div className="flex items-center w-full sm:w-auto">
          <ShieldCheckIcon className={`w-5 h-5 mr-2 flex-shrink-0 ${
            project.health > 85 ? 'text-green-500' : 
            project.health > 70 ? 'text-blue-500' : 'text-yellow-500'
          }`} />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">Health: {project.health}%</span>
        </div>
        <Link href={`/projects/${project.id}`} className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full min-h-touch flex items-center justify-center gap-1.5 text-xs sm:text-sm">
            Project Hub
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
