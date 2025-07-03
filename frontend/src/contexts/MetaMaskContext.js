import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MetaMaskProvider, useSDK } from "@metamask/sdk-react";
import { ethers } from "ethers";

const MetaMaskContext = createContext();

export const useMetaMask = () => {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error("useMetaMask must be used within a MetaMaskProvider");
  }
  return context;
};

const MetaMaskContextProvider = ({ children }) => {
  const { sdk, connected, connecting, provider, chainId, account } = useSDK();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [networkName, setNetworkName] = useState('');
  const [ethersProvider, setEthersProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Connect to MetaMask
  const connect = async () => {
    try {
      setLoading(true);
      setError(null);
      const accounts = await sdk?.connect();
      console.log("Connected accounts:", accounts);
    } catch (err) {
      console.error("Failed to connect:", err);
      setError(err.message || "Failed to connect to MetaMask. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Disconnect from MetaMask
  const disconnect = () => {
    if (sdk) {
      sdk.terminate();
    }
  };

  // Get account balance
  const getBalance = async () => {
    if (!provider || !account) return;

    try {
      setLoading(true);
      const balance = await provider.request({
        method: "eth_getBalance",
        params: [account, "latest"],
      });
      // Convert from wei to ETH
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      setBalance(balanceInEth.toFixed(4));
      return balanceInEth;
    } catch (err) {
      console.error("Failed to get balance:", err);
      setError("Failed to get wallet balance. Please refresh and try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get token balance (for any ERC20 token)
  const getTokenBalance = async (tokenAddress, decimals = 18) => {
    if (!provider || !account || !ethersProvider) return 0;

    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function balanceOf(address owner) view returns (uint256)",
          "function decimals() view returns (uint8)",
          "function symbol() view returns (string)"
        ],
        ethersProvider
      );

      // Get actual decimals if not provided
      let tokenDecimals = decimals;
      try {
        tokenDecimals = await tokenContract.decimals();
      } catch (err) {
        console.warn("Could not get token decimals, using default:", decimals);
      }

      const balance = await tokenContract.balanceOf(account);
      return ethers.utils.formatUnits(balance, tokenDecimals);
    } catch (err) {
      console.error("Failed to get token balance:", err);
      return "0";
    }
  };

  // Network configuration data for commonly used chains
  const networkConfigs = {
    // Ethereum Mainnet
    1: {
      chainId: '0x1',
      chainName: 'Ethereum Mainnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://mainnet.infura.io/v3/'],
      blockExplorerUrls: ['https://etherscan.io']
    },
    // Polygon
    137: {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: ['https://polygon-rpc.com/'],
      blockExplorerUrls: ['https://polygonscan.com']
    },
    // Optimism
    10: {
      chainId: '0xa',
      chainName: 'Optimism',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://mainnet.optimism.io'],
      blockExplorerUrls: ['https://optimistic.etherscan.io']
    },
    // Arbitrum
    42161: {
      chainId: '0xa4b1',
      chainName: 'Arbitrum One',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://arb1.arbitrum.io/rpc'],
      blockExplorerUrls: ['https://arbiscan.io']
    },
    // BNB Chain
    56: {
      chainId: '0x38',
      chainName: 'BNB Smart Chain',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      rpcUrls: ['https://bsc-dataseed.binance.org/'],
      blockExplorerUrls: ['https://bscscan.com']
    },
    // Avalanche
    43114: {
      chainId: '0xa86a',
      chainName: 'Avalanche C-Chain',
      nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
      rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
      blockExplorerUrls: ['https://snowtrace.io']
    },
    // Celo
    42220: {
      chainId: '0xa4ec',
      chainName: 'Celo Mainnet',
      nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
      rpcUrls: ['https://forno.celo.org'],
      blockExplorerUrls: ['https://explorer.celo.org']
    },
    // Base
    8453: {
      chainId: '0x2105',
      chainName: 'Base',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://mainnet.base.org'],
      blockExplorerUrls: ['https://basescan.org']
    }
  };

  // Add a new chain to MetaMask
  const addChain = async (chainId) => {
    if (!provider) return;
    
    const networkConfig = networkConfigs[chainId];
    if (!networkConfig) {
      throw new Error(`Network configuration not found for chainId ${chainId}`);
    }

    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: networkConfig.chainId,
            chainName: networkConfig.chainName,
            nativeCurrency: networkConfig.nativeCurrency,
            rpcUrls: networkConfig.rpcUrls,
            blockExplorerUrls: networkConfig.blockExplorerUrls
          }
        ]
      });
      return true;
    } catch (err) {
      console.error('Failed to add network:', err);
      throw err;
    }
  };

  // Switch to a specific network
  const switchNetwork = async (chainId) => {
    if (!provider) return;

    const hexChainId = `0x${chainId.toString(16)}`;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
      return true;
    } catch (err) {
      // If the chain hasn't been added to MetaMask (error code 4902)
      if (err.code === 4902) {
        try {
          await addChain(chainId);
          // Try switching again after adding
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: hexChainId }],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add and switch network:", addError);
          throw addError;
        }
      } else {
        console.error("Failed to switch network:", err);
        throw err;
      }
    }
  };

  // USDC token addresses across different chains
  const usdcAddresses = {
    // Mainnet USDC
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    // Polygon USDC
    137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    // Optimism USDC
    10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    // Arbitrum USDC
    42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    // BSC USDC
    56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    // Avalanche USDC
    43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    // Celo USDC
    42220: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    // Base USDC
    8453: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
  };

  // Get current USDC address for the connected chain
  const getCurrentUSDCAddress = () => {
    if (!chainId) return null;
    return usdcAddresses[chainId] || null;
  };

  // Get USDC balance
  const getUSDCBalance = async () => {
    const usdcAddress = getCurrentUSDCAddress();
    if (!usdcAddress) return "0";
    return await getTokenBalance(usdcAddress, 6);
  };

  // Add any token to wallet
  const addToken = async (tokenAddress, symbol, decimals, imageUrl) => {
    if (!provider) return false;

    try {
      setLoading(true);
      const wasAdded = await provider.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: symbol,
            decimals: decimals,
            image: imageUrl,
          },
        },
      });
      
      return wasAdded;
    } catch (err) {
      console.error(`Failed to add ${symbol} token:`, err);
      setError(`Failed to add ${symbol} token to wallet: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add USDC token to wallet (network-specific)
  const addUSDCToken = async () => {
    const usdcAddress = getCurrentUSDCAddress();
    if (!usdcAddress) {
      setError("USDC token not available on this network");
      return false;
    }
    
    return await addToken(
      usdcAddress,
      "USDC",
      6,
      "https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
    );
  };

  // Get current network name
  const getNetworkName = useCallback(() => {
    if (!chainId) return "Unknown Network";
    const network = networkConfigs[chainId];
    return network ? network.chainName : `Chain ID: ${chainId}`;
  }, [chainId, networkConfigs]);

  // Initialize ethers provider and update network name
  useEffect(() => {
    if (provider && connected) {
      const ethProvider = new ethers.providers.Web3Provider(provider);
      setEthersProvider(ethProvider);
      setSigner(ethProvider.getSigner());
      
      // Update network name
      const networkName = getNetworkName();
      setNetworkName(networkName);
      
      // Get balances
      getBalance();
    } else {
      setEthersProvider(null);
      setSigner(null);
    }
  }, [provider, connected, chainId, getNetworkName]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (accounts) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length === 0) {
        // Disconnected
        disconnect();
      } else {
        // Update balances when account changes
        getBalance();
      }
    };

    const handleChainChanged = (chainIdHex) => {
      console.log("Chain changed:", chainIdHex);
      // No need to reload the page, we'll handle the update
      const newChainId = parseInt(chainIdHex, 16);
      const networkName = networkConfigs[newChainId]?.chainName || `Chain ID: ${newChainId}`;
      setNetworkName(networkName);
      getBalance();
    };

    // Subscribe to events
    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    // Cleanup
    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
    };
  }, [provider, disconnect]);

  const value = {
    // Connection state
    connected,
    connecting,
    account,
    chainId,
    balance,
    loading,
    error,
    networkName,

    // Actions
    connect,
    disconnect,
    getBalance,
    getTokenBalance,
    getUSDCBalance,
    switchNetwork,
    addChain,
    addToken,
    addUSDCToken,
    
    // Network data
    networkConfigs,
    usdcAddresses,
    getCurrentUSDCAddress,

    // Provider for advanced operations
    provider,
    ethersProvider,
    signer,
    sdk,
  };

  return (
    <MetaMaskContext.Provider value={value}>
      {children}
    </MetaMaskContext.Provider>
  );
};

// Main provider wrapper
export const MetaMaskProviderWrapper = ({ children, demand = true }) => {
  const host =
    typeof window !== "undefined" ? window.location.host : "localhost";
  const sdkOptions = {
    logging: { developerMode: false },
    checkInstallationImmediately: false,
    dappMetadata: {
      name: "Builder Credit Dashboard",
      url: `https://${host}`,
      iconUrl: `https://${host}/favicon.ico`,
    },
    enableDebug: false,
    autoConnect: {
      enable: true,  // Auto-connect if previously connected
    },
  };

  // Always provide the MetaMask context, but control initialization behavior
  return (
    <MetaMaskProvider debug={false} sdkOptions={sdkOptions}>
      <MetaMaskContextProvider>{children}</MetaMaskContextProvider>
    </MetaMaskProvider>
  );
};

export default MetaMaskContextProvider;
