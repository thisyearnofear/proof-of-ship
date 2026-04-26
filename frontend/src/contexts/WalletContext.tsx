/**
 * Wallet Context - Consolidated (Phase 3C)
 * 
 * Combines functionality from:
 * - MetaMaskContext.tsx (wallet connection, network switching, token balances)
 * - CircleWalletContext.js (Circle Modular Wallets for USDC)
 * - NanopaymentContext.tsx (AI agent nanopayments on Arc)
 * 
 * Provides unified wallet management for all blockchain interactions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MetaMaskProvider, useSDK } from '@metamask/sdk-react';
import { ethers, providers, Signer } from 'ethers';
import { getUSDCAddress } from '../config/networks';
import { walletService } from '../services/walletService';
import { nanopaymentService } from '@/services/nanopaymentService';

// ============================================================================
// Types
// ============================================================================

interface NetworkConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

interface CreditProfile {
  usedAmount: string;
  reputation: number;
}

interface NanopaymentTransaction {
  id: string;
  type: string;
  agentName: string;
  amount: number;
  status: string;
  timestamp: string;
  txHash?: string;
  projectName?: string;
}

interface WalletContextType {
  // MetaMask integration
  connect: () => Promise<void>;
  disconnect: () => void;
  account: string | undefined;
  chainId: number | string | null;
  balance: string | null;
  networkName: string;
  ethersProvider: providers.Web3Provider | null;
  signer: Signer | null;
  connected: boolean;
  connecting: boolean;
  loading: boolean;
  error: string | null;
  activeProvider: any;
  getBalance: (showLoading?: boolean) => Promise<string | null>;
  getTokenBalance: (tokenAddress: string, decimals?: number) => Promise<string>;
  switchNetwork: (chainId: number) => Promise<void>;
  addToken: (tokenAddress: string, symbol: string, decimals?: number) => Promise<void>;
  getUSDCBalance: () => Promise<string>;
  addUSDCToken: () => Promise<boolean>;
  networkConfigs: Record<number, NetworkConfig>;
  getCurrentUSDCAddress: () => string | null;
  
  // Circle Wallet integration
  circleWallets: any[];
  circleConfig: any;
  createCircleWallet: (config?: any) => Promise<any>;
  refreshCircleWallets: () => Promise<void>;
  transferUSDC: (amount: number, destinationAddress: string, walletId: string, reason?: string) => Promise<any>;
  
  // Nanopayment integration
  nanopaymentInitialized: boolean;
  nanopaymentBalance: { available: string; locked: string };
  nanopaymentAddress: string | null;
  nanopaymentTransactions: NanopaymentTransaction[];
  initializeNanopayment: (privateKey: string | `0x${string}`) => Promise<void>;
  initializeNanopaymentDemo: () => void;
  depositNanopayment: (amountUSDC: number) => Promise<any>;
  payForAgent: (agentType: string, params?: any) => Promise<any>;
  payForHealthScore: (projectId: string, baseUrl?: string, projectName?: string) => Promise<any>;
  payForScout: (baseUrl?: string) => Promise<any>;
  payForVerification: (prId: string, lines: number, baseUrl?: string) => Promise<any>;
  payForRebalance: (baseUrl?: string) => Promise<any>;
  
  // Builder Credit
  creditProfile: CreditProfile | null;
  repayLoan: (amount: string | number) => Promise<void>;
  loadCreditProfile: () => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const AGENT_PRICES: Record<string, number> = {
  underwrite: 0.05,
  scout: 0.01,
  verify: 0.001,
  rebalance: 0.01,
};

const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
  1: { chainId: '0x1', chainName: 'Ethereum Mainnet', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.infura.io/v3/'], blockExplorerUrls: ['https://etherscan.io'] },
  137: { chainId: '0x89', chainName: 'Polygon Mainnet', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com/'], blockExplorerUrls: ['https://polygonscan.com'] },
  10: { chainId: '0xa', chainName: 'Optimism', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.optimism.io'], blockExplorerUrls: ['https://optimistic.etherscan.io'] },
  42161: { chainId: '0xa4b1', chainName: 'Arbitrum One', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://arb1.arbitrum.io/rpc'], blockExplorerUrls: ['https://arbiscan.io'] },
  42220: { chainId: '0xa4ec', chainName: 'Celo Mainnet', nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 }, rpcUrls: ['https://forno.celo.org'], blockExplorerUrls: ['https://explorer.celo.org'] },
  8453: { chainId: '0x2105', chainName: 'Base', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org'] },
  5042002: { chainId: '0x4CE912', chainName: 'Arc Testnet', nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 18 }, rpcUrls: ['https://rpc.testnet.arc.network'], blockExplorerUrls: ['https://testnet.arcscan.app'] },
};

// ============================================================================
// Context
// ============================================================================

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  // Add address as alias for account (backward compatibility)
  return { ...context, address: context?.account };
};

// ============================================================================
// Inner Provider (uses MetaMask SDK)
// ============================================================================

const WalletContextProviderInner = ({ children }: { children: ReactNode }) => {
  const { sdk, connected, connecting, provider, chainId, account } = useSDK();
  
  // MetaMask state
  const [activeProvider, setActiveProvider] = useState<any>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string>('');
  const [ethersProvider, setEthersProvider] = useState<providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  
  // Circle Wallet state
  const [circleWallets, setCircleWallets] = useState<any[]>([]);
  const [circleConfig, setCircleConfig] = useState<any>(null);
  
  // Nanopayment state
  const [nanopaymentInitialized, setNanopaymentInitialized] = useState(false);
  const [nanopaymentBalance, setNanopaymentBalance] = useState({ available: '0', locked: '0' });
  const [nanopaymentAddress, setNanopaymentAddress] = useState<string | null>(null);
  const [nanopaymentTransactions, setNanopaymentTransactions] = useState<NanopaymentTransaction[]>([]);
  
  // Builder Credit state
  const [creditProfile, setCreditProfile] = useState<CreditProfile | null>(null);
  
  // Sync active provider from SDK
  useEffect(() => {
    if (sdk?.getProvider()) {
      setActiveProvider(sdk.getProvider());
    } else if (provider) {
      setActiveProvider(provider);
    } else if (typeof window !== 'undefined' && window.ethereum) {
      setActiveProvider(window.ethereum);
    }
  }, [sdk, provider]);
  
  const refreshCircleWallets = useCallback(async () => {
    try {
      const result = await walletService.getWallets();
      if (result.success) {
        setCircleWallets(result.data.wallets || []);
      }
    } catch (err: any) {
      console.warn('Failed to fetch Circle wallets:', err?.message || err);
    }
  }, []);

  const initializeCircleService = useCallback(async () => {
    try {
      const config = await walletService.getConfig();
      if (config.success) {
        setCircleConfig(config.data);
        await refreshCircleWallets();
      }
    } catch (err: unknown) {
      console.warn('Circle initialization skipped:', err instanceof Error ? err.message : err);
    }
  }, [refreshCircleWallets]);

  // Initialize Circle Wallet Service (declared AFTER callbacks to avoid TDZ on deps array)
  useEffect(() => {
    initializeCircleService();
  }, [initializeCircleService]);
  
  const createCircleWallet = useCallback(async (config: any = {}) => {
    if (!circleConfig) throw new Error('Circle not initialized');
    setLoading(true);
    try {
      const walletParams = {
        idempotencyKey: `wallet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        metadata: {
          name: config.name || 'Developer Wallet',
          userId: config.userId || account || 'anonymous',
          ...config.metadata
        }
      };
      const result = await walletService.createWallet(walletParams);
      if (result.success) {
        await refreshCircleWallets();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create wallet');
      }
    } finally {
      setLoading(false);
    }
  }, [circleConfig, account, refreshCircleWallets]);
  
  const transferUSDC = useCallback(async (amount: number, destinationAddress: string, walletId: string, reason?: string) => {
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
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Nanopayment methods
  const initializeNanopayment = useCallback(async (pk: `0x${string}`) => {
    try {
      setLoading(true);
      const client = await nanopaymentService.initialize({
        chain: 'arcTestnet',
        privateKey: pk,
      });
      const address = client.account?.address;
      setNanopaymentAddress(address ?? null);
      setNanopaymentInitialized(true);
      const bal = await nanopaymentService.getBalance();
      setNanopaymentBalance(bal);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const initializeNanopaymentDemo = useCallback(() => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      setNanopaymentInitialized(true);
      setNanopaymentAddress('0xDEMO');
      setNanopaymentBalance({ available: '10.00', locked: '0.00' });
    }
  }, []);
  
  const depositNanopayment = useCallback(async (amountUSDC: number) => {
    if (!nanopaymentInitialized) throw new Error('Wallet not initialized');
    setLoading(true);
    try {
      const result = await nanopaymentService.deposit(amountUSDC);
      const bal = await nanopaymentService.getBalance();
      setNanopaymentBalance(bal);
      addNanopaymentTransaction({
        id: Date.now().toString(),
        type: 'deposit',
        agentName: 'Deposit',
        amount: amountUSDC,
        status: 'confirmed',
        timestamp: new Date().toISOString(),
        txHash: result.txHash,
      } as NanopaymentTransaction);
      return result;
    } finally {
      setLoading(false);
    }
  }, [nanopaymentInitialized]);
  
  const addNanopaymentTransaction = useCallback((tx: NanopaymentTransaction) => {
    setNanopaymentTransactions(prev => [tx, ...prev].slice(0, 50));
  }, []);
  
  const payForAgent = useCallback(async (agentType: string, params: any = {}) => {
    if (!nanopaymentInitialized) {
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        initializeNanopaymentDemo();
      } else {
        throw new Error('Wallet not initialized');
      }
    }
    
    const requiredAmount = AGENT_PRICES[agentType] || 0.05;
    const currentBalance = parseFloat(nanopaymentBalance.available);
    
    if (currentBalance < requiredAmount && process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
      throw new Error(`Insufficient balance. Need $${requiredAmount}, have $${currentBalance}`);
    }
    
    setLoading(true);
    try {
      let result;
      let endpoint;
      let displayName;
      
      switch (agentType) {
        case 'underwrite':
          endpoint = `/api/agent/underwrite?projectId=${params.projectId}`;
          displayName = 'AI Underwriter';
          break;
        case 'scout':
          endpoint = '/api/agent/scout';
          displayName = 'AI Scout';
          break;
        case 'verify':
          endpoint = `/api/agent/verify?prId=${params.prId}&lines=${params.lines}`;
          displayName = 'Verifier Agent';
          break;
        case 'rebalance':
          endpoint = '/api/agent/rebalance';
          displayName = 'AI Portfolio Manager';
          break;
        default:
          throw new Error(`Unknown agent: ${agentType}`);
      }
      
      const baseUrl = params.baseUrl || '';
      const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
      
      if (isDemo) {
        const resp = await fetch(`${baseUrl}${endpoint}`, {
          headers: { 'x-demo-key': 'demo' },
        });
        const data = resp.ok ? await resp.json() : null;
        result = { success: resp.ok, data, txHash: `0xdemo${Date.now().toString(16)}` };
      } else {
        result = await nanopaymentService.pay(`${baseUrl}${endpoint}`);
      }
      
      const tx: NanopaymentTransaction = {
        id: Date.now().toString(),
        type: agentType,
        agentName: displayName,
        amount: requiredAmount,
        status: result.success ? 'confirmed' : 'failed',
        timestamp: new Date().toISOString(),
        txHash: result.txHash,
        projectName: params.projectName,
      };
      
      addNanopaymentTransaction(tx);
      
      if (result.success && process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        setNanopaymentBalance(prev => ({
          ...prev,
          available: (parseFloat(prev.available) - requiredAmount).toFixed(2),
        }));
      }
      
      return { ...result, transaction: tx };
    } finally {
      setLoading(false);
    }
  }, [nanopaymentInitialized, nanopaymentBalance, initializeNanopaymentDemo, addNanopaymentTransaction]);
  
  const payForHealthScore = useCallback(async (projectId: string, baseUrl?: string, projectName?: string) => {
    return payForAgent('underwrite', { projectId, baseUrl, projectName });
  }, [payForAgent]);
  
  const payForScout = useCallback(async (baseUrl?: string) => {
    return payForAgent('scout', { baseUrl });
  }, [payForAgent]);
  
  const payForVerification = useCallback(async (prId: string, lines: number, baseUrl?: string) => {
    const cost = (lines / 10) * AGENT_PRICES.verify;
    return payForAgent('verify', { prId, lines, amount: cost, baseUrl });
  }, [payForAgent]);
  
  const payForRebalance = useCallback(async (baseUrl?: string) => {
    return payForAgent('rebalance', { baseUrl });
  }, [payForAgent]);
  
  // Builder Credit methods
  const loadCreditProfile = useCallback(async () => {
    if (!ethersProvider || !account) return;
    try {
      const creditSvc = (await import('@/services/creditService')).creditService;
      const signer = ethersProvider.getSigner();
      const numericChainId = typeof chainId === 'number' ? chainId : parseInt(chainId as string, 10);
      if (isNaN(numericChainId)) throw new Error('Invalid chain ID');
      const contracts = creditSvc.getContracts(numericChainId, signer);
      if (!contracts) throw new Error('Contracts not available');
      const profile = await contracts.core.creditLines(account);
      setCreditProfile({
        usedAmount: ethers.utils.formatUnits(profile.usedAmount || 0, 6),
        reputation: profile.reputation?.toNumber() || 0,
      });
    } catch (err) {
      console.warn('Failed to load credit profile:', err);
    }
  }, [ethersProvider, account, chainId]);
  
  const repayLoan = async (amount: string | number) => {
    if (!ethersProvider || !account) throw new Error('Not connected');
    const creditService = (await import('@/services/creditService')).creditService;
    await creditService.repayLoan(
      typeof chainId === 'number' ? chainId : parseInt(chainId as string, 10),
      ethersProvider as unknown as import('ethers').Signer,
      amount
    );
    await loadCreditProfile();
  };
  
  // MetaMask methods
  const connect = async () => {
    try {
      setLoading(true);
      setError(null);
      let accounts = await sdk?.connect();
      const accountList = Array.isArray(accounts) ? accounts : [];
      if (!accountList.length) {
        if (activeProvider) {
          accounts = await activeProvider.request({ method: 'eth_requestAccounts' });
        }
      }
    } catch (err: unknown) {
      console.error('Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to MetaMask. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const disconnect = () => {
    if (sdk) sdk.terminate();
    setCircleWallets([]);
    setCreditProfile(null);
  };
  
  const getBalance = useCallback(async (showLoading = true) => {
    if (!activeProvider || !account) return null;
    try {
      if (showLoading) setLoading(true);
      const balance = await activeProvider.request({ method: 'eth_getBalance', params: [account, 'latest'] });
      const balanceInEth = ethers.utils.formatEther(balance as string);
      setBalance(parseFloat(balanceInEth).toFixed(4));
      return balanceInEth;
    } catch (err) {
      console.error('Failed to get balance:', err);
      return null;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeProvider, account]);
  
  const getTokenBalance = async (tokenAddress: string, decimals: number = 18) => {
    if (!activeProvider || !account || !ethersProvider) return '0';
    try {
      const tokenContract = new ethers.Contract(tokenAddress, [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
      ], ethersProvider);
      let tokenDecimals = decimals;
      try { tokenDecimals = await (tokenContract as any).decimals(); } catch {}
      const balance = await (tokenContract as any).balanceOf(account);
      return ethers.utils.formatUnits(balance, tokenDecimals);
    } catch {
      return '0';
    }
  };
  
  const getUSDCBalance = async () => {
    const usdcAddress = getCurrentUSDCAddress();
    if (!usdcAddress) return '0';
    return await getTokenBalance(usdcAddress, 6);
  };
  
  const switchNetwork = async (chainId: number) => {
    if (!activeProvider) return;
    const hexChainId = `0x${chainId.toString(16)}`;
    try {
      await activeProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexChainId }] });
    } catch (err: any) {
      if ((err as any).code === 4902) {
        const config = NETWORK_CONFIGS[chainId] || NETWORK_CONFIGS[1];
        if (config) {
          await activeProvider.request({ method: 'wallet_addEthereumChain', params: [config] });
          await activeProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexChainId }] });
        }
      } else {
        throw err;
      }
    }
  };
  
  const addToken = async (tokenAddress: string, symbol: string, decimals: number, imageUrl?: string) => {
    if (!activeProvider) return false;
    try {
      setLoading(true);
      return await activeProvider.request({
        method: 'wallet_watchAsset',
        params: { type: 'ERC20', options: { address: tokenAddress, symbol, decimals, image: imageUrl } },
      });
    } catch (err: any) {
      console.error(`Failed to add ${symbol} token:`, err);
      setError(`Failed to add ${symbol} token: ${(err as Error).message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const addUSDCToken = async () => {
    const usdcAddress = getCurrentUSDCAddress();
    if (!usdcAddress) {
      setError('USDC not available on this network');
      return false;
    }
    return await addToken(usdcAddress, 'USDC', 6, 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png');
  };
  
  const getCurrentUSDCAddress = (): string | null => {
    if (!chainId) return null;
    return getUSDCAddress(chainId) || null;
  };
  
  // Ethers provider initialization
  useEffect(() => {
    if (!activeProvider || !connected || typeof chainId !== 'number') {
      setEthersProvider(null);
      setSigner(null);
      return;
    }

    let cancelled = false;
    const ethProvider = new ethers.providers.Web3Provider(activeProvider as providers.ExternalProvider);

    if (!cancelled) {
      setEthersProvider(ethProvider);
      setSigner(ethProvider.getSigner());
      const networkName = NETWORK_CONFIGS[chainId]?.chainName || `Chain ID: ${chainId}`;
      setNetworkName(networkName);
    }

    getBalance();

    const handleNewBlock = () => getBalance(false);
    ethProvider.on('block', handleNewBlock);

    return () => {
      cancelled = true;
      ethProvider.off('block', handleNewBlock);
    };
  }, [activeProvider, connected, chainId, getBalance]);
  
  // Listen for account/chain changes
  useEffect(() => {
    if (!activeProvider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnect();
      else getBalance();
    };
    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setNetworkName(NETWORK_CONFIGS[newChainId]?.chainName || `Chain ID: ${newChainId}`);
      getBalance();
    };
    activeProvider.on('accountsChanged', handleAccountsChanged);
    activeProvider.on('chainChanged', handleChainChanged);
    return () => {
      activeProvider.removeListener('accountsChanged', handleAccountsChanged);
      activeProvider.removeListener('chainChanged', handleChainChanged);
    };
  }, [activeProvider, disconnect, getBalance]);
  
  const value = {
    // MetaMask
    connect, disconnect, account, chainId, balance, networkName,
    ethersProvider, signer, connected, connecting, loading, error, activeProvider,
    getBalance, getTokenBalance, getUSDCBalance, switchNetwork, addToken, addUSDCToken,
    networkConfigs: NETWORK_CONFIGS, getCurrentUSDCAddress,
    // Circle Wallet
    circleWallets, circleConfig, createCircleWallet, refreshCircleWallets, transferUSDC,
    // Nanopayment
    nanopaymentInitialized, 
    nanopaymentBalance: nanopaymentBalance ?? { available: '0', locked: '0' }, 
    nanopaymentAddress: nanopaymentAddress ?? undefined, 
    nanopaymentTransactions,
    initializeNanopayment: (pk: string) => initializeNanopayment(pk as `0x${string}`), 
    initializeNanopaymentDemo, depositNanopayment,
    payForAgent, payForHealthScore, payForScout, payForVerification, payForRebalance,
    // Builder Credit
    creditProfile, repayLoan, loadCreditProfile,
  } as WalletContextType;
  
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

// ============================================================================
// Backward Compatibility Hooks
// ============================================================================

// useCircleWallet - maps to WalletContext circle functionality
export const useCircleWallet = () => {
  const wallet = useWallet();
  return {
    // Circle Wallet state
    circleWallets: wallet.circleWallets,
    circleConfig: wallet.circleConfig,
    loading: wallet.loading,
    error: wallet.error,
    // Circle Wallet methods
    createWallet: wallet.createCircleWallet,
    refreshWallets: wallet.refreshCircleWallets,
    transferUSDC: wallet.transferUSDC,
    // Funding methods (delegated to creditService)
    requestFunding: async (
      walletId: string | null,
      githubUrl: string,
      projectName: string,
      milestones: string[],
      rewards: string[],
      hackathons: number[],
      addresses: string[],
      shares: number[]
    ): Promise<any> => {
      const { creditService } = await import('@/services/creditService');
      if (!wallet.signer) throw new Error('Wallet not connected');
      if (typeof wallet.chainId !== 'number') throw new Error('Invalid chain ID');
      return creditService.requestFunding(wallet.chainId, wallet.signer, {
        walletId: walletId || undefined, githubUrl, projectName, milestones, rewards, hackathons, addresses, shares,
      } as any);
    },
    getFundingHistory: async (address: string) => {
      // Return empty for now - implement via creditService if needed
      return [];
    },
    checkAPIConfiguration: async () => {
      if (!wallet.circleConfig) {
        return { configured: false, message: 'Circle API not configured' };
      }
      return { configured: true, message: 'Circle API configured' };
    },
    isConfigured: () => !!wallet.circleConfig,
    getEnvironment: () => wallet.circleConfig?.environment || 'sandbox',
  };
};

// useBuilderCredit - maps to WalletContext functionality
export const useBuilderCredit = () => {
  const wallet = useWallet();
  
  // Helper to get USDC balance asynchronously
  const getUSDCBalanceAsync = async () => {
    try {
      return await wallet.getUSDCBalance();
    } catch {
      return '0.00';
    }
  };
  
  return {
    // Builder Credit from WalletContext
    creditProfile: wallet.creditProfile,
    repayLoan: wallet.repayLoan,
    loadCreditProfile: wallet.loadCreditProfile,
    // Circle Wallet for contract interactions
    circleWallets: wallet.circleWallets,
    circleConfig: wallet.circleConfig,
    // Contract access via creditService (lazy loaded)
    coreContract: null, // Use creditService.getContracts() directly
    hackathonRegistryContract: null,
    account: wallet.account,
    address: wallet.account, // Legacy alias
    chainId: wallet.chainId,
    signer: wallet.signer,
    ethersProvider: wallet.ethersProvider,
    connected: wallet.connected,
    // Legacy helpers
    getBackerProjects: async (backerAddress: string): Promise<string[]> => {
      // Access via creditService
      const { creditService } = await import('@/services/creditService');
      if (!wallet.chainId || !wallet.signer) return [];
      if (typeof wallet.chainId !== 'number') return [];
      const contracts = creditService.getContracts(wallet.chainId, wallet.signer);
      if (!contracts) return [];
      try {
        const count = await contracts.core.getBackerProjectCount(backerAddress);
        const projectIds: string[] = [];
        const countNum = count?.toNumber ? count.toNumber() : 0;
        for (let i = 0; i < countNum; i++) {
          const projectId = await contracts.core.backerProjects(backerAddress, i);
          projectIds.push(projectId);
        }
        return projectIds;
      } catch {
        return [];
      }
    },
    backProject: async (projectId: string, multiplier: number, amount: string | number): Promise<string> => {
      const { creditService } = await import('@/services/creditService');
      
      // Input validation
      if (!projectId || typeof projectId !== 'string') {
        throw new Error('Invalid project ID');
      }
      if (typeof multiplier !== 'number' || multiplier < 100 || multiplier > 500) {
        throw new Error('Invalid multiplier: must be between 100 (1x) and 500 (5x)');
      }
      const parsedAmount = parseFloat(amount.toString());
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Invalid amount: must be a positive number');
      }
      if (parsedAmount < 1) {
        throw new Error('Minimum backing amount is 1 USDC');
      }
      
      if (!wallet.chainId || !wallet.signer) throw new Error('Not connected');
      if (typeof wallet.chainId !== 'number') throw new Error('Invalid chain ID');
      const contracts = creditService.getContracts(wallet.chainId, wallet.signer);
      if (!contracts) throw new Error('Contracts not available');
      
      // Parse amount in USDC decimals (6)
      const amountInUnits = ethers.utils.parseUnits(parsedAmount.toString(), 6);
      const signerAddress = await wallet.signer.getAddress();
      
      // Check USDC balance
      const balance = await contracts.usdc.balanceOf(signerAddress);
      if (balance.lt(amountInUnits)) {
        throw new Error(`Insufficient USDC balance. Need: ${parsedAmount}, Available: ${ethers.utils.formatUnits(balance, 6)}`);
      }
      
      // Check and set USDC allowance if needed
      const currentAllowance = await contracts.usdc.allowance(signerAddress, contracts.core.address);
      if (currentAllowance.lt(amountInUnits)) {
        const approveTx = await contracts.usdc.approve(contracts.core.address, ethers.constants.MaxUint256);
        await approveTx.wait();
      }
      
      // Call backProject with amount as uint256 (not value field - this is ERC20 transfer, not ETH)
      const tx = await contracts.core.backProject(projectId, multiplier, amountInUnits);
      await tx.wait();
      
      return tx.hash;
    },
    contractLoading: wallet.loading,
    // usdcBalance is async - consumers should call getUSDCBalanceAsync()
    getUSDCBalanceAsync,
    usdcBalance: '0.00', // Sync access returns 0 - use async version
  };
};

// useNanopayment - maps to WalletContext nanopayment functionality
export const useNanopayment = () => {
  const wallet = useWallet();
  const [streamingPayment, setStreamingPayment] = useState<{ agentType: string; amount: number } | null>(null);
  
  // Wrap payForAgent to track streaming state (memoized to prevent re-renders)
  const payForAgentWithStreaming = useCallback(async (agentType: string, params = {}) => {
    setStreamingPayment({ agentType, amount: AGENT_PRICES[agentType] || 0.01 });
    try {
      const result = await wallet.payForAgent(agentType, params);
      setStreamingPayment(null);
      return result;
    } catch (err) {
      setStreamingPayment(null);
      throw err;
    }
  }, [wallet.payForAgent]);
  
  return {
    // Nanopayment state
    isInitialized: wallet.nanopaymentInitialized,
    loading: wallet.loading,
    error: wallet.error,
    balance: wallet.nanopaymentBalance,
    walletAddress: wallet.nanopaymentAddress,
    transactions: wallet.nanopaymentTransactions,
    nanopaymentAddress: wallet.nanopaymentAddress,
    streamingPayment,
    // Nanopayment methods
    initialize: wallet.initializeNanopayment,
    initializeWithDemo: wallet.initializeNanopaymentDemo,
    deposit: wallet.depositNanopayment,
    pay: (endpoint: string, options?: any) => payForAgentWithStreaming('chat', { endpoint, ...options }),
    payForAgent: payForAgentWithStreaming as (agentType: string, params?: any) => Promise<any>,
    payForVerification: wallet.payForVerification,
    payForScout: wallet.payForScout,
    payForUnderwrite: wallet.payForHealthScore,
    payForRebalance: wallet.payForRebalance,
    // Agent pricing (for display)
    agentPrices: {
      underwrite: 0.05,
      scout: 0.01,
      verify: 0.001,
      rebalance: 0.01,
    },
  };
};

// ============================================================================
// Main Provider Wrapper
// ============================================================================

export const WalletProvider = ({ children, demand = false }: { children: ReactNode; demand?: boolean }) => {
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost';
  const sdkOptions = {
    logging: { developerMode: false },
    checkInstallationImmediately: false,
    dappMetadata: {
      name: 'Proof of Ship',
      url: `https://${host}`,
      iconUrl: `https://${host}/favicon.ico`,
    },
    enableDebug: false,
    autoConnect: { enable: true },
    extensionOnly: true,
  };
  
  return (
    <MetaMaskProvider debug={false} sdkOptions={sdkOptions}>
      <WalletContextProviderInner>{children}</WalletContextProviderInner>
    </MetaMaskProvider>
  );
};

export default WalletContext;