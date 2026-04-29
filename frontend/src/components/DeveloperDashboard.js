/**
 * Developer Dashboard Component
 * Displays developer credit profile, funded projects, and loan management
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useBuilderCredit } from '../contexts/WalletContext';
import { Card } from './common/Card';
import Button from './common/Button';
import { LoadingSpinner } from './common/LoadingStates';
import ProjectDetails from './ProjectDetails';
import VelocityGauge from './github/VelocityGauge';
import BackingPanel from './BackingPanel';
import { getEvolutionTier } from './projects/ProjectCard';
import {
  UserCircleIcon,
  StarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ExclamationCircleIcon,
  CpuChipIcon,
  GlobeAltIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

export default function DeveloperDashboard() {
  const { account, connected } = useWallet();
  const { coreContract, usdcContract, contractLoading, creditProfile, repayLoan, postCheckIn, loadUserData, formatUSDC, usdcBalance, developerProjects, projectDetails, contractError } = useBuilderCredit();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [checkInText, setCheckInText] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('1000');
  const [githubStreak, setGithubStreak] = useState(12); // Default mock value

  useEffect(() => {
    // Try to load GitHub streak from local storage if available
    const stored = localStorage.getItem('pos_user_profile');
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        if (profile.profiles?.github?.activity?.contributionStreak) {
          setGithubStreak(profile.profiles.github.activity.contributionStreak);
        }
      } catch (e) {
        console.error("Failed to parse profile for streak", e);
      }
    }
  }, []);

  const handleSimulatePrize = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Call distributePrize function from contract
      if (selectedProjectId && coreContract) {
        const tx = await coreContract.distributePrize(selectedProjectId, ethers.utils.parseUnits(prizeAmount, 6));
        await tx.wait();
        
        setSuccess({
          amount: prizeAmount,
          transactionHash: tx.hash,
          message: 'Prize distributed and backers repaid!'
        });
      } else {
        setError('Please select a project first');
      }

    } catch (err) {
      console.error('Failed to distribute prize:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCheckIn = async () => {
    if (!checkInText || !selectedProjectId) {
      setError('Please select a project and enter check-in details');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const result = await postCheckIn(selectedProjectId, checkInText);
      
      setSuccess({
        message: 'Heartbeat recorded! Your activity is now visible to backers.',
        transactionHash: result.transactionHash
      });

      setCheckInText('');
      // Trigger data reload
      if (loadUserData) loadUserData();

    } catch (err) {
      console.error('Failed to post check-in:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRepayLoan = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      setError('Please enter a valid repayment amount');
      return;
    }

    if (!creditProfile || !creditProfile.activeLoanAmount) {
      setError('No active loan to repay');
      return;
    }

    if (parseFloat(repayAmount) > parseFloat(creditProfile.activeLoanAmount)) {
      setError(`Maximum repayment amount is ${formatUSDC(creditProfile.activeLoanAmount)} USDC`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Call repayLoan function from context
      const result = await repayLoan(repayAmount);

      setSuccess({
        amount: repayAmount,
        transactionHash: result.transactionHash
      });

      // Reset form
      setRepayAmount('');
      setShowRepayModal(false);

    } catch (err) {
      console.error('Failed to repay loan:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId);
  };

  const handleMilestoneComplete = () => {
    // Refresh user data to get updated balances and credit profile
    loadUserData();
  };

  // Format date helper function
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!connected) {
    return (
      <Card className="p-6 text-center">
        <UserCircleIcon className="w-12 h-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Connect Your Wallet</h3>
        <p className="mt-2 text-gray-600">
          Please connect your wallet to view your developer dashboard
        </p>
      </Card>
    );
  }

  if (contractLoading || loading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (contractError || error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-start space-x-3">
          <ExclamationCircleIcon className="w-6 h-6 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 mb-1">Error</h4>
            <p className="text-red-800">{contractError || error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8 wave-pattern p-4 sm:p-6 lg:p-8 rounded-3xl">
      {/* Command Center Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CpuChipIcon className="w-8 h-8 text-blue-600" />
            COMMAND CENTER
          </h1>
          <p className="text-slate-500 font-medium">Fleet Operations & Engine Status</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Status</span>
            <span className="flex items-center gap-1.5 text-green-600 font-bold">
              <SignalIcon className="w-4 h-4 animate-pulse" />
              OPERATIONAL
            </span>
          </div>
          <div className="h-10 w-px bg-slate-200 mx-2" />
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Wallet</div>
            <div className="font-mono text-sm text-slate-700">{account.substring(0, 6)}...{account.substring(account.length - 4)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Engine Status (Credit Profile) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <SignalIcon className="w-5 h-5 text-blue-500" />
                ENGINE STATUS
              </h2>
            </div>
            
            {creditProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 maritime-depth bg-white/80 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credit Score</div>
                      <div className={`text-3xl font-black ${
                        creditProfile.creditScore >= 700 ? 'text-green-600' :
                        creditProfile.creditScore >= 500 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {creditProfile.creditScore}
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      creditProfile.creditScore >= 700 ? 'bg-green-100' :
                      creditProfile.creditScore >= 500 ? 'bg-yellow-100' :
                      'bg-red-100'
                    }`}>
                      <StarIcon className={`w-7 h-7 ${
                        creditProfile.creditScore >= 700 ? 'text-green-600' :
                        creditProfile.creditScore >= 500 ? 'text-yellow-600' :
                        'text-red-600'
                      }`} />
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 maritime-depth bg-white/80 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Funded</div>
                      <div className="text-3xl font-black text-blue-600">
                        ${formatUSDC(creditProfile.totalFunded)}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <CurrencyDollarIcon className="w-7 h-7 text-blue-600" />
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 maritime-depth bg-white/80 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Loan</div>
                      <div className="text-3xl font-black text-purple-600">
                        ${formatUSDC(creditProfile.activeLoanAmount)}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <ClockIcon className="w-7 h-7 text-purple-600" />
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 maritime-depth bg-white/80 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reputation</div>
                      <div className="text-3xl font-black text-indigo-600">
                        {creditProfile.reputation}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <ShieldCheckIcon className="w-7 h-7 text-indigo-600" />
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-6 bg-gray-50/50 backdrop-blur-sm border-dashed border-2">
                <div className="text-center text-gray-500 font-medium">
                  No credit profile found. Initialize engine by requesting funding.
                </div>
              </Card>
            )}
          </section>

          {/* Fleet Operations Section */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <GlobeAltIcon className="w-5 h-5 text-blue-500" />
              FLEET OPERATIONS
            </h2>
            
            {developerProjects && developerProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Project List */}
                <div className="md:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {developerProjects.map((projectId) => {
                    const project = projectDetails[projectId];
                    if (!project) return null;
                    const tier = getEvolutionTier(project.creditScore || 0);
                    
                    return (
                      <Card 
                        key={projectId}
                        className={`p-4 cursor-pointer hover:shadow-lg transition-all border-2 ${
                          selectedProjectId === projectId ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white/80'
                        } ${tier.class}`}
                        onClick={() => handleProjectSelect(projectId)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {tier.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 truncate">{project.name}</div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs font-bold text-blue-600">${formatUSDC(project.fundingAmount)}</span>
                              <div className="flex gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProjectId(projectId);
                                    setShowStakeModal(true);
                                  }}
                                  className="text-[10px] font-bold text-green-600 hover:text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-100"
                                >
                                  BOOST
                                </button>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{tier.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                
                {/* Project Details */}
                <div className="md:col-span-2">
                  {selectedProjectId ? (
                    <div className="maritime-depth rounded-2xl overflow-hidden bg-white/90">
                      <ProjectDetails 
                        projectId={selectedProjectId}
                        onMilestoneComplete={handleMilestoneComplete}
                      />
                    </div>
                  ) : (
                    <Card className="p-12 bg-white/50 border-dashed border-2 flex flex-col items-center justify-center text-center">
                      <DocumentTextIcon className="w-16 h-16 text-slate-300 mb-4" />
                      <h3 className="text-xl font-bold text-slate-800">No Vessel Selected</h3>
                      <p className="text-slate-500 max-w-xs mt-2">
                        Select a project from your fleet to view live telemetry and manage milestones.
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <Card className="p-12 bg-white/50 border-dashed border-2 text-center">
                <DocumentTextIcon className="w-16 h-16 mx-auto text-slate-300" />
                <h3 className="mt-4 text-xl font-bold text-slate-800">Fleet Empty</h3>
                <p className="mt-2 text-slate-500 max-w-md mx-auto">
                  You haven&apos;t commissioned any vessels yet. Start your journey by requesting funding for your first project.
                </p>
              </Card>
            )}
          </section>
        </div>

        {/* Right Column: Telemetry & Actions */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Velocity Gauge */}
          <Card className="p-6 maritime-depth bg-slate-900 text-white border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CpuChipIcon className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-black tracking-widest uppercase text-blue-400 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
              Live Telemetry
            </h3>
            <div className="flex justify-center py-4">
              <VelocityGauge value={githubStreak} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Uptime</div>
                <div className="text-lg font-black text-white">99.9%</div>
              </div>
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Latency</div>
                <div className="text-lg font-black text-white">24ms</div>
              </div>
            </div>
          </Card>

          {/* Voyage Log / Check-ins */}
          <section>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Voyage Log</h2>
            <Card className="p-4 bg-white/80 border-blue-100 border-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <h3 className="font-bold text-slate-800 text-sm">Post Heartbeat</h3>
              </div>
              <textarea
                value={checkInText}
                onChange={(e) => setCheckInText(e.target.value)}
                placeholder="What did you ship today? (e.g., 'Fixed auth bug', 'Deployed V1')"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-1 ring-blue-500 outline-none h-20 mb-3 resize-none"
              />
              <Button
                onClick={handlePostCheckIn}
                disabled={loading || !selectedProjectId || !checkInText}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2"
              >
                <SignalIcon className="w-4 h-4" />
                Broadcast Activity
              </Button>
              {!selectedProjectId && (
                <p className="text-[10px] text-slate-400 mt-2 text-center italic">Select a vessel to log activity</p>
              )}
            </Card>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Quick Commands</h2>
            <div className="space-y-3">
              {creditProfile && parseFloat(creditProfile.activeLoanAmount) > 0 && (
                <Button
                  onClick={() => setShowRepayModal(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 py-4 rounded-xl font-bold text-lg"
                >
                  <ArrowPathIcon className="w-6 h-6 mr-2" />
                  Repay Loan
                </Button>
              )}
              
              <Card className="p-4 bg-indigo-900 text-white border-none">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Prize Loop Sim</h3>
                  <div className="px-2 py-0.5 bg-indigo-500 rounded text-[10px] font-bold">DEMO</div>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={prizeAmount}
                      onChange={(e) => setPrizeAmount(e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-1 ring-blue-500 outline-none"
                      placeholder="Amount"
                    />
                    <Button
                      onClick={handleSimulatePrize}
                      disabled={loading || !selectedProjectId}
                      className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold px-4 rounded-lg"
                    >
                      Fire
                    </Button>
                  </div>
                  {!selectedProjectId && (
                    <p className="text-[10px] text-indigo-300 italic">Select a vessel to simulate prize payout</p>
                  )}
                </div>
              </Card>
            </div>
          </section>

          {/* System Logs / Status */}
          <Card className="p-4 bg-slate-50 border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">System Logs</h3>
            <div className="space-y-2 font-mono text-[10px]">
              <div className="flex gap-2 text-slate-500">
                <span className="text-blue-500">[SYS]</span>
                <span>Fleet initialized...</span>
              </div>
              <div className="flex gap-2 text-slate-500">
                <span className="text-blue-500">[SYS]</span>
                <span>Telemetry link active</span>
              </div>
              {success && (
                <div className="flex gap-2 text-green-600">
                  <span className="font-bold">[SUCCESS]</span>
                  <span>{success.message}</span>
                </div>
              )}
              {error && (
                <div className="flex gap-2 text-red-600">
                  <span className="font-bold">[ERROR]</span>
                  <span>{error}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Repay Loan Modal */}
      {showRepayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Repay Loan</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount to Repay (USDC)
              </label>
              <input
                type="number"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                max={creditProfile?.activeLoanAmount || 0}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              <div className="mt-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Active Loan:</span>
                  <span>${formatUSDC(creditProfile?.activeLoanAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Your USDC Balance:</span>
                  <span>${formatUSDC(usdcBalance)}</span>
                </div>
              </div>
              
              {error && (
                <div className="mt-2 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleRepayLoan}
                disabled={loading || !repayAmount || parseFloat(repayAmount) <= 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm Repayment'
                )}
              </Button>
              
              <Button
                onClick={() => {
                  setShowRepayModal(false);
                  setError(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Stake/Boost Modal */}
      {showStakeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowStakeModal(false)}>
          <div className="w-full max-w-lg animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 px-2">
              <h3 className="text-white font-bold flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5" />
                Boost Project Reputation
              </h3>
              <button onClick={() => setShowStakeModal(false)} className="text-white/70 hover:text-white">
                ✕
              </button>
            </div>
            <BackingPanel projectId={selectedProjectId} />
            <p className="mt-4 text-center text-xs text-white/60">
              Self-staking increases your reputation score and boosts your credit limit 2x.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}