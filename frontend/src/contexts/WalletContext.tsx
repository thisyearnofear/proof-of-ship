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
import { createEVMClient } from '@metamask/connect-evm';
import type { MetamaskConnectEVM } from '@metamask/connect-evm';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { SolanaWalletProvider } from '@/providers/SolanaWalletProvider';
import { ethers, providers, Signer } from 'ethers';
import { getUSDCAddress } from '../config/networks';

import type { WalletContextType, CreditProfile, NetworkConfig } from './wallet/types';
export type { WalletContextType, CreditProfile } from './wallet/types';
import { NETWORK_CONFIGS, getSolanaEndpoint, getSolanaConnection } from './wallet/constants';

// Circle consumers now import from CircleContext directly.
// Nanopayment consumers now import from NanopaymentContext directly.
// Re-exports for backward compatibility.
export { useCircleWallet } from './CircleContext';
export { useNanopayment } from './NanopaymentContext';
// useBuilderCredit is NOT re-exported here to avoid a circular dependency
// (CreditContext imports useWallet from this file). Import from '@/contexts/CreditContext' directly.

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
// Inner Provider (uses MetaMask Connect/EVM)
// ============================================================================

const WalletContextProviderInner = ({ children }: { children: ReactNode }) => {
  const [evmClient, setEvmClient] = useState<MetamaskConnectEVM | null>(null);
  const [evmAccount, setEvmAccount] = useState<string | undefined>(undefined);
  const [evmChainId, setEvmChainId] = useState<number | null>(null);
  const [evmConnected, setEvmConnected] = useState(false);
  const [evmConnecting, setEvmConnecting] = useState(false);

  const account = evmAccount;
  const chainId = evmChainId;
  const connected = evmConnected;
  const connecting = evmConnecting;
  const sdk = evmClient;
  const provider = evmClient?.getProvider?.() ?? null;
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
  
  // Builder Credit state
  const [creditProfile, setCreditProfile] = useState<CreditProfile | null>(null);
  
  // Solana state (Phase 1 preparation)
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);
  const [solanaConnected, setSolanaConnected] = useState<boolean>(false);
  const [solanaConnecting, setSolanaConnecting] = useState<boolean>(false);
  const [solanaBalance, setSolanaBalance] = useState<string | null>(null);
  const [activeChainFamily, setActiveChainFamily] = useState<'evm' | 'solana'>('evm');

  // Initialize EVM client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const host = window.location.host;

    createEVMClient({
      dapp: {
        name: 'Proof of Ship',
        url: `https://${host}`,
      },
      api: {
        supportedNetworks: Object.fromEntries(
          Object.entries(NETWORK_CONFIGS).map(([_, config]) => [
            config.chainId,
            config.rpcUrls[0],
          ])
        ) as Record<`0x${string}`, string>,
      },
      eventHandlers: {
        connect: ({ accounts, chainId }) => {
          if (cancelled) return;
          setEvmAccount(accounts[0]);
          setEvmChainId(parseInt(chainId, 16));
          setEvmConnected(true);
          setEvmConnecting(false);
        },
        disconnect: () => {
          if (cancelled) return;
          setEvmAccount(undefined);
          setEvmChainId(null);
          setEvmConnected(false);
          setEvmConnecting(false);
        },
        accountsChanged: (accounts) => {
          if (cancelled) return;
          if (accounts.length > 0) {
            setEvmAccount(accounts[0]);
          }
        },
        chainChanged: (chainId) => {
          if (cancelled) return;
          setEvmChainId(parseInt(chainId, 16));
        },
      },
    }).then((client) => {
      if (!cancelled) {
        setEvmClient(client);
      }
    }).catch((err) => {
      console.error('Failed to initialize EVM client:', err);
    });

    return () => {
      cancelled = true;
    };
  }, []);

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

  // Sync active provider from EVM client
  useEffect(() => {
    if (evmClient?.getProvider()) {
      setActiveProvider(evmClient.getProvider());
    } else if (typeof window !== 'undefined' && window.ethereum) {
      setActiveProvider(window.ethereum);
    }
  }, [evmClient]);
 
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
      const numericChainId = chainId ?? 0;
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
      chainId ?? 0,
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
      const numericChainId = chainId ?? 0;
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
      setEvmConnecting(true);
      setError(null);
      if (!evmClient) throw new Error('EVM client not initialized');
      const result = await evmClient.connect({ chainIds: ['0x1', '0x89', '0xa4b1', '0xa', '0x2105'] });
      if (result?.accounts?.length) {
        setEvmAccount(result.accounts[0]);
        setEvmChainId(parseInt(result.chainId, 16));
        setEvmConnected(true);
      }
    } catch (err: unknown) {
      console.error('Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to MetaMask. Please try again.');
    } finally {
      setLoading(false);
      setEvmConnecting(false);
    }
  };
  
  const disconnect = () => {
    if (evmClient) evmClient.disconnect();
    setCreditProfile(null);
  };

  // Sync EIP-6963 direct connects into EVM-compatible state so that `account`,
  // `connected`, and `provider` stay consistent with what login.js reads.
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
    // Builder Credit
    creditProfile, repayLoan, loadCreditProfile, requestFunding,
    postCheckIn: async (projectId: number, metadata: string) => {
      if (activeChainFamily === 'solana') {
        throw new Error('Check-ins not yet implemented on Solana');
      }
      const { creditService } = await import('@/services/creditService');
      if (!chainId || !signer) throw new Error('Wallet not connected');
      const numericChainId = chainId ?? 0;
      return creditService.postCheckIn(numericChainId, signer, projectId, metadata);
    },
    // Solana (Phase 1)
    solanaAddress, solanaConnected, solanaConnecting, solanaBalance, solanaWallet,
    connectSolana, disconnectSolana, activeChainFamily, setActiveChainFamily,
    // EIP-6963 sync
    syncEip6963Account,
  } as unknown as WalletContextType;
  
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

// ============================================================================
// Backward Compatibility Hooks
// ============================================================================

// useBuilderCredit is now in CreditContext.tsx — import from there directly.
// WalletContext re-exports it for backward compatibility.

// ============================================================================
// Main Provider Wrapper
// ============================================================================

export const WalletProvider = ({ children, demand = false }: { children: ReactNode; demand?: boolean }) => {
  return (
    <SolanaWalletProvider>
      <WalletContextProviderInner>{children}</WalletContextProviderInner>
    </SolanaWalletProvider>
  );
};

export default WalletContext;
