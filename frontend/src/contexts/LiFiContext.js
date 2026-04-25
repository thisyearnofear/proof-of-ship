/**
 * @deprecated LiFiContext.js - Merged into FinancialContext.tsx
 * 
 * Use: import { useFinancial } from '@/contexts/FinancialContext';
 * 
 * Re-exports from FinancialContext with backward compatibility API mapping.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useFinancial } from './FinancialContext';

const LiFiContext = createContext({
  isInitialized: false,
  availableChains: [],
  availableTokens: {},
  loading: false,
  error: null,
  usdcAddresses: {},
  getChainIcon: () => '🌐',
  getChainLogoURI: () => '',
  getTokenLogoURI: () => '',
  lifi: null,
  getQuote: async () => null,
  executeTransfer: async () => null,
  getTransferStatus: async () => null,
  getRoutes: async () => null,
  subscribeToStatus: () => () => {},
  transferHistory: [],
  getTransferHistory: () => [],
  updateTransferStatus: async () => {},
});

export const useLiFi = () => useContext(LiFiContext);

export const LiFiProvider = ({ children }) => {
  const financial = useFinancial();

  // Map FinancialContext to LiFiContext API
  const value = {
    // Property name mapping
    isInitialized: financial.lifiInitialized,
    availableChains: financial.availableChains,
    availableTokens: financial.availableTokens,
    loading: financial.lifiLoading,
    error: financial.lifiError,
    usdcAddresses: financial.usdcAddresses,
    getChainIcon: financial.getChainIcon,
    getChainLogoURI: financial.getChainLogoURI,
    getTokenLogoURI: financial.getTokenLogoURI,
    lifi: null, // Internal SDK not exposed
    getQuote: financial.getQuote,
    executeTransfer: financial.executeTransfer,
    getTransferStatus: financial.getTransferStatus,
    getRoutes: financial.getRoutes,
    subscribeToStatus: financial.subscribeToStatus,
    transferHistory: financial.transferHistory,
    getTransferHistory: () => financial.transferHistory,
    updateTransferStatus: financial.updateTransferStatuses,
  };

  return <LiFiContext.Provider value={value}>{children}</LiFiContext.Provider>;
};

export default LiFiProvider;