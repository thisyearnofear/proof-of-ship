/**
 * Circle Wallet Context
 * Frontend integration with Circle's Modular Wallets SDK
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const CircleWalletContext = createContext();

export const useCircleWallet = () => {
  const context = useContext(CircleWalletContext);
  if (!context) {
    throw new Error('useCircleWallet must be used within a CircleWalletProvider');
  }
  return context;
};

export const CircleWalletProvider = ({ children }) => {
  const [sdk, setSdk] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize Circle Wallet SDK
  useEffect(() => {
    initializeSDK();
  }, []);

  const initializeSDK = async () => {
    try {
      // Check if client key is available
      const clientKey = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY;
      
      if (!clientKey) {
        console.warn('Circle Client Key not found. Wallet features will be limited.');
        setError('Circle Client Key not configured');
        return;
      }

      // For hackathon demo, we'll simulate SDK initialization
      // In production, you would use the actual Circle Wallet SDK
      const mockSDK = {
        clientKey,
        environment: 'sandbox',
        isConfigured: true,
        
        // Mock methods for demo
        createWallet: async (config) => {
          return {
            id: `wallet-${Date.now()}`,
            address: `0x${Math.random().toString(16).substr(2, 40)}`,
            status: 'active',
            ...config
          };
        },
        
        getWallets: async () => {
          return wallets;
        },
        
        signTransaction: async (transaction) => {
          return {
            signature: `0x${Math.random().toString(16).substr(2, 128)}`,
            transaction
          };
        }
      };

      setSdk(mockSDK);
      setIsInitialized(true);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Circle Wallet SDK initialized (mock mode for hackathon)');
      }

    } catch (err) {
      console.error('Failed to initialize Circle Wallet SDK:', err);
      setError(err.message);
    }
  };

  const createWallet = async (config = {}) => {
    if (!sdk) {
      throw new Error('Circle Wallet SDK not initialized');
    }

    setLoading(true);
    try {
      const wallet = await sdk.createWallet({
        name: config.name || 'Developer Wallet',
        description: config.description || 'Wallet for developer funding',
        ...config
      });

      setWallets(prev => [...prev, wallet]);
      return wallet;
    } catch (err) {
      console.error('Failed to create wallet:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getWallets = async () => {
    if (!sdk) {
      throw new Error('Circle Wallet SDK not initialized');
    }

    setLoading(true);
    try {
      const userWallets = await sdk.getWallets();
      setWallets(userWallets);
      return userWallets;
    } catch (err) {
      console.error('Failed to get wallets:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signTransaction = async (transaction) => {
    if (!sdk) {
      throw new Error('Circle Wallet SDK not initialized');
    }

    try {
      return await sdk.signTransaction(transaction);
    } catch (err) {
      console.error('Failed to sign transaction:', err);
      throw err;
    }
  };

  const requestFunding = async (walletAddress, creditScore) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/funding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'processFunding',
          developerAddress: walletAddress,
          creditScore: creditScore
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Funding request failed');
      }

      return result;
    } catch (err) {
      console.error('Funding request failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getFundingHistory = async (walletAddress) => {
    try {
      const response = await fetch('/api/funding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getFundingHistory',
          developerAddress: walletAddress
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get funding history');
      }

      return result.history || [];
    } catch (err) {
      console.error('Failed to get funding history:', err);
      throw err;
    }
  };

  const value = {
    // SDK state
    sdk,
    isInitialized,
    error,
    loading,
    
    // Wallet management
    wallets,
    createWallet,
    getWallets,
    signTransaction,
    
    // Funding operations
    requestFunding,
    getFundingHistory,
    
    // Utilities
    isConfigured: () => !!process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY,
    getEnvironment: () => process.env.CIRCLE_ENVIRONMENT || 'sandbox'
  };

  return (
    <CircleWalletContext.Provider value={value}>
      {children}
    </CircleWalletContext.Provider>
  );
};
