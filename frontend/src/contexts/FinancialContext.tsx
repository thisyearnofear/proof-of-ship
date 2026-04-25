/**
 * Financial Context - Consolidated (Phase 3C)
 * 
 * Combines functionality from:
 * - LiFiContext.js (cross-chain transfers via LI.FI bridge aggregator)
 * 
 * Note: Builder Credit was moved to WalletContext to avoid duplication.
 * 
 * Provides unified financial operations: cross-chain swaps, token transfers.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LiFi } from '@lifi/sdk';
import { ethers } from 'ethers';
import { TESTNET_USDC_ADDRESSES } from '../config/tokens';
import { creditService } from '../services/creditService';

// ============================================================================
// Types
// ============================================================================

interface TransferRecord {
  id: string;
  txHash: string;
  fromChainId: number;
  toChainId: number;
  fromToken: any;
  toToken: any;
  fromAmount: string;
  estimatedToAmount: string;
  timestamp: number;
  status: 'PENDING' | 'DONE' | 'FAILED';
  route: string;
  estimated?: {
    executionDuration: number;
    feeCosts: any[];
    gasCosts: any[];
  };
}

interface CreditLine {
  usedAmount: string;
  reputation: number;
  maxAmount: string;
  lastUpdated: number;
}

interface ChainInfo {
  id: number;
  name: string;
  token: string;
  icon: string;
  logoURI: string;
  lifiChain?: any;
}

interface FinancialContextType {
  // LiFi State
  lifiInitialized: boolean;
  availableChains: ChainInfo[];
  availableTokens: Record<number, any[]>;
  transferHistory: TransferRecord[];
  lifiLoading: boolean;
  lifiError: string | null;
  
  // LiFi Methods
  getQuote: (fromChainId: number, toChainId: number, fromTokenAddress: string, toTokenAddress: string, fromAmount: string, options?: any) => Promise<any>;
  executeTransfer: (quote: any) => Promise<TransferRecord>;
  getTransferStatus: (txHash: string, fromChainId: number, toChainId: number) => Promise<any>;
  getRoutes: (fromChainId: number, toChainId: number, fromTokenAddress: string, toTokenAddress: string, fromAmount: string) => Promise<any>;
  subscribeToStatus: (txHash: string, fromChainId: number, callback: (status: any) => void) => () => void;
  updateTransferStatuses: () => Promise<void>;
  
  // Builder Credit State
  creditLine: CreditLine | null;
  creditLoading: boolean;
  creditError: string | null;
  
  // Builder Credit Methods
  loadCreditLine: (signer: ethers.Signer, address: string, chainId: number) => Promise<void>;
  repayLoan: (signer: ethers.Signer, chainId: number, amount: string | number) => Promise<void>;
  requestCredit: (signer: ethers.Signer, chainId: number, amount: string | number) => Promise<void>;
  
  // Helper methods
  getChainIcon: (chainId: number) => string;
  getChainLogoURI: (chainId: number) => string;
  getTokenLogoURI: (symbol: string) => string;
  usdcAddresses: Record<number, string>;
}

// ============================================================================
// Constants
// ============================================================================

const CHAIN_ICONS: Record<number, string> = {
  1: '🔷', 137: '🟣', 10: '🔴', 42161: '🔵',
  56: '🟡', 43114: '🔺', 42220: '🟢', 8453: '🔷',
};

const CHAIN_LOGOS: Record<number, string> = {
  1: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  137: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  10: 'https://raw.githubusercontent.com/ethereum-optimism/brand-kit/main/assets/svg/Optimism_Logo_Circle.svg',
  42161: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
  56: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
  43114: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
  42220: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/celo/info/logo.png',
  8453: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
};

const TOKEN_LOGOS: Record<string, string> = {
  ETH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  MATIC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  BNB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
  AVAX: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
  CELO: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/celo/info/logo.png',
};

// ============================================================================
// Context
// ============================================================================

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

// ============================================================================
// Backward Compatibility Exports
// ============================================================================

// useLiFi - maps to FinancialContext LiFi functionality
export const useLiFi = () => {
  const financial = useFinancial();
  return {
    lifiInitialized: financial.lifiInitialized,
    availableChains: financial.availableChains,
    availableTokens: financial.availableTokens,
    transferHistory: financial.transferHistory,
    loading: financial.lifiLoading,
    error: financial.lifiError,
    getQuote: financial.getQuote,
    executeTransfer: financial.executeTransfer,
    getTransferStatus: financial.getTransferStatus,
    getRoutes: financial.getRoutes,
    subscribeToStatus: financial.subscribeToStatus,
    updateTransferStatuses: financial.updateTransferStatuses,
    // Helper methods
    getChainIcon: financial.getChainIcon,
    getChainLogoURI: financial.getChainLogoURI,
    getTokenLogoURI: financial.getTokenLogoURI,
    usdcAddresses: financial.usdcAddresses,
  };
};

// LiFiProvider - alias for FinancialProvider
export const LiFiProvider = FinancialProvider;

// Note: CircleWalletProvider is now integrated into WalletContext as circleWallets/circleConfig

// ============================================================================
// Provider
// ============================================================================

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  // LiFi state
  const [lifi, setLifi] = useState<LiFi | null>(null);
  const [lifiInitialized, setLifiInitialized] = useState(false);
  const [availableChains, setAvailableChains] = useState<ChainInfo[]>([]);
  const [availableTokens, setAvailableTokens] = useState<Record<number, any[]>>({});
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);
  const [lifiLoading, setLifiLoading] = useState(false);
  const [lifiError, setLifiError] = useState<string | null>(null);
  
  // Builder Credit state
  const [creditLine, setCreditLine] = useState<CreditLine | null>(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditError, setCreditError] = useState<string | null>(null);
  
  const usdcAddresses = TESTNET_USDC_ADDRESSES;
  
  // Initialize LiFi
  useEffect(() => {
    const initializeLiFi = async () => {
      try {
        const lifiInstance = new LiFi({
          apiUrl: 'https://li.fi/api/v1',
          integrator: 'BuilderCredit',
        });
        setLifi(lifiInstance);
        
        // Load transfer history
        const storedHistory = localStorage.getItem('lifi_transfer_history');
        if (storedHistory) {
          setTransferHistory(JSON.parse(storedHistory));
        }
        
        setLifiInitialized(true);
      } catch (err: any) {
        console.error('LiFi init failed:', err);
        setLifiError(err.message);
      }
    };
    
    initializeLiFi();
  }, []);
  
  // Load chains and tokens
  useEffect(() => {
    if (!lifi) return;
    
    const loadChainsAndTokens = async () => {
      try {
        setLifiLoading(true);
        
        const response = await lifi.getChains();
        const lifiChains = response?.chains || [];
        
        // Map to our format
        const chains: ChainInfo[] = lifiChains
          .filter((chain: any) => CHAIN_LOGOS[chain.id])
          .map((chain: any) => ({
            id: chain.id,
            name: chain.name,
            token: chain.nativeCurrency?.symbol || 'ETH',
            icon: CHAIN_ICONS[chain.id] || '🌐',
            logoURI: CHAIN_LOGOS[chain.id] || CHAIN_LOGOS[1],
            lifiChain: chain,
          }));
        
        setAvailableChains(chains);
        
        // Load tokens for each chain
        const tokenData: Record<number, any[]> = {};
        for (const chain of chains) {
          try {
            const { tokens } = await lifi.getTokens({ chains: [chain.id] });
            
            const usdcAddr = usdcAddresses[chain.id];
            const chainTokens = tokens[chain.id] || [];
            
            // Find USDC and native token
            const usdcToken = chainTokens.find((t: any) => 
              usdcAddr && t.address.toLowerCase() === usdcAddr.toLowerCase()
            );
            const nativeToken = chainTokens.find((t: any) => 
              t.address === '0x0000000000000000000000000000000000000000' ||
              t.symbol === chain.token
            );
            
            if (nativeToken || usdcToken) {
              tokenData[chain.id] = [nativeToken, usdcToken].filter(Boolean);
            }
          } catch (err) {
            console.warn(`Failed to load tokens for chain ${chain.id}`);
          }
        }
        
        setAvailableTokens(tokenData);
      } catch (err: any) {
        setLifiError(err.message);
      } finally {
        setLifiLoading(false);
      }
    };
    
    loadChainsAndTokens();
  }, [lifi]);
  
  // Helper methods
  const getChainIcon = (chainId: number) => CHAIN_ICONS[chainId] || '🌐';
  const getChainLogoURI = (chainId: number) => CHAIN_LOGOS[chainId] || CHAIN_LOGOS[1];
  const getTokenLogoURI = (symbol: string) => TOKEN_LOGOS[symbol] || CHAIN_LOGOS[1];
  
  // LiFi methods
  const getQuote = async (
    fromChainId: number,
    toChainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    fromAmount: string,
    options: any = {}
  ) => {
    if (!lifi) throw new Error('LiFi not initialized');
    
    setLifiLoading(true);
    setLifiError(null);
    
    try {
      return await lifi.getQuote({
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        fromAmount,
        fromAddress: options.fromAddress,
        options: {
          slippage: parseFloat(options.slippage || 1) / 100,
          integrator: 'BuilderCredit',
        },
      });
    } finally {
      setLifiLoading(false);
    }
  };
  
  const executeTransfer = async (quote: any, signer?: ethers.Signer) => {
    if (!lifi) throw new Error('LiFi not initialized');
    
    setLifiLoading(true);
    setLifiError(null);
    
    try {
      const ethersProvider = signer 
        ? (signer as any).provider 
        : new ethers.providers.Web3Provider(window.ethereum);
      const ethSigner = ethersProvider.getSigner();
      
      const result = await lifi.executeRoute(quote, {
        signer: ethSigner,
        infiniteApproval: false,
      });
      
      const lastStep = result.steps[result.steps.length - 1];
      const txHash = lastStep.execution?.process.find((p: any) => p.txHash)?.txHash 
        || result.transactionHash;
      
      const transfer: TransferRecord = {
        id: `${txHash || Date.now()}-${Date.now()}`,
        txHash,
        fromChainId: quote.action.fromChainId,
        toChainId: quote.action.toChainId,
        fromToken: quote.action.fromToken,
        toToken: quote.action.toToken,
        fromAmount: quote.action.fromAmount,
        estimatedToAmount: quote.estimate.toAmount,
        timestamp: Date.now(),
        status: 'PENDING',
        route: quote.tool || quote.includedSteps?.[0]?.tool || 'Direct',
        estimated: {
          executionDuration: quote.estimate.executionDuration,
          feeCosts: quote.estimate.feeCosts,
          gasCosts: quote.estimate.gasCosts,
        },
      };
      
      const updatedHistory = [transfer, ...transferHistory].slice(0, 50);
      setTransferHistory(updatedHistory);
      localStorage.setItem('lifi_transfer_history', JSON.stringify(updatedHistory));
      
      return transfer;
    } finally {
      setLifiLoading(false);
    }
  };
  
  const getTransferStatus = async (txHash: string, fromChainId: number, toChainId: number) => {
    if (!lifi) throw new Error('LiFi not initialized');
    return await lifi.getStatus({ txHash, fromChainId, toChainId });
  };
  
  const getRoutes = async (
    fromChainId: number,
    toChainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    fromAmount: string
  ) => {
    if (!lifi) throw new Error('LiFi not initialized');
    
    setLifiLoading(true);
    try {
      return await lifi.getRoutes({
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        fromAmount,
        fromAddress: '0x0000000000000000000000000000000000000000', // Placeholder
      });
    } finally {
      setLifiLoading(false);
    }
  };
  
  const subscribeToStatus = (txHash: string, fromChainId: number, callback: (status: any) => void) => {
    if (!lifi) throw new Error('LiFi not initialized');
    
    const subscription = lifi.subscribeToStatus({ txHash, fromChainId }, callback);
    return () => subscription.unsubscribe();
  };
  
  const updateTransferStatuses = async () => {
    if (!lifi || transferHistory.length === 0) return;
    
    const hasPending = transferHistory.some(t => t.status !== 'DONE' && t.status !== 'FAILED');
    if (!hasPending) return;
    
    try {
      const updated = [...transferHistory];
      let hasUpdates = false;
      
      for (let i = 0; i < updated.length; i++) {
        const transfer = updated[i];
        
        if (transfer.status !== 'DONE' && transfer.status !== 'FAILED') {
          try {
            const status = await getTransferStatus(transfer.txHash, transfer.fromChainId, transfer.toChainId);
            
            if (status && status.status !== transfer.status) {
              updated[i] = { ...transfer, status: status.status, lastUpdated: Date.now() };
              hasUpdates = true;
            }
          } catch {}
        }
      }
      
      if (hasUpdates) {
        setTransferHistory(updated);
        localStorage.setItem('lifi_transfer_history', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Failed to update transfer statuses:', err);
    }
  };
  
  // Periodically update pending transfer statuses
  useEffect(() => {
    if (!lifi || transferHistory.length === 0) return;
    
    const interval = setInterval(updateTransferStatuses, 30000);
    return () => clearInterval(interval);
  }, [lifi, transferHistory]);
  
  // Builder Credit methods
  const loadCreditLine = useCallback(async (signer: ethers.Signer, address: string, chainId: number) => {
    setCreditLoading(true);
    setCreditError(null);
    
    try {
      const contracts = creditService.getContracts(chainId, signer);
      const profile = await contracts.core.creditLines(address);
      
      setCreditLine({
        usedAmount: ethers.utils.formatUnits(profile.usedAmount, 6),
        reputation: profile.reputation.toNumber(),
        maxAmount: ethers.utils.formatUnits(profile.maxAmount || 0, 6),
        lastUpdated: Date.now(),
      });
    } catch (err: any) {
      setCreditError(err.message);
      console.error('Failed to load credit line:', err);
    } finally {
      setCreditLoading(false);
    }
  }, []);
  
  const repayLoan = useCallback(async (signer: ethers.Signer, chainId: number, amount: string | number) => {
    setCreditLoading(true);
    setCreditError(null);
    
    try {
      await creditService.repayLoan(chainId, signer, amount);
      
      // Reload credit line
      const address = await signer.getAddress();
      await loadCreditLine(signer, address, chainId);
    } catch (err: any) {
      setCreditError(err.message);
      throw err;
    } finally {
      setCreditLoading(false);
    }
  }, [loadCreditLine]);
  
  const requestCredit = useCallback(async (signer: ethers.Signer, chainId: number, amount: string | number) => {
    setCreditLoading(true);
    setCreditError(null);
    
    try {
      await creditService.requestCredit(chainId, signer, amount);
      
      // Reload credit line
      const address = await signer.getAddress();
      await loadCreditLine(signer, address, chainId);
    } catch (err: any) {
      setCreditError(err.message);
      throw err;
    } finally {
      setCreditLoading(false);
    }
  }, [loadCreditLine]);
  
  const value: FinancialContextType = {
    // LiFi
    lifiInitialized,
    availableChains,
    availableTokens,
    transferHistory,
    lifiLoading,
    lifiError,
    getQuote,
    executeTransfer,
    getTransferStatus,
    getRoutes,
    subscribeToStatus,
    updateTransferStatuses,
    
    // Builder Credit
    creditLine,
    creditLoading,
    creditError,
    loadCreditLine,
    repayLoan,
    requestCredit,
    
    // Helpers
    getChainIcon,
    getChainLogoURI,
    getTokenLogoURI,
    usdcAddresses,
  };
  
  return <FinancialContext.Provider value={value}>{children}</FinancialContext.Provider>;
};

export default FinancialContext;