/**
 * Network Configuration
 * Centralized network definitions and utilities
 */

import { TESTNET_USDC_ADDRESSES, TESTNET_CHAIN_INFO } from "./tokens";

export const NETWORK_CONFIGS = {
  // Combine chain info with USDC addresses
  ...Object.keys(TESTNET_CHAIN_INFO).reduce((acc, chainId) => {
    const id = parseInt(chainId);
    acc[id] = {
      ...TESTNET_CHAIN_INFO[id],
      chainId: id,
      usdcAddress: TESTNET_USDC_ADDRESSES[id],
      isTestnet: true,
    };
    return acc;
  }, {}),
};

export const SUPPORTED_CHAINS = Object.keys(NETWORK_CONFIGS).map((id) =>
  parseInt(id)
);

export const MAINNET_CHAIN_IDS = [1, 137, 10, 42161, 8453, 100]; // For future use
export const TESTNET_CHAIN_IDS = SUPPORTED_CHAINS;

// Helper functions
export const getNetworkConfig = (chainId) => {
  return NETWORK_CONFIGS[chainId] || null;
};

export const getUSDCAddress = (chainId) => {
  return TESTNET_USDC_ADDRESSES[chainId] || null;
};

export const isTestnet = (chainId) => {
  return TESTNET_CHAIN_IDS.includes(chainId);
};

export const getExplorerUrl = (chainId) => {
  const config = getNetworkConfig(chainId);
  return config?.explorer || null;
};

export const getRpcUrl = (chainId) => {
  const config = getNetworkConfig(chainId);
  return config?.rpcUrl || null;
};

export const getNetworkName = (chainId) => {
  const config = getNetworkConfig(chainId);
  return config?.name || `Chain ${chainId}`;
};

export const getSupportedChainIds = () => {
  return SUPPORTED_CHAINS;
};

export const validateChainId = (chainId) => {
  return SUPPORTED_CHAINS.includes(parseInt(chainId));
};
