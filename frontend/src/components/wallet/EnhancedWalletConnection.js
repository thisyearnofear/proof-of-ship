import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common';
import { useMetaMask } from '../../contexts/MetaMaskContext';
import { 
  WalletIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  LinkIcon,
  ShieldCheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Connection states
const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  UNSUPPORTED: 'unsupported'
};

// Error types with user-friendly messages
const ERROR_MESSAGES = {
  USER_REJECTED: {
    title: 'Connection Cancelled',
    message: 'You cancelled the connection request. Click "Connect Wallet" to try again.',
    action: 'Try Again',
    severity: 'warning'
  },
  UNAUTHORIZED: {
    title: 'Connection Unauthorized',
    message: 'Please unlock your MetaMask wallet and try connecting again.',
    action: 'Unlock & Connect',
    severity: 'warning'
  },
  UNSUPPORTED_CHAIN: {
    title: 'Unsupported Network',
    message: 'Please switch to a supported network (Ethereum, Polygon, or Base) in MetaMask.',
    action: 'Switch Network',
    severity: 'error'
  },
  METAMASK_NOT_INSTALLED: {
    title: 'MetaMask Not Found',
    message: 'MetaMask is not installed. Please install the MetaMask browser extension to continue.',
    action: 'Install MetaMask',
    severity: 'error'
  },
  NETWORK_ERROR: {
    title: 'Network Connection Error',
    message: 'Unable to connect to the blockchain network. Please check your internet connection.',
    action: 'Retry Connection',
    severity: 'error'
  },
  GENERIC_ERROR: {
    title: 'Connection Failed',
    message: 'An unexpected error occurred while connecting to MetaMask. Please try again.',
    action: 'Try Again',
    severity: 'error'
  }
};

// Supported networks
const SUPPORTED_NETWORKS = {
  1: { name: 'Ethereum Mainnet', color: '#627eea', icon: '⟠' },
  137: { name: 'Polygon', color: '#8247e5', icon: '⬟' },
  8453: { name: 'Base', color: '#0052ff', icon: '🔵' },
  11155111: { name: 'Sepolia Testnet', color: '#627eea', icon: '⟠' }
};

// Connection steps for user guidance
const CONNECTION_STEPS = [
  {
    id: 'install',
    title: 'Install MetaMask',
    description: 'Download and install the MetaMask browser extension',
    icon: '🦊',
    status: 'pending'
  },
  {
    id: 'unlock',
    title: 'Unlock Wallet',
    description: 'Open MetaMask and enter your password',
    icon: '🔓',
    status: 'pending'
  },
  {
    id: 'connect',
    title: 'Connect Account',
    description: 'Approve the connection request in MetaMask',
    icon: '🔗',
    status: 'pending'
  },
  {
    id: 'network',
    title: 'Verify Network',
    description: 'Ensure you\'re on a supported network',
    icon: '🌐',
    status: 'pending'
  }
];

