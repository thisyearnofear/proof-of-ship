import React, { useState, useEffect } from 'react';
import { crossChainUSDCService } from '../lib/lifiIntegration';
import { usdcPaymentService } from '../lib/usdcPayments';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { useCircleWallet } from '../contexts/CircleWalletContext';
import Button from './common/Button';
import { Card } from './common/Card';
import { LoadingSpinner } from './common/LoadingStates';

export default function CrossChainFunding({ creditScore, developerAddress, onFundingComplete }) {
  const { account, provider } = useMetaMask();
  const { requestFunding, checkAPIConfiguration } = useCircleWallet();
  const [supportedChains, setSupportedChains] = useState([]);
  const [selectedChains, setSelectedChains] = useState([]);
  const [fundingAmount, setFundingAmount] = useState(0);
  const [distributionPlan, setDistributionPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transferStatus, setTransferStatus] = useState({});
  const [fundingMode, setFundingMode] = useState('cross-chain'); // 'cross-chain' or 'direct'
  const [apiConfig, setApiConfig] = useState(null);

  useEffect(() => {
    loadSupportedChains();
    calculateFundingAmount();
    checkCircleAPIConfig();
  }, [creditScore]);

  const checkCircleAPIConfig = async () => {
    try {
      const config = await checkAPIConfiguration();
      setApiConfig(config);
    } catch (error) {
      console.error('Error checking API configuration:', error);
    }
  };

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
    // Use the same calculation logic as the USDC payment service for consistency
    const amount = usdcPaymentService.calculateFundingAmount(creditScore);
    setFundingAmount(amount);
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
        chains: selectedChains,
        mode: 'cross-chain'
      });

    } catch (error) {
      console.error('Error executing funding:', error);
      onFundingComplete({
        success: false,
        error: error.message,
        mode: 'cross-chain'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeDirectFunding = async () => {
    setIsLoading(true);
    try {
      const result = await requestFunding(
        developerAddress || account,
        creditScore
      );

      onFundingComplete({
        success: result.success,
        totalAmount: result.amount,
        transfer: result.transfer,
        mode: 'direct'
      });

    } catch (error) {
      console.error('Error executing direct funding:', error);
      onFundingComplete({
        success: false,
        error: error.message,
        mode: 'direct'
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
        <h3 className="text-xl font-semibold mb-4">USDC Funding Options</h3>
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

        {/* Funding Mode Selection */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Funding Method</p>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="fundingMode"
                value="direct"
                checked={fundingMode === 'direct'}
                onChange={(e) => setFundingMode(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm">
                Direct Transfer (Circle API)
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="fundingMode"
                value="cross-chain"
                checked={fundingMode === 'cross-chain'}
                onChange={(e) => setFundingMode(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm">Cross-Chain Distribution (LI.FI)</span>
            </label>
          </div>
        </div>

        {/* API Status */}
        {apiConfig && (
          <div className={`p-3 rounded-lg text-sm ${
            apiConfig.configured 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}>
            {apiConfig.message}
          </div>
        )}
      </Card>

      {/* Direct Funding Option */}
      {fundingMode === 'direct' && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Direct USDC Transfer</h4>
          <p className="text-gray-600 mb-4">
            Receive funding directly to your wallet using Circle's infrastructure.
          </p>
          
          <Button
            onClick={executeDirectFunding}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Processing...</span>
              </div>
            ) : (
              `Request $${fundingAmount} USDC`
            )}
          </Button>
        </Card>
      )}

      {/* Cross-Chain Funding Option */}
      {fundingMode === 'cross-chain' && (
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
      )}

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
