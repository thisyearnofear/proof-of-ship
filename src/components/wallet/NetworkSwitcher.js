import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common';
import { useMetaMask } from '../../contexts/MetaMaskContext';
import { 
  GlobeAltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

// Network configurations with detailed information
const NETWORKS = {
  1: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io'],
    icon: '⟠',
    color: '#627eea',
    description: 'The main Ethereum network',
    gasPrice: 'High',
    recommended: true,
    features: ['DeFi', 'NFTs', 'Smart Contracts']
  },
  137: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://polygon-rpc.com/'],
    blockExplorerUrls: ['https://polygonscan.com'],
    icon: '⬟',
    color: '#8247e5',
    description: 'Fast and low-cost Ethereum scaling',
    gasPrice: 'Low',
    recommended: true,
    features: ['Low Fees', 'Fast Transactions', 'DeFi']
  },
  8453: {
    chainId: '0x2105',
    chainName: 'Base',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
    icon: '🔵',
    color: '#0052ff',
    description: 'Coinbase\'s L2 solution',
    gasPrice: 'Low',
    recommended: true,
    features: ['L2 Scaling', 'Low Fees', 'Coinbase Integration']
  },
  10: {
    chainId: '0xa',
    chainName: 'Optimism',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    icon: '🔴',
    color: '#ff0420',
    description: 'Optimistic rollup scaling solution',
    gasPrice: 'Low',
    recommended: false,
    features: ['L2 Scaling', 'Low Fees', 'Ethereum Compatible']
  },
  11155111: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18
    },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    icon: '🧪',
    color: '#627eea',
    description: 'Ethereum testnet for development',
    gasPrice: 'Free',
    recommended: false,
    features: ['Testing', 'Development', 'Free Transactions']
  }
};

// Network categories
const NETWORK_CATEGORIES = {
  mainnet: {
    title: 'Mainnet Networks',
    description: 'Production networks with real value',
    networks: [1, 137, 8453, 10]
  },
  testnet: {
    title: 'Testnet Networks',
    description: 'Development and testing networks',
    networks: [11155111]
  }
};

