/**
 * @deprecated MetaMaskContext.tsx - Merged into WalletContext.tsx
 * 
 * Use: import { useWallet } from '@/contexts/WalletContext';
 * 
 * Re-exports from WalletContext with backward compatibility API mapping.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet } from './WalletContext';

const MetaMaskContext = createContext({
  connect: async () => {},
  disconnect: () => {},
  account: null,
  chainId: null,
  balance: null,
  networkName: '',
  ethersProvider: null,
  signer: null,
  connected: false,
  connecting: false,
  loading: false,
  error: null,
  activeProvider: null,
  getBalance: async () => null,
  getTokenBalance: async () => '0',
  switchNetwork: async () => {},
  addToken: async () => false,
  addChain: async () => false,
  addUSDCToken: async () => false,
  getUSDCBalance: async () => '0',
  getCurrentUSDCAddress: () => null,
  networkConfigs: {},
  provider: null,
  sdk: null,
});

export const useMetaMask = () => useContext(MetaMaskContext);

export const MetaMaskProviderWrapper = ({ children, demand = false }) => {
  const wallet = useWallet();

  // Map WalletContext to MetaMaskContext API
  const value = {
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    account: wallet.account,
    chainId: wallet.chainId,
    balance: wallet.balance,
    networkName: wallet.networkName,
    ethersProvider: wallet.ethersProvider,
    signer: wallet.signer,
    connected: wallet.connected,
    connecting: wallet.connecting,
    loading: wallet.loading,
    error: wallet.error,
    activeProvider: wallet.activeProvider,
    getBalance: wallet.getBalance,
    getTokenBalance: wallet.getTokenBalance,
    switchNetwork: wallet.switchNetwork,
    addToken: wallet.addToken,
    addChain: wallet.switchNetwork, // addChain is similar to switchNetwork
    addUSDCToken: wallet.addUSDCToken,
    getUSDCBalance: wallet.getUSDCBalance,
    getCurrentUSDCAddress: wallet.getCurrentUSDCAddress,
    networkConfigs: wallet.networkConfigs,
    provider: wallet.activeProvider,
    sdk: null, // Not exposed in WalletContext
  };

  return <MetaMaskContext.Provider value={value}>{children}</MetaMaskContext.Provider>;
};

export const MetaMaskContextProvider = MetaMaskProviderWrapper;

export default MetaMaskContextProvider;