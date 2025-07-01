import React, { useState, useEffect } from 'react';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { usdcPaymentService, formatUSDC, getFundingTier } from '../lib/usdcPayments';
import { TransactionConfirmModal } from './wallet/TransactionConfirmModal';
import { useToast } from './common/Toast';
import { SuccessIllustration } from './common/illustrations/SuccessIllustration';

const FundingInterface = ({ creditScore, creditData, onFundingComplete }) => {
  const { connected, account, provider } = useMetaMask();
  const [fundingAmount, setFundingAmount] = useState(0);
  const [fundingHistory, setFundingHistory] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  

  const { promise: toastPromise } = useToast();

  useEffect(() => {
    if (creditScore) {
      const amount = usdcPaymentService.calculateFundingAmount(creditScore);
      setFundingAmount(amount);
    }
  }, [creditScore]);

  useEffect(() => {
    if (connected && account) {
      loadFundingHistory();
    }
  }, [connected, account]);

  const loadFundingHistory = async () => {
    try {
      const history = await usdcPaymentService.getFundingHistory(account);
      setFundingHistory(history);
    } catch (err) {
      console.error('Failed to load funding history:', err);
    }
  };

  const handleRequestFunding = async () => {
    if (!connected || !account) {
      toastError('Please connect your wallet first');
      return;
    }

    if (creditScore < 400) {
      toastError('Credit score too low for funding eligibility');
      return;
    }

    // Set transaction details and open confirmation modal
    setTransactionDetails({
      amount: fundingAmount,
      recipient: account,
      token: 'USDC',
      action: 'Funding Request',
    });
    setIsConfirmModalOpen(true);
    
  };

  const handleConfirmFunding = async () => {
    setIsConfirmModalOpen(false); // Close the confirmation modal immediately

    try {
      await toastPromise(
        usdcPaymentService.processDeveloperFunding(
          account,
          creditScore,
          creditData
        ),
        {
          loading: 'Processing funding request...',
          success: (result) => {
            setTransferId(result.transferId);
            setFundingStatus('success');
            if (onFundingComplete) {
              onFundingComplete(result);
            }
            loadFundingHistory(); // No await here, let it run in background
            return `Funding Approved! ${formatUSDC(result.amount)} USDC`;
          },
          error: (err) => {
            setFundingStatus('error');
            return `Funding failed: ${err.message}`;
          },
        }
      );
    } catch (err) {
      // toastPromise already handled the error display, no need to do anything here
      console.error("Funding process error:", err);
    }
  };

  

  const fundingTier = getFundingTier(creditScore);

  if (!connected) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Connect Wallet for Funding</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect your MetaMask wallet to access developer funding based on your credit score
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Funding Eligibility Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Developer Funding Eligibility</h3>
            <p className="mt-1 text-sm text-gray-500">
              Based on your credit score of {creditScore}
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${fundingTier.color}-100 text-${fundingTier.color}-800`}>
              {fundingTier.tier}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Funding Amount</span>
            <span className="text-2xl font-bold text-green-600">{formatUSDC(fundingAmount)}</span>
          </div>
          
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className={`bg-${fundingTier.color}-500 h-2 rounded-full transition-all duration-300`}
              style={{ width: `${(creditScore / 1000) * 100}%` }}
            ></div>
          </div>
          
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>$500 (Min)</span>
            <span>$5,000 (Max)</span>
          </div>
        </div>

        {/* Funding Requirements */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Funding Requirements</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <svg className={`h-4 w-4 ${creditScore >= 400 ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d={creditScore >= 400 ? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" : "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"} clipRule="evenodd" />
              </svg>
              <span className={`ml-2 text-sm ${creditScore >= 400 ? 'text-green-700' : 'text-red-700'}`}>
                Minimum credit score of 400 ({creditScore >= 400 ? 'Met' : 'Not Met'})
              </span>
            </div>
            <div className="flex items-center">
              <svg className={`h-4 w-4 ${connected ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d={connected ? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" : "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"} clipRule="evenodd" />
              </svg>
              <span className={`ml-2 text-sm ${connected ? 'text-green-700' : 'text-red-700'}`}>
                MetaMask wallet connected ({connected ? 'Connected' : 'Not Connected'})
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            onClick={handleRequestFunding}
            disabled={creditScore < 400 || !connected}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Request {formatUSDC(fundingAmount)} Funding
          </button>
        </div>
      </div>

      {/* Funding History */}
      {fundingHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Funding History</h3>
          <div className="space-y-3">
            {fundingHistory.map((funding, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatUSDC(funding.amount)}</p>
                  <p className="text-xs text-gray-500">{new Date(funding.date).toLocaleDateString()}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  funding.status === 'completed' ? 'bg-green-100 text-green-800' :
                  funding.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {funding.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <TransactionConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmFunding}
        transactionDetails={transactionDetails}
      />
    </div>
  );
};

export default FundingInterface;
