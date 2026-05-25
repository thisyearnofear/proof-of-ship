/**
 * Funding Interface Component
 * Integrates with Circle Wallets for USDC funding operations
 */

import React, { useState, useEffect } from 'react';
import { useWallet, useCircleWallet } from '../contexts/WalletContext';
import { useBuilderCredit } from '../contexts/CreditContext';
import { Card } from './common/Card';
import Button from './common/Button';
import { LoadingSpinner } from './common/LoadingStates';
import SnsIdentityBadge from '@/components/common/SnsIdentityBadge';
import {
  CurrencyDollarIcon,
  WalletIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

export default function FundingInterface({ 
  creditScore, 
  creditData, 
  onFundingComplete 
}) {
  const wallet = useWallet();
  const builderCredit = useBuilderCredit();
  const circleWallet = useCircleWallet();
  
  const { activeChainFamily, account, connected, requestFunding, contractLoading } = builderCredit;
  const { getFundingHistory, isConfigured, getEnvironment, loading: circleLoading } = circleWallet;
  
  const [fundingAmount, setFundingAmount] = useState(0);
  const [fundingHistory, setFundingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Project form fields
  const [githubUrl, setGithubUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [selectedHackathons, setSelectedHackathons] = useState([1]);
  const [milestones, setMilestones] = useState([
    { description: '', reward: '' }
  ]);
  const [teamMembers, setTeamMembers] = useState([
    { address: account || '', share: 100 }
  ]);
  const [showProjectForm, setShowProjectForm] = useState(false);

  const availableHackathons = [
    { id: 1, name: 'Global DeFi Summit' },
    { id: 2, name: 'ETHGlobal Online' },
    { id: 3, name: 'Circle Hacker House' },
    { id: 4, name: 'Solana Grizzlython' }
  ];

  const toggleHackathon = (id) => {
    if (selectedHackathons.includes(id)) {
      if (selectedHackathons.length > 1) {
        setSelectedHackathons(selectedHackathons.filter(hId => hId !== id));
      }
    } else {
      if (selectedHackathons.length < 5) {
        setSelectedHackathons([...selectedHackathons, id]);
      }
    }
  };

  // Calculate funding amount based on credit score
  useEffect(() => {
    if (creditScore) {
      calculateFundingAmount(creditScore);
    }
  }, [creditScore]);

  // Load funding history
  useEffect(() => {
    if (account) {
      loadFundingHistory();
    }
  }, [account]);

  const calculateFundingAmount = (score) => {
    // Calculate funding amount based on credit score
    // Formula: linear interpolation between 400 (min score) and 800 (max score)
    let amount = 0;
    if (score < 400) {
      amount = 0; // Not eligible
    } else if (score >= 800) {
      amount = 5000; // Maximum funding
    } else {
      // Linear interpolation: score 400 = $500, score 800 = $5000
      const minFunding = 500;
      const maxFunding = 5000;
      const scoreRange = 800 - 400;
      const adjustedScore = score - 400;
      
      amount = Math.floor(minFunding + ((maxFunding - minFunding) * adjustedScore) / scoreRange);
    }
    
    setFundingAmount(amount);
  };

  const loadFundingHistory = async () => {
    try {
      const history = await circleWallet.getFundingHistory(account);
      setFundingHistory(history);
    } catch (err) {
      console.error('Failed to load funding history:', err);
    }
  };
  
  // Add a milestone field
  const addMilestone = () => {
    setMilestones([...milestones, { description: '', reward: '' }]);
  };
  
  // Remove a milestone field
  const removeMilestone = (index) => {
    const updatedMilestones = [...milestones];
    updatedMilestones.splice(index, 1);
    setMilestones(updatedMilestones);
  };
  
  // Update milestone field
  const updateMilestone = (index, field, value) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index][field] = value;
    setMilestones(updatedMilestones);
  };
  
  // Team member functions
  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { address: '', share: 0 }]);
  };
  
  const removeTeamMember = (index) => {
    const updated = [...teamMembers];
    updated.splice(index, 1);
    setTeamMembers(updated);
  };
  
  const updateTeamMember = (index, field, value) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
  };
  
  const validateProjectForm = () => {
    if (!githubUrl) {
      setError('GitHub URL is required');
      return false;
    }
    
    if (!projectName) {
      setError('Project name is required');
      return false;
    }
    
    // Check if all milestones have description and reward
    const invalidMilestone = milestones.find(m => !m.description || !m.reward);
    if (invalidMilestone) {
      setError('All milestones must have a description and reward amount');
      return false;
    }
    
    // Check if total milestone rewards exceeds funding amount
    const totalRewards = milestones.reduce((sum, m) => sum + Number(m.reward), 0);
    if (totalRewards > fundingAmount) {
      setError(`Total milestone rewards (${totalRewards}) cannot exceed funding amount (${fundingAmount})`);
      return false;
    }

    const totalShares = teamMembers.reduce((sum, m) => sum + (parseInt(m.share) || 0), 0);
    if (totalShares !== 100) {
      setError(`Total team shares must equal 100% (currently ${totalShares}%)`);
      return false;
    }
    
    return true;
  };

  const handleRequestFunding = async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    if (creditScore < 400) {
      setError('Credit score must be at least 400 to qualify for funding');
      return;
    }
    
    if (!showProjectForm) {
      setShowProjectForm(true);
      return;
    }
    
    if (!validateProjectForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Extract milestone descriptions and rewards
      const milestoneDescriptions = milestones.map(m => m.description);
      const milestoneRewards = milestones.map(m => m.reward);
      
      const memberAddresses = teamMembers.map(m => m.address);
      const memberShares = teamMembers.map(m => m.share);
      
      // Request funding with all required parameters
      const result = await requestFunding({
        githubUrl,
        projectName,
        milestoneDescriptions,
        milestoneAmounts: milestoneRewards,
        hackathonIds: selectedHackathons,
        teamMembers: memberAddresses,
        teamShares: memberShares
      });
      
      setSuccess({
        amount: result.amount || fundingAmount,
        transactionHash: result.transactionHash || result.hash,
        projectId: result.projectId || (result.projectData ? result.projectData.projectName : null),
        environment: activeChainFamily === 'solana' ? 'devnet' : getEnvironment()
      });

      // Refresh funding history
      await loadFundingHistory();

      // Reset form
      setGithubUrl('');
      setProjectName('');
      setMilestones([{ description: '', reward: '' }]);
      setShowProjectForm(false);

      // Notify parent component
      if (onFundingComplete) {
        onFundingComplete(result);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isEligible = creditScore >= 400;
  const environment = getEnvironment();

  return (
    <div className="space-y-6">
      {/* Configuration Status */}
      {!isConfigured() && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-2">
            <InformationCircleIcon className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 text-sm">
              Funding unavailable — Circle API credentials not configured. Set CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, and CIRCLE_WALLET_SET_ID to enable.
            </span>
          </div>
        </Card>
      )}

      {/* Environment Notice */}
      {activeChainFamily === 'solana' ? (
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-start space-x-2">
            <InformationCircleIcon className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="text-purple-800 text-sm">
              <div>Running on Solana Devnet. Cross-chain funding enabled.</div>
              {wallet.solanaAddress && (
                <div className="mt-1">
                  Creating projects as{" "}
                  <SnsIdentityBadge
                    address={wallet.solanaAddress}
                    chainFamily="solana"
                    showFallback={true}
                    showLoading={true}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : environment === 'sandbox' && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2">
            <InformationCircleIcon className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 text-sm">
              Running in sandbox mode. No real USDC will be transferred.
            </span>
          </div>
        </Card>
      )}

      {/* Funding Eligibility */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isEligible ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isEligible ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">
              Reputation-Backed Funding
            </h3>
            <p className="text-gray-600">
              {isEligible 
                ? `Your reputation grants you access to $${fundingAmount.toLocaleString()} USDC`
                : 'A credit score of 400+ is required to unlock initial funding'
              }
            </p>
          </div>
        </div>

        {/* Credit Score Display */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Current Credit Score</span>
            <span className={`text-2xl font-bold ${
              creditScore >= 700 ? 'text-green-600' :
              creditScore >= 500 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {creditScore}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full ${
                creditScore >= 700 ? 'bg-green-500' :
                creditScore >= 500 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min((creditScore / 850) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Funding Amount Breakdown */}
        {isEligible && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${fundingAmount.toLocaleString()}
              </div>
              <div className="text-sm text-blue-800">Base Funding Capacity</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">USDC</div>
              <div className="text-sm text-green-800">Stable Currency</div>
            </div>
          </div>
        )}

        {/* Project Form */}
        {showProjectForm && (
          <div className="mt-6 mb-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-lg font-medium text-primary mb-4">Project Details</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Hackathons (Expedition Mode)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableHackathons.map(h => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggleHackathon(h.id)}
                      className={`px-3 py-2 text-xs font-medium rounded-md border ${
                        selectedHackathons.includes(h.id)
                          ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Select up to 5 hackathons. Verifiers from any of these can approve your milestones.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub URL
                </label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Milestones
                  </label>
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Milestone
                  </button>
                </div>
                
                <div className="space-y-3">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          placeholder="Milestone description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="w-1/4">
                        <input
                          type="number"
                          value={milestone.reward}
                          onChange={(e) => updateMilestone(index, 'reward', e.target.value)}
                          placeholder="USDC"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  Total milestone rewards: ${milestones.reduce((sum, m) => sum + (Number(m.reward) || 0), 0)} / ${fundingAmount}
                </div>
              </div>

              {/* Fleet Management (Team Members) */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Fleet Management (Team Shares)
                  </label>
                  <button
                    type="button"
                    onClick={addTeamMember}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Member
                  </button>
                </div>
                
                <div className="space-y-3">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="flex items-start space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Wallet Address</label>
                        <input
                          type="text"
                          value={member.address}
                          onChange={(e) => updateTeamMember(index, 'address', e.target.value)}
                          placeholder="0x..."
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="w-1/4">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Share %</label>
                        <input
                          type="number"
                          value={member.share}
                          onChange={(e) => updateTeamMember(index, 'share', e.target.value)}
                          placeholder="%"
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      {teamMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTeamMember(index)}
                          className="mt-5 inline-flex items-center p-1 text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Milestone payouts will be split automatically.</span>
                  <div className={`text-xs font-bold ${
                    teamMembers.reduce((sum, m) => sum + (parseInt(m.share) || 0), 0) === 100 
                    ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    Total: {teamMembers.reduce((sum, m) => sum + (parseInt(m.share) || 0), 0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Button */}
        <Button
          onClick={handleRequestFunding}
          disabled={!isEligible || loading || circleLoading || contractLoading || !account}
          className={`w-full ${
            isEligible
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading || circleLoading || contractLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CurrencyDollarIcon className="w-5 h-5 mr-2" />
              {isEligible ? (showProjectForm ? 'Submit Funding Request' : 'Request Funding') : 'Not Eligible'}
            </>
          )}
        </Button>
      </Card>

      {/* Success Message */}
      {success && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="w-6 h-6 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-2">
                Funding Request Successful!
              </h4>
              <p className="text-green-800 mb-3">
                ${success.amount.toLocaleString()} USDC has been {environment === 'sandbox' ? 'simulated for transfer' : 'transferred'} to your wallet.
              </p>
              
              {success.projectId && (
                <div className="bg-white bg-opacity-50 rounded-lg p-3 mb-2">
                  <div className="text-sm">
                    <div className="font-medium text-green-900">Project ID:</div>
                    <div className="font-mono text-xs text-green-700 break-all">
                      {success.projectId}
                    </div>
                  </div>
                </div>
              )}
              
              {success.transactionHash && (
                <div className="bg-white bg-opacity-50 rounded-lg p-3">
                  <div className="text-sm">
                    <div className="font-medium text-green-900">Transaction Hash:</div>
                    <div className="font-mono text-xs text-green-700 break-all">
                      {success.transactionHash}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">
                Funding Request Failed
              </h4>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Funding History */}
      {fundingHistory.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-primary mb-4">
            Funding History
          </h4>
          <div className="space-y-3">
            {fundingHistory.map((funding, index) => (
              <div key={funding.projectId || index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <WalletIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-primary">
                        {funding.name || `Project #${funding.projectId}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {funding.timestamp ? new Date(funding.timestamp).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      funding.status === 'completed' || funding.status === 'complete'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {funding.status}
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      ${funding.amount} USDC
                    </span>
                  </div>
                </div>
                
                {/* Project details expandable section */}
                {funding.projectId && (
                  <div className="mt-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Project ID: {funding.projectId}</span>
                      <a
                        href={`#view-project-${funding.projectId}`}
                        className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-900"
                        onClick={(e) => {
                          e.preventDefault();
                          // Logic to view project details could be added here
                        }}
                      >
                        <span>View Details</span>
                        <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Integration Status */}
      <Card className="p-4 bg-gray-50">
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            activeChainFamily === 'solana' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {activeChainFamily === 'solana' ? 'Solana Integration' : 'Circle USDC Integration'}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            {activeChainFamily === 'solana' ? 'Devnet Mode' : (environment === 'sandbox' ? 'Testnet Mode' : 'Mainnet Mode')}
          </span>
          {isConfigured() && activeChainFamily !== 'solana' && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              API Configured
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
