import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common';
import { useMetaMask } from '../../contexts/MetaMaskContext';
import { 
  CurrencyDollarIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// USDC contract addresses for different networks
const USDC_CONTRACTS = {
  1: '0xA0b86a33E6441b8435b662f0E2d0B8A0E4B2B8B0', // Ethereum Mainnet
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // Optimism
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Sepolia Testnet
};

// Network-specific USDC information
const USDC_INFO = {
  1: { symbol: 'USDC', decimals: 6, name: 'USD Coin' },
  137: { symbol: 'USDC', decimals: 6, name: 'USD Coin (PoS)' },
  8453: { symbol: 'USDC', decimals: 6, name: 'USD Coin' },
  10: { symbol: 'USDC.e', decimals: 6, name: 'USD Coin (Bridged)' },
  11155111: { symbol: 'USDC', decimals: 6, name: 'USD Coin (Testnet)' }
};

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  }
];

export const USDCBalanceDisplay = ({ 
  showAddToken = true,
  showTransactionHistory = true,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  className = '' 
}) => {
  const { connected, account, chainId, provider } = useMetaMask();
  
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [addingToken, setAddingToken] = useState(false);

  const currentChainId = chainId ? parseInt(chainId, 16) : null;
  const usdcContract = currentChainId ? USDC_CONTRACTS[currentChainId] : null;
  const usdcInfo = currentChainId ? USDC_INFO[currentChainId] : null;

  // Fetch USDC balance
  const fetchBalance = useCallback(async () => {
    if (!connected || !account || !provider || !usdcContract) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create contract instance
      const contract = new provider.eth.Contract(ERC20_ABI, usdcContract);
      
      // Get balance
      const balanceWei = await contract.methods.balanceOf(account).call();
      
      // Convert from wei to USDC (6 decimals)
      const balanceUSDC = parseFloat(balanceWei) / Math.pow(10, usdcInfo.decimals);
      
      setBalance(balanceUSDC);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching USDC balance:', err);
      setError('Failed to fetch USDC balance');
    } finally {
      setLoading(false);
    }
  }, [connected, account, provider, usdcContract, usdcInfo]);

  // Auto-refresh balance
  useEffect(() => {
    if (autoRefresh && connected) {
      fetchBalance();
      const interval = setInterval(fetchBalance, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, autoRefresh, refreshInterval, connected]);

  // Initial balance fetch
  useEffect(() => {
    if (connected) {
      fetchBalance();
    }
  }, [connected, currentChainId, fetchBalance]);

  // Add USDC token to MetaMask
  const handleAddToken = async () => {
    if (!provider || !usdcContract || !usdcInfo) return;

    setAddingToken(true);
    try {
      await provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: usdcContract,
            symbol: usdcInfo.symbol,
            decimals: usdcInfo.decimals,
            image: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
          },
        },
      });
    } catch (err) {
      console.error('Error adding USDC token:', err);
    } finally {
      setAddingToken(false);
    }
  };

  // Format balance display
  const formatBalance = (balance) => {
    if (balance === null) return '--';
    if (balance === 0) return '0.00';
    if (balance < 0.01) return '< 0.01';
    return balance.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Get balance color based on amount
  const getBalanceColor = (balance) => {
    if (balance === null) return 'text-text-secondary';
    if (balance === 0) return 'text-text-tertiary';
    if (balance < 10) return 'text-warning-600';
    if (balance < 100) return 'text-primary-600';
    return 'text-success-600';
  };

  if (!connected) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <CurrencyDollarIcon className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-primary mb-2">USDC Balance</h3>
          <p className="text-secondary">Connect your wallet to view USDC balance</p>
        </CardContent>
      </Card>
    );
  }

  if (!usdcContract) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-warning-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-warning-800 mb-1">USDC Not Available</h4>
              <p className="text-sm text-warning-700">
                USDC is not available on the current network. Please switch to a supported network.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Balance Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2" />
              USDC Balance
            </CardTitle>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-1 text-text-secondary hover:text-primary transition-colors"
              >
                {balanceVisible ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchBalance}
                disabled={loading}
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="text-center mb-6">
            <div className={`text-4xl font-bold mb-2 ${getBalanceColor(balance)}`}>
              {balanceVisible ? (
                loading ? (
                  <div className="flex items-center justify-center">
                    <ArrowPathIcon className="h-8 w-8 animate-spin text-text-secondary" />
                  </div>
                ) : (
                  `$${formatBalance(balance)}`
                )
              ) : (
                '••••••'
              )}
            </div>
            <div className="text-sm text-secondary">
              {usdcInfo?.name} on {currentChainId === 1 ? 'Ethereum' : 
                                  currentChainId === 137 ? 'Polygon' :
                                  currentChainId === 8453 ? 'Base' :
                                  currentChainId === 10 ? 'Optimism' :
                                  'Network'}
            </div>
            {lastUpdated && (
              <div className="text-xs text-tertiary mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-error-500 mr-2" />
                <span className="text-sm text-error-700">{error}</span>
              </div>
            </div>
          )}

          {/* Balance Status */}
          {balance !== null && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-surface-secondary rounded-lg">
                <div className="text-sm text-secondary">Status</div>
                <div className={`font-medium ${
                  balance === 0 ? 'text-text-tertiary' :
                  balance < 10 ? 'text-warning-600' :
                  'text-success-600'
                }`}>
                  {balance === 0 ? 'Empty' :
                   balance < 10 ? 'Low Balance' :
                   'Sufficient'}
                </div>
              </div>
              
              <div className="text-center p-3 bg-surface-secondary rounded-lg">
                <div className="text-sm text-secondary">Network</div>
                <div className="font-medium text-primary">
                  {currentChainId === 1 ? 'Ethereum' :
                   currentChainId === 137 ? 'Polygon' :
                   currentChainId === 8453 ? 'Base' :
                   currentChainId === 10 ? 'Optimism' :
                   'Unknown'}
                </div>
              </div>
              
              <div className="text-center p-3 bg-surface-secondary rounded-lg">
                <div className="text-sm text-secondary">Token</div>
                <div className="font-medium text-primary">{usdcInfo?.symbol}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {showAddToken && (
              <Button
                variant="outline"
                onClick={handleAddToken}
                loading={addingToken}
                className="flex-1"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add USDC to Wallet
              </Button>
            )}
            
            <Button
              variant="ghost"
              onClick={() => window.open(`https://etherscan.io/address/${account}`, '_blank')}
              className="flex-1"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
              View on Explorer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Low Balance Warning */}
      {balance !== null && balance < 10 && balance > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-warning-800 mb-1">Low USDC Balance</h4>
                <p className="text-sm text-warning-700">
                  Your USDC balance is low. You may need to add more USDC to complete transactions or receive funding.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zero Balance Info */}
      {balance === 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-primary-800 mb-1">Get USDC</h4>
                <p className="text-sm text-primary-700 mb-3">
                  You don't have any USDC yet. Here are some ways to get USDC:
                </p>
                <ul className="text-sm text-primary-700 space-y-1">
                  <li>• Purchase USDC on a cryptocurrency exchange</li>
                  <li>• Receive USDC funding through our platform</li>
                  <li>• Bridge USDC from another network</li>
                  <li>• Swap other tokens for USDC using a DEX</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Information */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-text-secondary mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-primary mb-1">Contract Information</h4>
              <div className="text-sm text-secondary space-y-1">
                <div>Contract: <code className="bg-background-secondary px-1 rounded text-xs">{usdcContract}</code></div>
                <div>Symbol: {usdcInfo?.symbol}</div>
                <div>Decimals: {usdcInfo?.decimals}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default USDCBalanceDisplay;