export const NetworkSwitcher = ({ 
  requiredNetwork = null,
  onNetworkSwitch,
  showRecommended = true,
  showTestnets = false,
  className = '' 
}) => {
  const { chainId, switchNetwork, provider } = useMetaMask();
  const [switching, setSwitching] = useState(null);
  const [error, setError] = useState(null);
  const [addingNetwork, setAddingNetwork] = useState(null);

  const currentChainId = chainId ? parseInt(chainId, 16) : null;
  const currentNetwork = currentChainId ? NETWORKS[currentChainId] : null;
  const isUnsupportedNetwork = currentChainId && !NETWORKS[currentChainId];

  // Handle network switch
  const handleNetworkSwitch = async (networkId) => {
    const network = NETWORKS[networkId];
    if (!network || !provider) return;

    setSwitching(networkId);
    setError(null);

    try {
      // Try to switch to the network
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });

      onNetworkSwitch?.(networkId);
    } catch (switchError) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          setAddingNetwork(networkId);
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: network.chainId,
              chainName: network.chainName,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: network.rpcUrls,
              blockExplorerUrls: network.blockExplorerUrls,
            }],
          });
          onNetworkSwitch?.(networkId);
        } catch (addError) {
          setError(`Failed to add ${network.chainName}: ${addError.message}`);
        } finally {
          setAddingNetwork(null);
        }
      } else {
        setError(`Failed to switch to ${network.chainName}: ${switchError.message}`);
      }
    } finally {
      setSwitching(null);
    }
  };

  // Get networks to display
  const getNetworksToDisplay = () => {
    const categories = [];
    
    if (showRecommended) {
      const recommendedNetworks = Object.entries(NETWORKS)
        .filter(([_, network]) => network.recommended)
        .map(([id]) => parseInt(id));
      
      categories.push({
        title: 'Recommended Networks',
        description: 'Best networks for funding and transactions',
        networks: recommendedNetworks
      });
    }

    categories.push(NETWORK_CATEGORIES.mainnet);
    
    if (showTestnets) {
      categories.push(NETWORK_CATEGORIES.testnet);
    }

    return categories;
  };

  const networkCategories = getNetworksToDisplay();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Network Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GlobeAltIcon className="h-5 w-5 mr-2" />
            Network Status
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {currentNetwork ? (
            <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: currentNetwork.color }}
                >
                  {currentNetwork.icon}
                </div>
                <div>
                  <h3 className="font-medium text-primary">{currentNetwork.chainName}</h3>
                  <p className="text-sm text-secondary">{currentNetwork.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-success-500" />
                <span className="text-sm font-medium text-success-600">Connected</span>
              </div>
            </div>
          ) : isUnsupportedNetwork ? (
            <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-warning-800 mb-1">Unsupported Network</h3>
                  <p className="text-sm text-warning-700">
                    You're connected to Chain ID {currentChainId}. Please switch to a supported network below.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-background-secondary rounded-lg text-center">
              <GlobeAltIcon className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-secondary">No network detected. Please connect your wallet.</p>
            </div>
          )}

          {/* Required Network Warning */}
          {requiredNetwork && currentChainId !== requiredNetwork && (
            <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-primary-800 mb-1">Network Switch Required</h4>
                  <p className="text-sm text-primary-700 mb-3">
                    This feature requires you to be on {NETWORKS[requiredNetwork]?.chainName}.
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleNetworkSwitch(requiredNetwork)}
                    loading={switching === requiredNetwork}
                  >
                    Switch to {NETWORKS[requiredNetwork]?.chainName}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Networks */}
      {networkCategories.map((category) => (
        <Card key={category.title}>
          <CardHeader>
            <CardTitle>{category.title}</CardTitle>
            <p className="text-sm text-secondary">{category.description}</p>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.networks.map((networkId) => {
                const network = NETWORKS[networkId];
                const isCurrent = currentChainId === networkId;
                const isSwitching = switching === networkId;
                const isAdding = addingNetwork === networkId;
                
                return (
                  <div
                    key={networkId}
                    className={`
                      p-4 border-2 rounded-lg transition-all duration-200 cursor-pointer
                      ${isCurrent 
                        ? 'border-success-300 bg-success-50' 
                        : 'border-border-secondary bg-surface hover:border-primary-300 hover:bg-primary-50'
                      }
                    `}
                    onClick={() => !isCurrent && handleNetworkSwitch(networkId)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: network.color }}
                        >
                          {network.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-primary">{network.chainName}</h3>
                          <p className="text-xs text-secondary">{network.description}</p>
                        </div>
                      </div>
                      
                      {isCurrent ? (
                        <CheckCircleIcon className="h-5 w-5 text-success-500" />
                      ) : (isSwitching || isAdding) ? (
                        <ArrowPathIcon className="h-5 w-5 text-primary-500 animate-spin" />
                      ) : null}
                    </div>

                    {/* Network Features */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {network.features.map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-background-secondary text-text-secondary"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Network Stats */}
                    <div className="flex justify-between text-xs text-secondary">
                      <span>Gas Price: {network.gasPrice}</span>
                      {network.recommended && (
                        <span className="text-success-600 font-medium">Recommended</span>
                      )}
                    </div>

                    {/* Action Button */}
                    {!isCurrent && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          fullWidth
                          loading={isSwitching || isAdding}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNetworkSwitch(networkId);
                          }}
                        >
                          {isAdding ? 'Adding Network...' : 
                           isSwitching ? 'Switching...' : 
                           'Switch Network'}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-error-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-error-800 mb-1">Network Switch Failed</h4>
                <p className="text-sm text-error-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-error-600 hover:text-error-700 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Information */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start">
            <BoltIcon className="h-5 w-5 text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-primary mb-1">Why Switch Networks?</h4>
              <ul className="text-sm text-secondary space-y-1">
                <li>• Different networks have different gas fees and transaction speeds</li>
                <li>• Some features may only be available on specific networks</li>
                <li>• Layer 2 networks (Polygon, Base) offer lower fees than Ethereum mainnet</li>
                <li>• Your tokens and NFTs may be on different networks</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkSwitcher;
