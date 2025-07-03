/**
 * Dashboard Page
 * Main developer dashboard showing credit profile, funding options, and projects
 */

import React, { useState } from 'react';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { useBuilderCredit } from '../contexts/BuilderCreditContext';
import FundingInterface from '../components/FundingInterface';
import DeveloperDashboard from '../components/DeveloperDashboard';
import CrossChainTransfer from '../components/CrossChainTransfer';
import TransferHistory from '../components/TransferHistory';
import { Card } from '../components/common/Card';
import { LoadingSpinner } from '../components/common/LoadingStates';
import {
  UserCircleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import Head from 'next/head';

export default function Dashboard() {
  const { connected, connect, loading: metaMaskLoading } = useMetaMask();
  const { creditProfile, loading: contractLoading } = useBuilderCredit();
  
  const [activeTab, setActiveTab] = useState('profile');
  
  // Handle funding completion
  const handleFundingComplete = (result) => {
    // Switch to profile tab to show the new project
    setActiveTab('profile');
  };
  
  const tabs = [
    { id: 'profile', name: 'Credit Profile', icon: UserCircleIcon },
    { id: 'funding', name: 'Request Funding', icon: CurrencyDollarIcon },
    { id: 'projects', name: 'Your Projects', icon: DocumentTextIcon },
    { id: 'crosschain', name: 'Cross-Chain', icon: GlobeAltIcon },
    { id: 'metrics', name: 'Performance', icon: ArrowTrendingUpIcon }
  ];
  
  const loading = metaMaskLoading || contractLoading;
  
  return (
    <>
      <Head>
        <title>Developer Dashboard | BuilderCredit</title>
        <meta name="description" content="Developer dashboard for BuilderCredit" />
      </Head>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Developer Dashboard</h1>
          
          {/* Connect Wallet Message */}
          {!connected && (
            <div className="mt-6">
              <Card className="p-8 text-center">
                <UserCircleIcon className="w-16 h-16 mx-auto text-gray-400" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">Connect Your Wallet</h2>
                <p className="mt-2 text-gray-600 max-w-md mx-auto">
                  Connect your Ethereum wallet to access your developer profile, request funding, and manage your projects.
                </p>
                <button
                  onClick={connect}
                  disabled={loading}
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Wallet'
                  )}
                </button>
              </Card>
            </div>
          )}
          
          {/* Dashboard Content */}
          {connected && (
            <div className="mt-6">
              {/* Navigation Tabs */}
              <div className="mb-6">
                <nav className="flex space-x-4" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        px-3 py-2 rounded-md text-sm font-medium flex items-center
                        ${activeTab === tab.id
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-500 hover:text-gray-700'
                        }
                      `}
                    >
                      <tab.icon className="w-5 h-5 mr-2" />
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="mt-6">
                {loading ? (
                  <div className="flex justify-center p-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <>
                    {activeTab === 'profile' && (
                      <DeveloperDashboard />
                    )}
                    
                    {activeTab === 'funding' && (
                      <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900">Request Funding</h2>
                        <FundingInterface 
                          creditScore={creditProfile?.creditScore || 0}
                          onFundingComplete={handleFundingComplete}
                        />
                      </div>
                    )}
                    
                    {activeTab === 'projects' && (
                      <DeveloperDashboard />
                    )}
                    
                    {activeTab === 'crosschain' && (
                      <div className="space-y-8">
                        <CrossChainTransfer />
                        <TransferHistory />
                      </div>
                    )}
                    
                    {activeTab === 'metrics' && (
                      <Card className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Metrics</h2>
                        <p className="text-gray-600">
                          Detailed developer performance metrics coming soon. Check back for insights on your development activity,
                          project completion rates, and credit score factors.
                        </p>
                        
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="p-4 bg-blue-50">
                            <h3 className="font-medium text-blue-800">Project Completion Rate</h3>
                            <div className="mt-2 text-2xl font-bold text-blue-900">
                              {creditProfile 
                                ? `${((creditProfile.reputation / 100) * 100).toFixed(0)}%` 
                                : 'N/A'}
                            </div>
                          </Card>
                          
                          <Card className="p-4 bg-green-50">
                            <h3 className="font-medium text-green-800">Repayment Rate</h3>
                            <div className="mt-2 text-2xl font-bold text-green-900">
                              {creditProfile && creditProfile.totalFunded > 0
                                ? `${((parseFloat(creditProfile.totalRepaid) / parseFloat(creditProfile.totalFunded)) * 100).toFixed(0)}%`
                                : 'N/A'}
                            </div>
                          </Card>
                          
                          <Card className="p-4 bg-purple-50">
                            <h3 className="font-medium text-purple-800">Credit Utilization</h3>
                            <div className="mt-2 text-2xl font-bold text-purple-900">
                              {creditProfile && creditProfile.totalFunded > 0
                                ? `${((parseFloat(creditProfile.activeLoanAmount) / parseFloat(creditProfile.totalFunded)) * 100).toFixed(0)}%`
                                : 'N/A'}
                            </div>
                          </Card>
                        </div>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
