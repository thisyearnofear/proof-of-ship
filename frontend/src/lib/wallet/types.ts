/**
 * Wallet Context Types
 */

import type { PublicClient, WalletClient } from 'viem';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

export interface NetworkConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export interface CreditProfile {
  usedAmount: string;
  totalAmount: string;
  baseAmount: string;
  marketBoost: string;
  reputation: number;
}

export interface NanopaymentTransaction {
  id: string;
  type: string;
  agentName: string;
  amount: number;
  status: string;
  timestamp: string;
  txHash?: string;
  projectName?: string;
}

export interface CircleWallet {
  id: string;
  address: string;
  blockchain: string;
  accountType: string;
  custodyType: string;
}

export interface CircleConfig {
  userToken: string;
  apiKey: string;
  walletSetId: string;
}

export interface CircleWalletCreateParams {
  idempotencyKey?: string;
  metadata?: Record<string, string>;
}

export interface NanopaymentPaymentResult {
  success: boolean;
  data?: unknown;
  error?: string;
  txHash?: string;
  status?: 'paid' | 'payment_required' | 'failed';
}

export interface FundingRequestData {
  projectId: string;
  amount: number;
  ecosystem: string;
  description?: string;
}

export interface CheckInResult {
  success: boolean;
  txHash?: string;
  timestamp?: string;
}

export interface PayForAgentParams {
  endpoint: string;
  [key: string]: unknown;
}

export interface WalletContextType {
  connect: () => void;
  disconnect: () => void;
  account: string | undefined;
  chainId: number | undefined;
  balance: string | null;
  networkName: string;
  publicClient: PublicClient | null;
  walletClient: WalletClient | null;
  connected: boolean;
  connecting: boolean;
  loading: boolean;
  error: string | null;
  getBalance: (showLoading?: boolean) => Promise<string | null>;
  getTokenBalance: (tokenAddress: string, decimals?: number) => Promise<string>;
  switchNetwork: (chainId: number) => Promise<void>;
  getUSDCBalance: () => Promise<string>;
  getCurrentUSDCAddress: () => string | null;
  networkConfigs: Record<number, NetworkConfig>;

  solanaAddress: string | null;
  solanaConnected: boolean;
  solanaConnecting: boolean;
  solanaBalance: string | null;
  solanaWallet: WalletContextState | null;
  connectSolana: () => Promise<void>;
  disconnectSolana: () => void;
  activeChainFamily: 'evm' | 'solana';
  setActiveChainFamily: (family: 'evm' | 'solana') => void;
}
