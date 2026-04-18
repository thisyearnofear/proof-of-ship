/**
 * Correct Testnet USDC Token Addresses
 * Updated with official Circle testnet addresses
 */

export const TESTNET_USDC_ADDRESSES = {
  // Ethereum Sepolia
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",

  // Arbitrum Sepolia
  421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",

  // Base Sepolia
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",

  // OP Sepolia
  11155420: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",

  // Celo Alfajores
  44787: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",

  // Linea Sepolia
  59141: "0xFEce4462D57bD51A6A552365A011b95f0E16d9B7",

  // Arc Testnet (native USDC ERC-20 interface)
  5042002: "0x3600000000000000000000000000000000000000",
};

export const MAINNET_USDC_ADDRESSES = {
  // Ethereum Mainnet
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",

  // Arbitrum One
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",

  // Base
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",

  // Optimism
  10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",

  // Celo
  42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a",

  // Linea
  59144: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
};

export const USDC_ADDRESSES = {
  ...TESTNET_USDC_ADDRESSES,
  ...MAINNET_USDC_ADDRESSES,
};

export const BUILDER_CREDIT_CORE_ADDRESSES = {
  // Use same address for demo purposes if not deployed
  11155111: "0x7890123456789012345678901234567890123456",
  421614: "0x7890123456789012345678901234567890123456",
  84532: "0x7890123456789012345678901234567890123456",
  11155420: "0x7890123456789012345678901234567890123456",
  44787: "0x7890123456789012345678901234567890123456",
  59141: "0x7890123456789012345678901234567890123456",
};

export const HACKATHON_REGISTRY_ADDRESSES = {
  11155111: "0x9012345678901234567890123456789012345678",
  421614: "0x9012345678901234567890123456789012345678",
  84532: "0x9012345678901234567890123456789012345678",
  11155420: "0x9012345678901234567890123456789012345678",
  44787: "0x9012345678901234567890123456789012345678",
  59141: "0x9012345678901234567890123456789012345678",
};

export const TESTNET_CHAIN_INFO = {
  11155111: {
    name: "Ethereum Sepolia",
    symbol: "ETH",
    decimals: 18,
    rpcUrl: "https://sepolia.infura.io/v3/",
    explorer: "https://sepolia.etherscan.io",
  },
  421614: {
    name: "Arbitrum Sepolia",
    symbol: "ETH",
    decimals: 18,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorer: "https://sepolia.arbiscan.io",
  },
  84532: {
    name: "Base Sepolia",
    symbol: "ETH",
    decimals: 18,
    rpcUrl: "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
  },
  11155420: {
    name: "OP Sepolia",
    symbol: "ETH",
    decimals: 18,
    rpcUrl: "https://sepolia.optimism.io",
    explorer: "https://sepolia-optimism.etherscan.io",
  },
  44787: {
    name: "Celo Alfajores",
    symbol: "CELO",
    decimals: 18,
    rpcUrl: "https://alfajores-forno.celo-testnet.org",
    explorer: "https://alfajores-blockscout.celo-testnet.org",
  },
  59141: {
    name: "Linea Sepolia",
    symbol: "ETH",
    decimals: 18,
    rpcUrl: "https://rpc.sepolia.linea.build",
    explorer: "https://sepolia.lineascan.build",
  },
  5042002: {
    name: "Arc Testnet",
    symbol: "USDC",
    decimals: 18,
    rpcUrl: "https://rpc.testnet.arc.network",
    explorer: "https://testnet.arcscan.app",
  },
};

export const USDC_TOKEN_INFO = {
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  isStablecoin: true,
};
