import React, { useState, useEffect } from 'react';
import { crossChainUSDCService } from '../lib/lifiIntegration';
import { useMetaMask } from '../contexts/MetaMaskContext';
import Button from './common/Button';
import { Card } from './common/Card';
import { LoadingSpinner } from './common/LoadingStates';

export default function CrossChainFunding({ creditScore, developerAddress, onFundingComplete }) {
  const { account, provider } = useMetaMask();
  const [supportedChains, setSupportedChains] = useState([]);
  const [selectedChains, setSelectedChains] = useState([]);
  const [fundingAmount, setFundingAmount] = useState(0);
  const [distributionPlan, setDistributionPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transferStatus, setTransferStatus] = useState({});

  useEffect(() => {
    loadSupportedChains();
    calculateFundingAmount();
  }, [creditScore]);

  const loadSupportedChains = async () => {
    try {
      const chains = await crossChainUSDCService.getSupportedChains();
      setSupportedChains(chains);
      // Default to Ethereum and Linea
      setSelectedChains([1, 59144]);
    } catch (error) {
      console.error('Error loading supported chains:', error);
    }
  };

  const calculateFundingAmount = () => {
    if (creditScore < 400) {
      setFundingAmount(0);
      return;
    }
    
    // Same logic as smart contract
    const MIN_FUNDING = 500;
    const MAX_FUNDING = 5000;
    
    if (creditScore >= 800) {
      setFundingAmount(MAX_FUNDING);
      return;
    }
    
    const range = MAX_FUNDING - MIN_FUNDING;
    const scoreRange = 800 - 400;
    const adjustedScore = creditScore - 400;
    
    const amount = MIN_FUNDING + (range * adjustedScore) / scoreRange;
    setFundingAmount(Math.floor(amount));
  };

  const handleChainSelection = (chainId) => {
    setSelectedChains(prev => {
      if (prev.includes(chainId)) {
        return prev.filter(id => id !== chainId);
      } else {
        return [...prev, chainId];
      }
    });
  };

  const planDistribution = async () => {
    if (!selectedChains.length || !fundingAmount) return;

    setIsLoading(true);
    try {
      const plan = await crossChainUSDCService.fundDeveloperMultichain({
        developerAddress: developerAddress || account,
        totalAmount: fundingAmount,
        preferredChains: selectedChains,
        sourceChainId: 1, // Ethereum as source
        sourceTokenAddress: '0xA0b86a33E6441b8435b662c8C1e8d2E1c4C8b4B2' // USDC on Ethereum
      });

      setDistributionPlan(plan);
    } catch (error) {
      console.error('Error planning distribution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeFunding = async () => {
    if (!distributionPlan || !provider) return;

    setIsLoading(true);
    try {
      const signer = provider.getSigner();
      const results = [];

      for (const distribution of distributionPlan.distribution) {
        if (distribution.type === 'cross-chain' && distribution.quote) {
          setTransferStatus(prev => ({
            ...prev,
            [distribution.chainId]: 'executing'
          }));

          const result = await crossChainUSDCService.executeTransfer(
            distribution.quote.route,
            signer
          );

          results.push({
            chainId: distribution.chainId,
            ...result
          });

          setTransferStatus(prev => ({
            ...prev,
            [distribution.chainId]: result.success ? 'completed' : 'failed'
          }));
        }
      }

      onFundingComplete({
        success: true,
        totalAmount: fundingAmount,
        distributions: results,
        chains: selectedChains
      });

    } catch (error) {
      console.error('Error executing funding:', error);
      onFundingComplete({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getChainName = (chainId) => {
    const chain = supportedChains.find(c => c.id === chainId);
    return chain?.name || `Chain ${chainId}`;
  };

  if (creditScore < 400) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Funding Not Available
          </h3>
          <p className="text-gray-600">
            Credit score must be at least 400 to qualify for funding.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Funding Summary */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Cross-Chain USDC Funding</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Credit Score</p>
            <p className="text-2xl font-bold text-green-600">{creditScore}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Eligible Amount</p>
            <p className="text-2xl font-bold text-blue-600">${fundingAmount} USDC</p>
          </div>
        </div>
      </Card>

      {/* Chain Selection */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Select Target Chains</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {supportedChains.slice(0, 6).map(chain => (
            <label key={chain.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedChains.includes(chain.id)}
                onChange={() => handleChainSelection(chain.id)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{chain.name}</span>
            </label>
          ))}
        </div>
        
        <div className="mt-4">
          <Button
            onClick={planDistribution}
            disabled={!selectedChains.length || isLoading}
            className="w-full"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Plan Distribution'}
          </Button>
        </div>
      </Card>

      {/* Distribution Plan */}
      {distributionPlan && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Distribution Plan</h4>
          <div className="space-y-3">
            {distributionPlan.distribution.map((dist, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{getChainName(dist.chainId)}</p>
                  <p className="text-sm text-gray-600">
                    {dist.type === 'direct' ? 'Direct Transfer' : 'Cross-Chain via LI.FI'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${dist.amount} USDC</p>
                  {transferStatus[dist.chainId] && (
                    <p className={`text-xs ${
                      transferStatus[dist.chainId] === 'completed' ? 'text-green-600' :
                      transferStatus[dist.chainId] === 'failed' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {transferStatus[dist.chainId]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button
              onClick={executeFunding}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Executing Transfers...</span>
                </div>
              ) : (
                'Execute Cross-Chain Funding'
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Integration Badges */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            MetaMask SDK
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Circle USDC
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
            LI.FI Cross-Chain
          </span>
        </div>
      </Card>
    </div>
  );
}
