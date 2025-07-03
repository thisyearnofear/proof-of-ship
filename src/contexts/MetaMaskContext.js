import React, { createContext, useContext, useState, useEffect } from "react";
import { MetaMaskProvider, useSDK } from "@metamask/sdk-react";

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

  // Connect to MetaMask
  const connect = async () => {
    try {
      setLoading(true);
      setError(null);
      const accounts = await sdk?.connect();
      console.log("Connected accounts:", accounts);
    } catch (err) {
      console.error("Failed to connect:", err);
      setError(err.message);
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
      const balance = await provider.request({
        method: "eth_getBalance",
        params: [account, "latest"],
      });
      // Convert from wei to ETH
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      setBalance(balanceInEth);
    } catch (err) {
      console.error("Failed to get balance:", err);
    }
  };

  // Switch to a specific network
  const switchNetwork = async (chainId) => {
    if (!provider) return;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (err) {
      console.error("Failed to switch network:", err);
      throw err;
    }
  };

  // Add USDC token to wallet
  const addUSDCToken = async () => {
    if (!provider) return;

    try {
      await provider.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: "0xA0b86a33E6441b8435b662f0E2d0B8A0E4B2B8B0", // USDC contract address
            symbol: "USDC",
            decimals: 6,
            image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
          },
        },
      });
    } catch (err) {
      console.error("Failed to add USDC token:", err);
    }
  };

  useEffect(() => {
    if (connected && account) {
      getBalance();
    }
  }, [connected, account]);

  const value = {
    // Connection state
    connected,
    connecting,
    account,
    chainId,
    balance,
    loading,
    error,

    // Actions
    connect,
    disconnect,
    getBalance,
    switchNetwork,
    addUSDCToken,

    // Provider for advanced operations
    provider,
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
      name: "POS Dashboard",
      url: `https://${host}`,
      iconUrl: `https://${host}/favicon.ico`,
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
