/**
 * Wallet Context Types
 * Extracted from WalletContext.tsx for DRY type sharing
 */

import { providers, Signer } from 'ethers';
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

export interface WalletContextType {
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
  provider: any;
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
  repayLoan: (amount: string | number, projectPda?: PublicKey) => Promise<void>;
  postCheckIn: (projectId: number, metadata: string) => Promise<any>;
  loadCreditProfile: () => Promise<void>;
  requestFunding: (projectData: any) => Promise<any>;

  // Solana integration
  solanaAddress: string | null;
  solanaConnected: boolean;
  solanaConnecting: boolean;
  solanaBalance: string | null;
  solanaWallet: WalletContextState | null;
  connectSolana: () => Promise<void>;
  disconnectSolana: () => void;
  activeChainFamily: 'evm' | 'solana';
  setActiveChainFamily: (family: 'evm' | 'solana') => void;

  // EIP-6963
  syncEip6963Account: (provider: any) => Promise<void>;
}
