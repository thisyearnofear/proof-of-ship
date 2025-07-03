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
};

export const USDC_TOKEN_INFO = {
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  isStablecoin: true,
};
