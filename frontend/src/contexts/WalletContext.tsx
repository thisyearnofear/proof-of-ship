/**
 * Wallet Context — wagmi + ConnectKit + viem
 *
 * EVM wallet connection via ConnectKit (supports MetaMask, Rabby, Coinbase,
 * WalletConnect, and any EIP-6963 wallet automatically).
 * Solana via @solana/wallet-adapter-react (unchanged).
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAccount, useChainId, useDisconnect, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi';
import { useModal } from 'connectkit';
import { formatEther, formatUnits, erc20Abi } from 'viem';
import type { PublicClient, WalletClient } from 'viem';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SolanaWalletProvider } from '@/providers/SolanaWalletProvider';
import { getUSDCAddress } from '../config/networks';

import type { WalletContextType, CreditProfile } from './wallet/types';
export type { WalletContextType, CreditProfile } from './wallet/types';
import { NETWORK_CONFIGS, getSolanaConnection } from './wallet/constants';

export { useCircleWallet } from './CircleContext';
export { useNanopayment } from './NanopaymentContext';

// ============================================================================
// Context
// ============================================================================

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return { ...context, address: context?.account };
};

// ============================================================================
// Inner Provider (uses wagmi hooks)
// ============================================================================

const WalletContextProviderInner = ({ children }: { children: ReactNode }) => {
  // wagmi EVM state
  const { address: evmAddress, isConnected: evmConnected, isConnecting: evmConnecting } = useAccount();
  const evmChainId = useChainId();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient() as PublicClient | undefined;
  const { data: walletClient } = useWalletClient() as { data: WalletClient | undefined };
  const { setOpen: setConnectModalOpen } = useModal();

  // Solana state
  const solanaWallet = useSolanaWallet();
  const { publicKey, connected: solanaConnectedReal, connecting: solanaConnectingReal, disconnect: disconnectSolanaReal } = solanaWallet;
  const { setVisible: setSolanaModalVisible } = useWalletModal();

  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);
  const [solanaConnected, setSolanaConnected] = useState(false);
  const [solanaConnecting, setSolanaConnecting] = useState(false);
  const [solanaBalance, setSolanaBalance] = useState<string | null>(null);
  const [activeChainFamily, setActiveChainFamily] = useState<'evm' | 'solana'>('evm');

  const account = evmAddress;
  const chainId = evmChainId;
  const connected = evmConnected;
  const connecting = evmConnecting;
  const networkName = NETWORK_CONFIGS[chainId]?.chainName || '';

  // Sync Solana state from adapter
  useEffect(() => {
    setSolanaAddress(publicKey ? publicKey.toBase58() : null);
    setSolanaConnected(solanaConnectedReal);
    setSolanaConnecting(solanaConnectingReal);

    if (solanaConnectedReal && publicKey) {
      const fetchBalance = async () => {
        try {
          const connection = getSolanaConnection();
          const bal = await connection.getBalance(publicKey);
          setSolanaBalance((bal / LAMPORTS_PER_SOL).toFixed(4));
        } catch (err) {
          console.warn('Failed to fetch Solana balance:', err);
        }
      };
      fetchBalance();
    } else {
      setSolanaBalance(null);
    }
  }, [publicKey, solanaConnectedReal, solanaConnectingReal]);

  // Fetch EVM balance when connected
  const getBalance = useCallback(async (showLoading = true) => {
    if (!publicClient || !account) return null;
    try {
      if (showLoading) setLoading(true);
      const bal = await publicClient.getBalance({ address: account });
      const formatted = parseFloat(formatEther(bal)).toFixed(4);
      setBalance(formatted);
      return formatted;
    } catch (err) {
      console.error('Failed to get balance:', err);
      return null;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [publicClient, account]);

  useEffect(() => {
    if (connected && account) getBalance(false);
    else setBalance(null);
  }, [connected, account, chainId, getBalance]);

  const getTokenBalance = async (tokenAddress: string, decimals: number = 18) => {
    if (!publicClient || !account) return '0';
    try {
      const bal = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
      });
      return formatUnits(bal, decimals);
    } catch {
      return '0';
    }
  };

  const getUSDCBalance = async () => {
    const usdcAddress = getCurrentUSDCAddress();
    if (!usdcAddress) return '0';
    return await getTokenBalance(usdcAddress, 6);
  };

  const getCurrentUSDCAddress = (): string | null => {
    if (!chainId) return null;
    return getUSDCAddress(chainId) || null;
  };

  const connect = () => {
    setConnectModalOpen(true);
  };

  const disconnect = () => {
    wagmiDisconnect();
  };

  const switchNetwork = async (targetChainId: number) => {
    switchChain({ chainId: targetChainId });
  };

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

  const value: WalletContextType = {
    connect,
    disconnect,
    account,
    chainId,
    balance,
    networkName,
    publicClient: publicClient ?? null,
    walletClient: walletClient ?? null,
    connected,
    connecting,
    loading,
    error,
    getBalance,
    getTokenBalance,
    getUSDCBalance,
    switchNetwork,
    getCurrentUSDCAddress,
    networkConfigs: NETWORK_CONFIGS,
    solanaAddress,
    solanaConnected,
    solanaConnecting,
    solanaBalance,
    solanaWallet,
    connectSolana,
    disconnectSolana,
    activeChainFamily,
    setActiveChainFamily,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

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
