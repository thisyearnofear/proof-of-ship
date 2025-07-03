/**
 * Developer Dashboard Component
 * Displays developer credit profile, funded projects, and loan management
 */

import React, { useState, useEffect } from 'react';
import { useBuilderCredit } from '../contexts/BuilderCreditContext';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { Card } from './common/Card';
import Button from './common/Button';
import { LoadingSpinner } from './common/LoadingStates';
import ProjectDetails from './ProjectDetails';
import {
  UserCircleIcon,
  StarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function DeveloperDashboard() {
  const { account, connected } = useMetaMask();
  const {
    creditProfile,
    developerProjects,
    projectDetails,
    usdcBalance,
    loading: contractLoading,
    error: contractError,
    repayLoan,
    loadUserData,
    formatUSDC
  } = useBuilderCredit();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showRepayModal, setShowRepayModal] = useState(false);

  // Refresh data when account changes
  useEffect(() => {
    if (connected && account) {
      loadUserData();
    }
  }, [connected, account]);

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
    <div className="space-y-8">
      {/* Credit Profile Section */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Developer Credit Profile</h2>
        
        {creditProfile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Credit Score</div>
                  <div className={`text-2xl font-bold ${
                    creditProfile.creditScore >= 700 ? 'text-green-600' :
                    creditProfile.creditScore >= 500 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {creditProfile.creditScore}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  creditProfile.creditScore >= 700 ? 'bg-green-100' :
                  creditProfile.creditScore >= 500 ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  <StarIcon className={`w-6 h-6 ${
                    creditProfile.creditScore >= 700 ? 'text-green-600' :
                    creditProfile.creditScore >= 500 ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Funded</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${formatUSDC(creditProfile.totalFunded)}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Active Loan</div>
                  <div className="text-2xl font-bold text-purple-600">
                    ${formatUSDC(creditProfile.activeLoanAmount)}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Reputation</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {creditProfile.reputation}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-6 bg-gray-50">
            <div className="text-center text-gray-500">
              No credit profile found. Request funding to create your profile.
            </div>
          </Card>
        )}
        
        {/* Additional Credit Details */}
        {creditProfile && (
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Credit Details</h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                creditProfile.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {creditProfile.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Repaid:</span>
                <span className="font-medium text-gray-900">${formatUSDC(creditProfile.totalRepaid)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Loan:</span>
                <span className="font-medium text-gray-900">${formatUSDC(creditProfile.activeLoanAmount)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Funding Date:</span>
                <span className="font-medium text-gray-900">{formatDate(creditProfile.lastFundingTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">USDC Balance:</span>
                <span className="font-medium text-gray-900">${formatUSDC(usdcBalance)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Repayment Ratio:</span>
                <span className="font-medium text-gray-900">
                  {creditProfile.totalFunded > 0 
                    ? `${((parseFloat(creditProfile.totalRepaid) / parseFloat(creditProfile.totalFunded)) * 100).toFixed(1)}%` 
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Projects:</span>
                <span className="font-medium text-gray-900">{developerProjects?.length || 0}</span>
              </div>
            </div>
            
            {parseFloat(creditProfile.activeLoanAmount) > 0 && (
              <div className="mt-6">
                <Button
                  onClick={() => setShowRepayModal(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                >
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  Repay Loan
                </Button>
              </div>
            )}
          </Card>
        )}
      </section>

      {/* Success Message */}
      {success && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-2">
                Loan Repayment Successful!
              </h4>
              <p className="text-green-800 mb-3">
                You have repaid ${parseFloat(success.amount).toFixed(2)} USDC
              </p>
              
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

      {/* Project List and Details */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Projects</h2>
        
        {developerProjects && developerProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Project List */}
            <div className="md:col-span-1">
              <div className="space-y-3">
                {developerProjects.map((projectId) => {
                  const project = projectDetails[projectId];
                  if (!project) return null;
                  
                  return (
                    <Card 
                      key={projectId}
                      className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                        selectedProjectId === projectId ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleProjectSelect(projectId)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500">
                            ${formatUSDC(project.fundingAmount)} USDC
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(project.fundedAt)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
            
            {/* Project Details */}
            <div className="md:col-span-3">
              {selectedProjectId ? (
                <ProjectDetails 
                  projectId={selectedProjectId}
                  onMilestoneComplete={handleMilestoneComplete}
                />
              ) : (
                <Card className="p-6 bg-gray-50 text-center">
                  <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Project Selected</h3>
                  <p className="mt-2 text-gray-600">
                    Select a project from the list to view details
                  </p>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card className="p-6 bg-gray-50 text-center">
            <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Projects Found</h3>
            <p className="mt-2 text-gray-600">
              You haven't requested funding for any projects yet
            </p>
          </Card>
        )}
      </section>

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
    </div>
  );
}