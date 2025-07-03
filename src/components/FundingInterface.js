/**
 * Funding Interface Component
 * Integrates with Circle Wallets for USDC funding operations
 */

import React, { useState, useEffect } from 'react';
import { useCircleWallet } from '../contexts/CircleWalletContext';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { Card } from './common/Card';
import Button from './common/Button';
import { LoadingSpinner } from './common/LoadingStates';
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
  const { account } = useMetaMask();
  const { 
    requestFunding, 
    getFundingHistory, 
    isConfigured, 
    getEnvironment,
    loading: circleLoading 
  } = useCircleWallet();
  
  const [fundingAmount, setFundingAmount] = useState(0);
  const [fundingHistory, setFundingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Calculate funding amount based on credit score
  useEffect(() => {
    if (creditScore) {
      const amount = calculateFundingAmount(creditScore);
      setFundingAmount(amount);
    }
  }, [creditScore]);

  // Load funding history
  useEffect(() => {
    if (account) {
      loadFundingHistory();
    }
  }, [account]);

  const calculateFundingAmount = (score) => {
    if (score < 400) return 0;
    if (score >= 800) return 5000;
    
    const minFunding = 500;
    const maxFunding = 5000;
    const range = maxFunding - minFunding;
    const scoreRange = 800 - 400;
    const adjustedScore = score - 400;
    
    return Math.floor(minFunding + (range * adjustedScore) / scoreRange);
  };

  const loadFundingHistory = async () => {
    try {
      const history = await getFundingHistory(account);
      setFundingHistory(history);
    } catch (err) {
      console.error('Failed to load funding history:', err);
    }
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

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await requestFunding(account, creditScore);
      
      setSuccess({
        amount: result.amount,
        transactionHash: result.transfer?.transactionHash,
        transferId: result.transfer?.id,
        environment: result.environment
      });

      // Refresh funding history
      await loadFundingHistory();

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
              Circle API not configured. Funding features are in demo mode.
            </span>
          </div>
        </Card>
      )}

      {/* Environment Notice */}
      {environment === 'sandbox' && (
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
            <h3 className="text-lg font-semibold text-gray-900">
              Funding Eligibility
            </h3>
            <p className="text-gray-600">
              {isEligible 
                ? `You qualify for up to $${fundingAmount.toLocaleString()} USDC`
                : 'Credit score of 400+ required for funding'
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
              <div className="text-sm text-blue-800">Available Funding</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">USDC</div>
              <div className="text-sm text-green-800">Stable Currency</div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleRequestFunding}
          disabled={!isEligible || loading || circleLoading || !account}
          className={`w-full ${
            isEligible 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading || circleLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CurrencyDollarIcon className="w-5 h-5 mr-2" />
              {isEligible ? 'Request Funding' : 'Not Eligible'}
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
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Funding History
          </h4>
          <div className="space-y-3">
            {fundingHistory.map((funding, index) => (
              <div key={funding.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <WalletIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">
                      ${funding.amount} {funding.currency}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(funding.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    funding.status === 'complete' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {funding.status}
                  </span>
                  {funding.creditScore && (
                    <span className="text-sm text-gray-500">
                      Score: {funding.creditScore}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Integration Status */}
      <Card className="p-4 bg-gray-50">
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            Circle USDC Integration
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            {environment === 'sandbox' ? 'Testnet Mode' : 'Mainnet Mode'}
          </span>
          {isConfigured() && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              API Configured
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
