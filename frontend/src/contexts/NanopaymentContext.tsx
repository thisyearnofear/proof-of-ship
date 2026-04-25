/**
 * @deprecated NanopaymentContext.tsx - Merged into WalletContext.tsx
 * 
 * Use: import { useWallet } from '@/contexts/WalletContext';
 * 
 * Re-exports from WalletContext with backward compatibility API mapping.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet } from './WalletContext';

const NanopaymentContext = createContext({
  isInitialized: false,
  loading: false,
  error: null,
  balance: { available: '0', locked: '0' },
  walletAddress: null,
  transactions: [],
  streamingPayment: null,
  agentPrices: { underwrite: 0.05, scout: 0.01, verify: 0.001, rebalance: 0.01 },
  initializeWithKey: async () => {},
  initializeWithDemo: async () => {},
  deposit: async () => ({}),
  fetchBalance: async () => {},
  payForAgent: async () => ({}),
  payForHealthScore: async () => ({}),
  payForScout: async () => ({}),
  payForVerification: async () => ({}),
  payForRebalance: async () => ({}),
});

export const useNanopayment = () => useContext(NanopaymentContext);

export const NanopaymentProvider = ({ children }) => {
  const wallet = useWallet();

  // Map WalletContext nanopayment to NanopaymentContext API
  const value = {
    isInitialized: wallet.nanopaymentInitialized,
    loading: wallet.loading,
    error: wallet.error,
    balance: wallet.nanopaymentBalance,
    walletAddress: wallet.nanopaymentAddress,
    transactions: wallet.nanopaymentTransactions || [],
    streamingPayment: null,
    agentPrices: { underwrite: 0.05, scout: 0.01, verify: 0.001, rebalance: 0.01 },
    initializeWithKey: wallet.initializeNanopayment,
    initializeWithDemo: wallet.initializeNanopaymentDemo,
    deposit: wallet.depositNanopayment,
    fetchBalance: async () => {}, // Not exposed
    payForAgent: wallet.payForAgent,
    payForHealthScore: wallet.payForHealthScore,
    payForScout: wallet.payForScout,
    payForVerification: wallet.payForVerification,
    payForRebalance: wallet.payForRebalance,
  };

  return <NanopaymentContext.Provider value={value}>{children}</NanopaymentContext.Provider>;
};

export default NanopaymentContext;