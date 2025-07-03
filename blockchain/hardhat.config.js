require("@nomicfoundation/hardhat-toolbox");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Default Hardhat account 0 private key
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Default development network
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,
        interval: 5000,
      },
    },
    // Local network
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Testnet - Ethereum Sepolia
    sepolia: {
      url:
        process.env.ETHEREUM_SEPOLIA_RPC ||
        (INFURA_API_KEY
          ? `https://sepolia.infura.io/v3/${INFURA_API_KEY}`
          : ""),
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // Arbitrum Sepolia
    arbitrumSepolia: {
      url:
        process.env.ARBITRUM_SEPOLIA_RPC ||
        "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: [PRIVATE_KEY],
      chainId: 421614,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // Base Sepolia
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts: [PRIVATE_KEY],
      chainId: 84532,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // OP Sepolia
    opSepolia: {
      url: process.env.OPTIMISM_SEPOLIA_RPC || "https://sepolia.optimism.io",
      accounts: [PRIVATE_KEY],
      chainId: 11155420,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // Celo Alfajores
    celoAlfajores: {
      url:
        process.env.CELO_ALFAJORES_RPC ||
        "https://alfajores-forno.celo-testnet.org",
      accounts: [PRIVATE_KEY],
      chainId: 44787,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // Linea Sepolia
    lineaSepolia: {
      url: process.env.LINEA_SEPOLIA_RPC || "https://rpc.sepolia.linea.build",
      accounts: [PRIVATE_KEY],
      chainId: 59141,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // Mainnet
    ethereum: {
      url: INFURA_API_KEY
        ? `https://mainnet.infura.io/v3/${INFURA_API_KEY}`
        : "",
      accounts: [PRIVATE_KEY],
      chainId: 1,
    },
    polygon: {
      url: INFURA_API_KEY
        ? `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`
        : "",
      accounts: [PRIVATE_KEY],
      chainId: 137,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
  },
  mocha: {
    timeout: 100000,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
