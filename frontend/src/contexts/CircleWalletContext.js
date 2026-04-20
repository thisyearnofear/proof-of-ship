/**
 * Circle Wallet Context
 * Frontend integration with Circle's Modular Wallets SDK
 * Refactored to use walletService (Phase 2B)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { walletService } from '../services/walletService';

const CircleWalletContext = createContext();

export const useCircleWallet = () => {
  const context = useContext(CircleWalletContext);
  if (!context) {
    throw new Error('useCircleWallet must be used within a CircleWalletProvider');
  }
  return context;
};

export const CircleWalletProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [walletConfig, setWalletConfig] = useState(null);

  // Initialize Circle Wallet Service
  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      setLoading(true);
      
      // Get wallet configuration from the API
      const config = await walletService.getConfig();
      if (!config.success) {
        throw new Error(config.error || 'Failed to load wallet configuration');
      }
      setWalletConfig(config.data);
      
      // Check API status
      const status = await walletService.getStatus();
      if (!status.success) {
        setError(status.error || 'Circle API connection failed');
        return;
      }
      
      setIsInitialized(true);
      
      // Load existing wallets
      await getWallets();

    } catch (err) {
      console.error('Circle initialization error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getWallets = async () => {
    setLoading(true);
    try {
      const result = await walletService.getWallets();
      if (result.success) {
        setWallets(result.data.wallets || []);
      }
    } catch (err) {
      console.error('Failed to fetch wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async (config = {}) => {
    if (!isInitialized) {
      throw new Error('Circle Wallet context not initialized');
    }

    setLoading(true);
    try {
      const walletParams = {
        idempotencyKey: `wallet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        metadata: {
          name: config.name || 'Developer Wallet',
          userId: config.userId || 'anonymous',
          ...config.metadata
        }
      };

      const result = await walletService.createWallet(walletParams);
      if (result.success) {
        await getWallets();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create wallet');
      }
    } catch (err) {
      console.error('Wallet creation failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const transferUSDC = async (amount, destinationAddress, walletId, reason) => {
    setLoading(true);
    try {
      const transferRequest = {
        idempotencyKey: `transfer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        walletId,
        amount: amount.toString(),
        destinationAddress,
        metadata: { reason: reason || 'Transfer' }
      };

      const result = await walletService.transferUSDC(transferRequest);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Transfer failed');
      }
    } catch (err) {
      console.error('USDC transfer failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    isInitialized,
    error,
    loading,
    wallets,
    walletConfig,
    createWallet,
    getWallets,
    transferUSDC,
  };

  return (
    <CircleWalletContext.Provider value={value}>
      {children}
    </CircleWalletContext.Provider>
  );
};

export default CircleWalletContext;
