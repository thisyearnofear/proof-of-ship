/**
 * Wallet Context Constants
 * Extracted from WalletContext.tsx for DRY constant sharing
 */

import { Connection, clusterApiUrl } from '@solana/web3.js';
import type { NetworkConfig } from './types';

export const AGENT_PRICES: Record<string, number> = {
  underwrite: 0.05,
  scout: 0.01,
  verify: 0.001,
  rebalance: 0.01,
};

export const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
  1: { chainId: '0x1', chainName: 'Ethereum Mainnet', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.infura.io/v3/'], blockExplorerUrls: ['https://etherscan.io'] },
  137: { chainId: '0x89', chainName: 'Polygon Mainnet', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com/'], blockExplorerUrls: ['https://polygonscan.com'] },
  10: { chainId: '0xa', chainName: 'Optimism', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.optimism.io'], blockExplorerUrls: ['https://optimistic.etherscan.io'] },
  42161: { chainId: '0xa4b1', chainName: 'Arbitrum One', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://arb1.arbitrum.io/rpc'], blockExplorerUrls: ['https://arbiscan.io'] },
  42220: { chainId: '0xa4ec', chainName: 'Celo Mainnet', nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 }, rpcUrls: ['https://forno.celo.org'], blockExplorerUrls: ['https://explorer.celo.org'] },
  8453: { chainId: '0x2105', chainName: 'Base', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org'] },
  5042002: { chainId: '0x4CE912', chainName: 'Arc Testnet', nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 18 }, rpcUrls: ['https://rpc.testnet.arc.network'], blockExplorerUrls: ['https://testnet.arcscan.app'] },
};

type SolanaCluster = 'devnet' | 'testnet' | 'mainnet-beta' | 'mainnet';

export const getSolanaEndpoint = (): string => {
  const explicit = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (explicit) return explicit;
  const cluster = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet').toLowerCase() as SolanaCluster;
  if (cluster === 'mainnet-beta' || cluster === 'mainnet') return clusterApiUrl('mainnet-beta');
  if (cluster === 'testnet') return clusterApiUrl('testnet');
  return clusterApiUrl('devnet');
};

export const getSolanaConnection = () => new Connection(getSolanaEndpoint(), { commitment: 'confirmed' });
