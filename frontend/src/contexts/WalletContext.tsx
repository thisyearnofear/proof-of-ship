/**
 * Wallet Context - Consolidated (Phase 3C)
 * 
 * Combines functionality from:
 * - MetaMaskContext.tsx (wallet connection, network switching, token balances)
 * - CircleWalletContext.js (Circle Modular Wallets for USDC)
 * - NanopaymentContext.tsx (AI agent nanopayments on Arc)
 * 
 * Provides unified wallet management for all blockchain interactions.
 *
 * Types: @see ./wallet/types.ts
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MetaMaskProvider, useSDK } from '@metamask/sdk-react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { SolanaWalletProvider } from '@/providers/SolanaWalletProvider';
import { ethers, providers, Signer } from 'ethers';
import { getUSDCAddress } from '../config/networks';
import { walletService } from '../services/walletService';
import { nanopaymentService } from '@/services/nanopaymentService';

import type { WalletContextType, CreditProfile, NanopaymentTransaction, NetworkConfig } from './wallet/types';
export type { WalletContextType, CreditProfile, NanopaymentTransaction } from './wallet/types';
import { AGENT_PRICES, NETWORK_CONFIGS, getSolanaEndpoint, getSolanaConnection } from './wallet/constants';
export { AGENT_PRICES } from './wallet/constants';

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
  const solanaWallet = useSolanaWallet();
  const { 
    publicKey, 
    connected: solanaConnectedReal, 
    connecting: solanaConnectingReal, 
    disconnect: disconnectSolanaReal 
  } = solanaWallet;
  const { setVisible: setSolanaModalVisible } = useWalletModal();
  
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
  
  // Solana state (Phase 1 preparation)
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);
  const [solanaConnected, setSolanaConnected] = useState<boolean>(false);
  const [solanaConnecting, setSolanaConnecting] = useState<boolean>(false);
  const [solanaBalance, setSolanaBalance] = useState<string | null>(null);
  const [activeChainFamily, setActiveChainFamily] = useState<'evm' | 'solana'>('evm');

  // Sync Solana state from adapter
  useEffect(() => {
    setSolanaAddress(publicKey ? publicKey.toBase58() : null);
    setSolanaConnected(solanaConnectedReal);
    setSolanaConnecting(solanaConnectingReal);
    
    if (solanaConnectedReal && publicKey) {
      const fetchSolanaBalance = async () => {
        try {
          const connection = getSolanaConnection();
          const bal = await connection.getBalance(publicKey);
          setSolanaBalance((bal / LAMPORTS_PER_SOL).toFixed(4));
        } catch (err) {
          console.warn('Failed to fetch Solana balance:', err);
        }
      };
      fetchSolanaBalance();
    } else {
      setSolanaBalance(null);
    }
  }, [publicKey, solanaConnectedReal, solanaConnectingReal]);

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
    setNanopaymentInitialized(true);
    setNanopaymentAddress('0xDEMO');
    setNanopaymentBalance({ available: '10.00', locked: '0.00' });
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
      initializeNanopaymentDemo();
    }
    
    const requiredAmount = AGENT_PRICES[agentType] || 0.05;
    const currentBalance = parseFloat(nanopaymentBalance.available);
    
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
      
      const resp = await fetch(`${baseUrl}${endpoint}`, {
        headers: { 'x-demo-key': 'demo' },
      });
      const data = resp.ok ? await resp.json() : null;
      result = { success: resp.ok, data, txHash: `0xdemo${Date.now().toString(16)}` };
      
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
      
      if (result.success) {
        setNanopaymentBalance(prev => ({
          ...prev,
          available: (Math.max(0, parseFloat(prev.available) - requiredAmount)).toFixed(2),
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
    if (activeChainFamily === 'solana') {
      if (!publicKey) return;
      try {
        const { solanaCreditService } = await import('@/services/SolanaCreditService');
        const connection = getSolanaConnection();
        const creditLine = await solanaCreditService.getDeveloperCreditLine(connection, publicKey);
        if (creditLine) {
          const usedAmount = creditLine.usedAmount?.toString?.() ?? '0';
          const totalAmount = creditLine.totalAmount?.toString?.() ?? '0';
          const reputation = Number(creditLine.reputation || 0);
          
          // Mock calculation for Solana if service doesn't have it
          const baseAmount = Math.min(5000, 500 + (Math.max(0, reputation - 400) * 11.25));
          const marketBoost = Math.max(0, parseFloat(totalAmount) - baseAmount);

          setCreditProfile({
            usedAmount,
            totalAmount,
            baseAmount: baseAmount.toFixed(0),
            marketBoost: marketBoost.toFixed(0),
            reputation,
          });
        }
      } catch (err) {
        console.warn('Failed to load Solana credit profile:', err);
      }
      return;
    }

    if (!ethersProvider || !account) return;
    try {
      const creditSvc = (await import('@/services/creditService')).creditService;
      const signer = ethersProvider.getSigner();
      const numericChainId = typeof chainId === 'number' ? chainId : parseInt(chainId as string, 10);
      if (isNaN(numericChainId)) throw new Error('Invalid chain ID');
      const contracts = creditSvc.getContracts(numericChainId, signer);
      if (!contracts) throw new Error('Contracts not available');
      const profile = await contracts.core.creditLines(account);
      const usedAmount = ethers.utils.formatUnits(profile.usedAmount || 0, 6);
      const totalAmount = ethers.utils.formatUnits(profile.totalAmount || 0, 6);
      const reputation = profile.reputation?.toNumber() || 0;
      
      const baseAmount = creditSvc.calculateBaseFunding(reputation);
      const marketBoost = Math.max(0, parseFloat(totalAmount) - baseAmount);

      setCreditProfile({
        usedAmount,
        totalAmount,
        baseAmount: baseAmount.toString(),
        marketBoost: marketBoost.toString(),
        reputation,
      });
    } catch (err) {
      console.warn('Failed to load credit profile:', err);
    }
  }, [ethersProvider, account, chainId, activeChainFamily, publicKey]);
  
   const repayLoan = async (amount: string | number, projectPda?: PublicKey) => {
     if (activeChainFamily === 'solana') {
       if (!publicKey || !solanaWallet) throw new Error('Solana wallet not connected');
       if (!projectPda) throw new Error('Project PDA required for Solana repayment');
       const { solanaCreditService } = await import('@/services/SolanaCreditService');
       const connection = getSolanaConnection();
       const result = await solanaCreditService.repayLoan(
         connection, 
         solanaWallet,
         amount,
         projectPda
       );
       
       await loadCreditProfile();
       return result;
     }

    if (!ethersProvider || !account) throw new Error('Not connected');
    const creditService = (await import('@/services/creditService')).creditService;
    await creditService.repayLoan(
      typeof chainId === 'number' ? chainId : parseInt(chainId as string, 10),
      ethersProvider as unknown as import('ethers').Signer,
      amount
    );
    await loadCreditProfile();
  };

  const requestFunding = useCallback(async (projectData: any) => {
    setLoading(true);
    try {
      if (activeChainFamily === 'solana') {
        if (!publicKey || !solanaWallet) throw new Error('Solana wallet not connected');
        const { solanaCreditService } = await import('@/services/SolanaCreditService');
        const connection = getSolanaConnection();
        return await solanaCreditService.requestFunding(connection, solanaWallet, projectData);
      } else {
        if (!signer || !chainId) throw new Error('EVM wallet not connected');
        const { creditService } = await import('@/services/creditService');
        const numericChainId = typeof chainId === 'number' ? chainId : parseInt(chainId as string, 10);
        return await creditService.requestFunding(numericChainId, signer, projectData);
      }
    } finally {
      setLoading(false);
    }
  }, [activeChainFamily, publicKey, signer, chainId]);
  
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

  // Sync EIP-6963 direct connects into SDK-compatible state so that `account`,
  // `connected`, and `provider` from useSDK() stay consistent with what login.js reads.
  const syncEip6963Account = useCallback(async (provider: any) => {
    try {
      const accounts = await provider.request({ method: 'eth_accounts' });
      const accountList = Array.isArray(accounts) ? accounts : [];
      // Trigger ethers provider re-init so the context's account/connected reflect this provider
      if (accountList.length && !activeProvider) {
        const web3Provider = new ethers.providers.Web3Provider(provider);
        setActiveProvider(provider);
        setEthersProvider(web3Provider);
        setSigner(web3Provider.getSigner());
      }
    } catch (err) {
      console.error('syncEip6963Account error:', err);
    }
  }, [activeProvider]);

  // Solana Methods (Phase 1 preparation)
  const connectSolana = useCallback(async () => {
    try {
      setSolanaConnecting(true);
      setSolanaModalVisible(true);
    } catch (err) {
      console.error('Solana connection error:', err);
    } finally {
      setSolanaConnecting(false);
    }
  }, [setSolanaModalVisible]);

  const disconnectSolana = useCallback(async () => {
    try {
      await disconnectSolanaReal();
      setSolanaAddress(null);
      setSolanaConnected(false);
      setSolanaBalance(null);
    } catch (err) {
      console.error('Solana disconnect error:', err);
    }
  }, [disconnectSolanaReal]);
  
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
    ethersProvider, signer, connected, connecting, loading, error, activeProvider, provider,
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
    creditProfile, repayLoan, loadCreditProfile, requestFunding,
    postCheckIn: async (projectId: number, metadata: string) => {
      if (activeChainFamily === 'solana') {
        throw new Error('Check-ins not yet implemented on Solana');
      }
      const { creditService } = await import('@/services/creditService');
      if (!chainId || !signer) throw new Error('Wallet not connected');
      const numericChainId = typeof chainId === 'number' ? chainId : parseInt(chainId as string, 10);
      return creditService.postCheckIn(numericChainId, signer, projectId, metadata);
    },
    // Solana (Phase 1)
    solanaAddress, solanaConnected, solanaConnecting, solanaBalance, solanaWallet,
    connectSolana, disconnectSolana, activeChainFamily, setActiveChainFamily,
    // EIP-6963 sync
    syncEip6963Account,
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
      milestones: string[] = [],
      rewards: string[] = [],
      hackathons: number[] = [],
      addresses: string[] = [],
      shares: number[] = []
    ): Promise<any> => {
      return wallet.requestFunding({
        walletId: walletId || undefined,
        githubUrl,
        projectName: projectName?.toString(),
        milestoneDescriptions: milestones,
        milestoneAmounts: rewards,
        hackathonIds: hackathons,
        teamMembers: addresses,
        teamShares: shares
      });
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
  const { currentUser } = require('@/contexts/UserContext').useUser();
  const [db] = React.useState(() => {
    const { db: clientDb } = require('@/lib/firebase/clientApp');
    return clientDb;
  });
  const { collection, query, where, getDocs, orderBy } = require('firebase/firestore');
  
  const [chainBalances, setChainBalances] = React.useState<Record<string, string>>({});
  const [isFetchingBalances, setIsFetchingBalances] = React.useState(false);
  const [developerProjects, setDeveloperProjects] = React.useState<any[]>([]);
  const [projectDetails, setProjectDetails] = React.useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = React.useState(false);

  // Derive usdcBalance from chainBalances for current active chain
  const usdcBalance = wallet.activeChainFamily === 'solana'
    ? (wallet.solanaBalance || '0.00')
    : (wallet.chainId ? (chainBalances[wallet.chainId.toString()] || '0.00') : '0.00');

  // Fetch USDC balance for a specific chain
  const fetchChainBalance = React.useCallback(async (chainId: string | number) => {
    if (!wallet.connected || !wallet.account) return '0.00';
    try {
      // Store current chain to switch back
      const currentChainId = wallet.chainId;
      const numericChainId = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
      
      // Switch to target chain if needed
      if (currentChainId !== numericChainId) {
        await wallet.switchNetwork(numericChainId);
      }
      
      const balance = await wallet.getUSDCBalance();
      
      // Switch back to original chain
      if (currentChainId !== numericChainId) {
        await wallet.switchNetwork(typeof currentChainId === 'number' ? currentChainId : parseInt(currentChainId as string, 10));
      }
      
      return balance;
    } catch {
      return '0.00';
    }
  }, [wallet]);

  // Fetch all connected chain balances on mount/connect
  React.useEffect(() => {
    const fetchAllBalances = async () => {
      if (!wallet.connected && !wallet.solanaConnected) {
        setChainBalances({});
        return;
      }

      setIsFetchingBalances(true);
      
      // EVM chains to fetch (primary supported chains)
      const evmChains = ['44787', '84532', '11155420', '11155711', '534351']; // Arc, Base, Optimism Sepolia, Linea Sepolia, Arbitrum Sepolia
      const newBalances: Record<string, string> = {};

      // Fetch Solana balance if connected
      if (wallet.solanaConnected) {
        newBalances['solana'] = wallet.solanaBalance || '0.00';
      }

      // For EVM, only fetch if connected
      if (wallet.connected && wallet.account) {
        try {
          // Fetch for current chain immediately
          const currentBalance = await wallet.getUSDCBalance();
          if (wallet.chainId) {
            newBalances[wallet.chainId.toString()] = currentBalance;
          }
        } catch {
          // Keep '0.00' for failed fetch
        }
      }

      setChainBalances(newBalances);
      setIsFetchingBalances(false);
    };

    fetchAllBalances();
  }, [wallet.connected, wallet.solanaConnected, wallet.account, wallet.chainId]);

  // Load user's projects from Firestore
  React.useEffect(() => {
    const loadUserProjects = async () => {
      if (!currentUser?.uid && !currentUser?.githubUsername) return;
      
      setLoadingProjects(true);
      try {
        const projectsRef = collection(db, 'projects');
        let q;
        
        if (currentUser.githubUsername) {
          q = query(
            projectsRef,
            where('submittedBy', '==', currentUser.githubUsername),
            orderBy('createdAt', 'desc')
          );
        } else if (currentUser.uid) {
          q = query(
            projectsRef,
            where('owners', 'array-contains', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
        }
        
        if (!q) {
          setLoadingProjects(false);
          return;
        }
        
        const snapshot = await getDocs(q);
        const projects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setDeveloperProjects(projects);
        setProjectDetails(projects.map(p => ({
          id: p.id,
          name: p.name,
          milestonesCompleted: 0,
          milestonesCount: 3,
          fundingAmount: 0,
          isActive: p.status === 'submitted' || p.status === 'approved'
        })));
      } catch (error) {
        console.error('Failed to load user projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };
    
    loadUserProjects();
  }, [currentUser?.uid, currentUser?.githubUsername, db, collection, query, where, getDocs, orderBy]);

  // Refresh balance when active chain changes
  React.useEffect(() => {
    const refreshBalance = async () => {
      if (!wallet.connected || !wallet.chainId) return;
      
      try {
        const balance = await wallet.getUSDCBalance();
        setChainBalances(prev => ({
          ...prev,
          [wallet.chainId!.toString()]: balance
        }));
      } catch {
        // Balance fetch failed, leave existing value
      }
    };

    refreshBalance();
  }, [wallet]);

  // Helper to get USDC balance asynchronously
  const getUSDCBalanceAsync = React.useCallback(async () => {
    if (wallet.activeChainFamily === 'solana') {
      return wallet.solanaBalance || '0.00';
    }
    try {
      return await wallet.getUSDCBalance();
    } catch {
      return '0.00';
    }
  }, [wallet.activeChainFamily, wallet.solanaBalance, wallet.connected, wallet.account]);

  // Switch to a specific chain (updates active chain family and switches network for EVM)
  const switchChain = React.useCallback(async (chainFamily: 'evm' | 'solana', chainId?: number) => {
    if (chainFamily === 'solana') {
      wallet.setActiveChainFamily('solana');
      return;
    }

    wallet.setActiveChainFamily('evm');
    
    // For EVM, switch to specified chain or default to Arc
    if (chainId) {
      await wallet.switchNetwork(chainId);
    }
  }, [wallet]);

  return {
    // Builder Credit from WalletContext
    creditProfile: wallet.creditProfile,
    repayLoan: wallet.repayLoan,
    loadCreditProfile: wallet.loadCreditProfile,
    postCheckIn: async (projectId: number, metadata: string) => {
      if (wallet.activeChainFamily === 'solana') {
        throw new Error('Check-ins not yet implemented on Solana');
      }
      const { creditService } = await import('@/services/creditService');
      if (!wallet.chainId || !wallet.signer) throw new Error('Wallet not connected');
      const numericChainId = typeof wallet.chainId === 'number' ? wallet.chainId : parseInt(wallet.chainId as string, 10);
      return creditService.postCheckIn(numericChainId, wallet.signer, projectId, metadata);
    },
    requestFunding: wallet.requestFunding,
    activeChainFamily: wallet.activeChainFamily,
    switchChain,
    // Projects
    developerProjects,
    projectDetails,
    loadingProjects,
    // Circle Wallet for contract interactions
    circleWallets: wallet.circleWallets,
    circleConfig: wallet.circleConfig,
    // Contract access via creditService (lazy loaded)
    coreContract: null, // Use creditService.getContracts() directly
    hackathonRegistryContract: null,
    account: wallet.activeChainFamily === 'solana' ? wallet.solanaAddress : wallet.account,
    address: wallet.activeChainFamily === 'solana' ? wallet.solanaAddress : wallet.account, // Legacy alias
    chainId: wallet.chainId,
    signer: wallet.signer,
    ethersProvider: wallet.ethersProvider,
    connected: wallet.activeChainFamily === 'solana' ? wallet.solanaConnected : wallet.connected,
    // Legacy helpers
    getBackerProjects: async (backerAddress: string): Promise<string[]> => {
      if (wallet.activeChainFamily === 'solana') {
        // Solana doesn't have this implemented yet, return empty
        return [];
      }
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
      if (wallet.activeChainFamily === 'solana') {
        if (!wallet.solanaWallet) throw new Error('Solana wallet not connected');
        const solPubkey = wallet.solanaWallet.publicKey;
        if (!wallet.solanaConnected || !wallet.solanaAddress || !solPubkey) throw new Error('Solana wallet not connected');
        
        const { solanaCreditService } = await import('@/services/SolanaCreditService');
        const connection = getSolanaConnection();
        const projectPda = new PublicKey(projectId);

        const result = await solanaCreditService.backProject(connection, wallet.solanaWallet, projectPda, amount, multiplier);
        return result.hash;
      }

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
    usdcBalance,
    chainBalances,
    isFetchingBalances,
    getUSDCBalanceAsync,
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
// Main Provider Wrapper (with MetaMask SDK error recovery)
// ============================================================================

export const WalletProvider = ({ children, demand = false }: { children: ReactNode; demand?: boolean }) => {
  // Suppress MetaMask SDK async errors that crash the page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (msg.includes('SDK state invalid') || msg.includes('mobile provider') || msg.includes('Extension context invalidated')) {
        event.preventDefault();
        console.warn('[WalletProvider] Suppressed MetaMask SDK error:', msg);
      }
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

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
    // extensionOnly removed to enable WalletConnect QR-code + deep-link fallback
    // for mobile wallets and users without a browser extension installed.
  };
  
  return (
    <MetaMaskProvider debug={false} sdkOptions={sdkOptions}>
      <SolanaWalletProvider>
        <WalletContextProviderInner>{children}</WalletContextProviderInner>
      </SolanaWalletProvider>
    </MetaMaskProvider>
  );
};

export default WalletContext;