export const EnhancedWalletConnection = ({ 
  onConnectionSuccess,
  onConnectionError,
  showNetworkInfo = true,
  showSteps = true,
  className = '' 
}) => {
  const {
    connected,
    connecting,
    account,
    chainId,
    balance,
    error: contextError,
    connect,
    disconnect,
    switchNetwork
  } = useMetaMask();

  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [steps, setSteps] = useState(CONNECTION_STEPS);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum?.isMetaMask;

  // Update connection state based on context
  useEffect(() => {
    if (connected) {
      setConnectionState(CONNECTION_STATES.CONNECTED);
      setError(null);
      updateStepsStatus('completed');
      onConnectionSuccess?.({ account, chainId, balance });
    } else if (connecting) {
      setConnectionState(CONNECTION_STATES.CONNECTING);
      updateStepsStatus('connecting');
    } else if (contextError) {
      setConnectionState(CONNECTION_STATES.ERROR);
      handleError(contextError);
    } else if (!isMetaMaskInstalled) {
      setConnectionState(CONNECTION_STATES.UNSUPPORTED);
      setError(ERROR_MESSAGES.METAMASK_NOT_INSTALLED);
    } else {
      setConnectionState(CONNECTION_STATES.DISCONNECTED);
      updateStepsStatus('pending');
    }
  }, [connected, connecting, contextError, account, chainId, balance, isMetaMaskInstalled]);

  // Handle different types of errors
  const handleError = (error) => {
    let errorInfo = ERROR_MESSAGES.GENERIC_ERROR;

    if (error.code === 4001 || error.message?.includes('User rejected')) {
      errorInfo = ERROR_MESSAGES.USER_REJECTED;
    } else if (error.code === -32002 || error.message?.includes('unauthorized')) {
      errorInfo = ERROR_MESSAGES.UNAUTHORIZED;
    } else if (error.code === 4902 || error.message?.includes('chain')) {
      errorInfo = ERROR_MESSAGES.UNSUPPORTED_CHAIN;
    } else if (error.message?.includes('network')) {
      errorInfo = ERROR_MESSAGES.NETWORK_ERROR;
    }

    setError(errorInfo);
    updateStepsStatus('error');
    onConnectionError?.(error);
  };

  // Update steps status
  const updateStepsStatus = (status) => {
    setSteps(prevSteps => 
      prevSteps.map(step => ({ ...step, status }))
    );
  };

  // Handle connection attempt
  const handleConnect = async () => {
    if (!isMetaMaskInstalled) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsRetrying(true);
    setError(null);
    
    try {
      await connect();
    } catch (err) {
      handleError(err);
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle network switch
  const handleNetworkSwitch = async (chainId) => {
    try {
      await switchNetwork(chainId);
    } catch (err) {
      handleError(err);
    }
  };

  // Get current network info
  const getCurrentNetwork = () => {
    if (!chainId) return null;
    return SUPPORTED_NETWORKS[parseInt(chainId, 16)] || {
      name: `Chain ${parseInt(chainId, 16)}`,
      color: '#6b7280',
      icon: '❓'
    };
  };

  const currentNetwork = getCurrentNetwork();
  const isUnsupportedNetwork = chainId && !SUPPORTED_NETWORKS[parseInt(chainId, 16)];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <WalletIcon className="h-5 w-5 mr-2" />
            MetaMask Wallet Connection
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Connection Status */}
          <div className="mb-6">
            {connectionState === CONNECTION_STATES.DISCONNECTED && (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-background-secondary rounded-full flex items-center justify-center">
                  <WalletIcon className="h-8 w-8 text-text-tertiary" />
                </div>
                <h3 className="text-lg font-medium text-primary mb-2">Connect Your Wallet</h3>
                <p className="text-secondary mb-4">
                  Connect your MetaMask wallet to access funding features and manage transactions
                </p>
                <Button
                  onClick={handleConnect}
                  variant="primary"
                  size="lg"
                  disabled={!isMetaMaskInstalled}
                >
                  {isMetaMaskInstalled ? 'Connect MetaMask' : 'Install MetaMask'}
                </Button>
              </div>
            )}

            {connectionState === CONNECTION_STATES.CONNECTING && (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                  <ArrowPathIcon className="h-8 w-8 text-primary-500 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-primary mb-2">Connecting...</h3>
                <p className="text-secondary">
                  Please check MetaMask and approve the connection request
                </p>
              </div>
            )}

            {connectionState === CONNECTION_STATES.CONNECTED && (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-success-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="h-8 w-8 text-success-500" />
                </div>
                <h3 className="text-lg font-medium text-success-600 mb-2">Wallet Connected</h3>
                <p className="text-secondary mb-4">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </p>
                
                {/* Network and Balance Info */}
                {showNetworkInfo && currentNetwork && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-3 bg-surface-secondary rounded-lg">
                      <div className="text-sm text-secondary">Network</div>
                      <div className="font-medium text-primary flex items-center">
                        <span className="mr-2">{currentNetwork.icon}</span>
                        {currentNetwork.name}
                      </div>
                    </div>
                    <div className="p-3 bg-surface-secondary rounded-lg">
                      <div className="text-sm text-secondary">Balance</div>
                      <div className="font-medium text-primary">
                        {balance ? `${balance.toFixed(4)} ETH` : 'Loading...'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-center mt-4">
                  <Button variant="ghost" onClick={disconnect}>
                    Disconnect Wallet
                  </Button>
                </div>
              </div>
            )}

            {connectionState === CONNECTION_STATES.ERROR && error && (
              <div className="text-center py-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  error.severity === 'error' ? 'bg-error-100' : 'bg-warning-100'
                }`}>
                  <ExclamationTriangleIcon className={`h-8 w-8 ${
                    error.severity === 'error' ? 'text-error-500' : 'text-warning-500'
                  }`} />
                </div>
                <h3 className={`text-lg font-medium mb-2 ${
                  error.severity === 'error' ? 'text-error-600' : 'text-warning-600'
                }`}>
                  {error.title}
                </h3>
                <p className="text-secondary mb-4">{error.message}</p>
                <Button
                  onClick={handleConnect}
                  variant={error.severity === 'error' ? 'danger' : 'warning'}
                  loading={isRetrying}
                >
                  {error.action}
                </Button>
              </div>
            )}

            {connectionState === CONNECTION_STATES.UNSUPPORTED && (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-error-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-error-500" />
                </div>
                <h3 className="text-lg font-medium text-error-600 mb-2">MetaMask Required</h3>
                <p className="text-secondary mb-4">
                  MetaMask browser extension is required to use this feature
                </p>
                <Button
                  onClick={() => window.open('https://metamask.io/download/', '_blank')}
                  variant="primary"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Install MetaMask
                </Button>
              </div>
            )}
          </div>

          {/* Unsupported Network Warning */}
          {connected && isUnsupportedNetwork && (
            <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-warning-800 mb-1">Unsupported Network</h4>
                  <p className="text-warning-700 text-sm mb-3">
                    You're connected to an unsupported network. Please switch to one of the supported networks below.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(SUPPORTED_NETWORKS).map(([id, network]) => (
                      <button
                        key={id}
                        onClick={() => handleNetworkSwitch(parseInt(id))}
                        className="inline-flex items-center px-3 py-1 bg-white border border-warning-300 rounded-md text-sm text-warning-800 hover:bg-warning-50"
                      >
                        <span className="mr-1">{network.icon}</span>
                        {network.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Steps Guide */}
      {showSteps && !connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              Connection Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start space-x-3">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${step.status === 'completed' ? 'bg-success-100 text-success-600' :
                      step.status === 'connecting' ? 'bg-primary-100 text-primary-600' :
                      step.status === 'error' ? 'bg-error-100 text-error-600' :
                      'bg-background-secondary text-text-tertiary'
                    }
                  `}>
                    {step.status === 'completed' ? '✓' : 
                     step.status === 'connecting' ? '⟳' :
                     step.status === 'error' ? '✗' : 
                     index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-primary">{step.title}</h4>
                    <p className="text-sm text-secondary">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start">
            <ShieldCheckIcon className="h-5 w-5 text-success-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-primary mb-1">Secure Connection</h4>
              <p className="text-sm text-secondary">
                Your wallet connection is secure and encrypted. We never store your private keys or have access to your funds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedWalletConnection;
