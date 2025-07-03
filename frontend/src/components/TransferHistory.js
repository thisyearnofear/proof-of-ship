/**
 * TransferHistory Component
 * Displays a history of cross-chain transfers made through LI.FI
 */

import React, { useState, useEffect } from 'react';
import { useLiFi } from '../contexts/LiFiContext';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { ethers } from 'ethers';
import { Card } from './common/Card';
import { LoadingSpinner } from './common/LoadingStates';
import {
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

export default function TransferHistory() {
  const { transferHistory, updateTransferStatus, availableChains, loading } = useLiFi();
  const { account } = useMetaMask();
  const [expandedTransfer, setExpandedTransfer] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed', 'failed'

  // Refresh transfer statuses
  const refreshTransfers = async () => {
    setRefreshing(true);
    try {
      await updateTransferStatus();
    } catch (error) {
      console.error('Failed to refresh transfers:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Apply filter to transfer history
  const filteredHistory = transferHistory.filter(transfer => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['PENDING', 'ONGOING'].includes(transfer.status);
    if (filter === 'completed') return transfer.status === 'DONE';
    if (filter === 'failed') return transfer.status === 'FAILED';
    return true;
  });

  // Get chain details by chainId
  const getChainDetails = (chainId) => {
    const chain = availableChains.find(c => c.id === chainId);
    return chain || { name: `Chain #${chainId}`, icon: '🌐' };
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format status with appropriate icon and color
  const renderStatus = (status) => {
    switch (status) {
      case 'DONE':
        return (
          <span className="flex items-center text-green-600">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Complete
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center text-red-600">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Failed
          </span>
        );
      case 'PENDING':
        return (
          <span className="flex items-center text-yellow-600">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      case 'ONGOING':
        return (
          <span className="flex items-center text-blue-600">
            <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="flex items-center text-gray-600">
            <ClockIcon className="w-4 h-4 mr-1" />
            {status}
          </span>
        );
    }
  };

  // Format amount with token symbol
  const formatAmount = (amount, token) => {
    if (!token) return amount;
    return `${ethers.utils.formatUnits(amount, token.decimals || 6)} ${token.symbol || 'tokens'}`;
  };

  // Toggle expanded transfer details
  const toggleExpand = (id) => {
    if (expandedTransfer === id) {
      setExpandedTransfer(null);
    } else {
      setExpandedTransfer(id);
    }
  };

  return (
    <div id="transfer-history-section" className="space-y-4">
      <Card className="p-6 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Transfer History</h2>
          
          <div className="flex items-center space-x-2">
            <select
              className="p-2 border border-gray-300 rounded-md text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Transfers</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            
            <button
              onClick={refreshTransfers}
              disabled={refreshing}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md flex items-center text-sm"
            >
              {refreshing ? (
                <LoadingSpinner size="sm" className="mr-1" />
              ) : (
                <ArrowPathIcon className="w-4 h-4 mr-1" />
              )}
              Refresh
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!loading && filteredHistory.length === 0 && (
          <div className="p-6 text-center bg-white rounded-md">
            <p className="text-gray-500">No transfers found. Make a cross-chain transfer to see your history here.</p>
          </div>
        )}

        {!loading && filteredHistory.length > 0 && (
          <div className="space-y-4">
            {filteredHistory.map((transfer) => {
              const fromChain = getChainDetails(transfer.fromChainId);
              const toChain = getChainDetails(transfer.toChainId);
              
              return (
                <div key={transfer.id} className="p-4 bg-white rounded-md hover:shadow-md transition-shadow">
                  <div 
                    className="flex flex-col md:flex-row md:items-center justify-between cursor-pointer"
                    onClick={() => toggleExpand(transfer.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
                          <span>{fromChain.icon}</span>
                        </div>
                        <ArrowsRightLeftIcon className="w-4 h-4 mx-1 text-gray-400" />
                        <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
                          <span>{toChain.icon}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="font-medium">
                          {fromChain.name} → {toChain.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(transfer.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center mt-2 md:mt-0 md:space-x-4">
                      <div className="text-sm">
                        <div className="text-gray-500">Amount</div>
                        <div className="font-medium">
                          {formatAmount(transfer.fromAmount, transfer.fromToken)}
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <div className="text-gray-500">Status</div>
                        <div>{renderStatus(transfer.status)}</div>
                      </div>
                      
                      <div className="ml-2">
                        {expandedTransfer === transfer.id ? (
                          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedTransfer === transfer.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Transfer Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Transaction Hash:</span>
                              <a 
                                href={`https://etherscan.io/tx/${transfer.txHash}`} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 font-mono hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {transfer.txHash.substring(0, 10)}...{transfer.txHash.substring(transfer.txHash.length - 8)}
                              </a>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">Route:</span>
                              <span>{transfer.route}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">From:</span>
                              <span>{formatAmount(transfer.fromAmount, transfer.fromToken)}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">To (estimated):</span>
                              <span>{formatAmount(transfer.estimatedToAmount, transfer.toToken)}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">Estimated Duration:</span>
                              <span>{Math.floor((transfer.estimated.executionDuration || 180) / 60)} minutes</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Fee Breakdown</h4>
                          <div className="space-y-2 text-sm">
                            {transfer.estimated.feeCosts && transfer.estimated.feeCosts.length > 0 ? (
                              transfer.estimated.feeCosts.map((fee, index) => (
                                <div key={`fee-${index}`} className="flex justify-between">
                                  <span className="text-gray-500">{fee.name || `Fee ${index + 1}`}:</span>
                                  <span>
                                    {ethers.utils.formatUnits(fee.amount, fee.token?.decimals || 18)} {fee.token?.symbol}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500">No fee information available</div>
                            )}
                            
                            {transfer.estimated.gasCosts && transfer.estimated.gasCosts.length > 0 && (
                              <>
                                <div className="border-t border-gray-100 my-2 pt-2">
                                  <h5 className="font-medium text-gray-700 mb-1">Gas Costs</h5>
                                  {transfer.estimated.gasCosts.map((gas, index) => (
                                    <div key={`gas-${index}`} className="flex justify-between">
                                      <span className="text-gray-500">{gas.name || `Gas ${index + 1}`}:</span>
                                      <span>
                                        {ethers.utils.formatUnits(gas.amount, gas.token?.decimals || 18)} {gas.token?.symbol}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}