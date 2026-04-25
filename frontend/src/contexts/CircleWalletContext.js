/**
 * @deprecated CircleWalletContext.js - Merged into WalletContext.tsx
 * 
 * Use: import { useWallet } from '@/contexts/WalletContext';
 * 
 * Re-exports from WalletContext with backward compatibility additions.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useWallet } from './WalletContext';

const CircleWalletContext = createContext({
  isInitialized: false,
  error: null,
  loading: false,
  wallets: [],
  walletConfig: null,
  createWallet: async () => null,
  getWallets: async () => {},
  transferUSDC: async () => null,
  requestFunding: async () => null,
  checkAPIConfiguration: async () => false,
});

export const useCircleWallet = () => useContext(CircleWalletContext);

export const CircleWalletProvider = ({ children }) => {
  const wallet = useWallet();
  
  const requestFunding = async (amount, projectId) => {
    console.log('Funding request:', { amount, projectId });
    return { success: false, error: 'Not implemented' };
  };
  
  const checkAPIConfiguration = async () => {
    return wallet.circleConfig !== null;
  };

  const value = {
    isInitialized: wallet.circleConfig !== null,
    error: wallet.error,
    loading: wallet.loading,
    wallets: wallet.circleWallets || [],
    walletConfig: wallet.circleConfig,
    createWallet: wallet.createCircleWallet || (async () => null),
    getWallets: wallet.refreshCircleWallets || (async () => {}),
    transferUSDC: wallet.transferUSDC || (async () => null),
    requestFunding,
    checkAPIConfiguration,
  };

  return <CircleWalletContext.Provider value={value}>{children}</CircleWalletContext.Provider>;
};

export default CircleWalletContext;