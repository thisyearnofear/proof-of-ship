/**
 * Wallet Context Types
 * Extracted from WalletContext.tsx for DRY type sharing
 */

import { providers, Signer } from 'ethers';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

export interface ExternalProvider {
  isMetaMask?: boolean;
  isConnected?: () => boolean;
  request?: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
}

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
  activeProvider: ExternalProvider | null;
  provider: ExternalProvider | null;
  getBalance: (showLoading?: boolean) => Promise<string | null>;
  getTokenBalance: (tokenAddress: string, decimals?: number) => Promise<string>;
  switchNetwork: (chainId: number) => Promise<void>;
  addToken: (tokenAddress: string, symbol: string, decimals?: number) => Promise<void>;
  getUSDCBalance: () => Promise<string>;
  addUSDCToken: () => Promise<boolean>;
  networkConfigs: Record<number, NetworkConfig>;
  getCurrentUSDCAddress: () => string | null;

  circleWallets: CircleWallet[];
  circleConfig: CircleConfig | null;
  createCircleWallet: (config?: CircleWalletCreateParams) => Promise<CircleWallet>;
  refreshCircleWallets: () => Promise<void>;
  transferUSDC: (amount: number, destinationAddress: string, walletId: string, reason?: string) => Promise<{ txHash: string }>;

  nanopaymentInitialized: boolean;
  nanopaymentBalance: { available: string; locked: string };
  nanopaymentAddress: string | null;
  nanopaymentTransactions: NanopaymentTransaction[];
  nanopaymentDemoMode: boolean;
  setNanopaymentDemoMode: (mode: boolean) => void;
  initializeNanopayment: (privateKey: string | `0x${string}`) => Promise<void>;
  initializeNanopaymentDemo: () => void;
  depositNanopayment: (amountUSDC: number) => Promise<{ txHash: string }>;
  payForAgent: (agentType: string, params?: PayForAgentParams) => Promise<NanopaymentPaymentResult>;
  payForHealthScore: (projectId: string, baseUrl?: string, projectName?: string) => Promise<NanopaymentPaymentResult>;
  payForScout: (baseUrl?: string) => Promise<NanopaymentPaymentResult>;
  payForVerification: (prId: string, lines: number, baseUrl?: string) => Promise<NanopaymentPaymentResult>;
  payForRebalance: (baseUrl?: string) => Promise<NanopaymentPaymentResult>;

  creditProfile: CreditProfile | null;
  repayLoan: (amount: string | number, projectPda?: PublicKey) => Promise<void>;
  postCheckIn: (projectId: number, metadata: string) => Promise<CheckInResult>;
  loadCreditProfile: () => Promise<void>;
  requestFunding: (projectData: FundingRequestData) => Promise<{ success: boolean; txHash?: string }>;

  solanaAddress: string | null;
  solanaConnected: boolean;
  solanaConnecting: boolean;
  solanaBalance: string | null;
  solanaWallet: WalletContextState | null;
  connectSolana: () => Promise<void>;
  disconnectSolana: () => void;
  activeChainFamily: 'evm' | 'solana';
  setActiveChainFamily: (family: 'evm' | 'solana') => void;

  syncEip6963Account: (provider: ExternalProvider) => Promise<void>;
}
