/**
 * LI.FI Integration Context
 * Provides cross-chain transfer functionality using the LI.FI bridge aggregator
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useMetaMask } from "./MetaMaskContext";
import { LiFi } from "@lifi/sdk";
import { ethers } from "ethers";
import { TESTNET_USDC_ADDRESSES } from "../config/tokens";

// Create the context
const LiFiContext = createContext();

// Hook to use the LiFi context
export const useLiFi = () => {
  const context = useContext(LiFiContext);
  if (!context) {
    throw new Error("useLiFi must be used within a LiFiProvider");
  }
  return context;
};

// LiFi Provider component
export const LiFiProvider = ({ children }) => {
  const { account, provider, chainId, networkConfigs } = useMetaMask();
  const [isInitialized, setIsInitialized] = useState(false);
  const [availableChains, setAvailableChains] = useState([]);
  const [availableTokens, setAvailableTokens] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transferHistory, setTransferHistory] = useState([]);

  // USDC token addresses for testnet chains
  const usdcAddresses = TESTNET_USDC_ADDRESSES;

  // LiFi SDK instance
  const [lifi, setLifi] = useState(null);

  // Initialize the LI.FI SDK instance
  useEffect(() => {
    // Initialize the LI.FI SDK with recommended configuration
    const lifiInstance = new LiFi({
      apiUrl: "https://li.fi/api",
      integrator: "BuilderCredit",
    });

    setLifi(lifiInstance);
  }, []);

  // Initialize available chains and tokens
  useEffect(() => {
    const initializeLiFi = async () => {
      if (!lifi) return;

      try {
        setLoading(true);

        // Get available chains from LI.FI
        const { chains: lifiChains } = await lifi.getChains();

        // Filter and map chains to our format, using network configs as fallback
        const chains = lifiChains
          .map((chain) => {
            const networkConfig = networkConfigs[chain.id];

            return {
              id: chain.id,
              name: chain.name,
              token:
                chain.nativeCurrency?.symbol ||
                networkConfig?.nativeCurrency?.symbol ||
                "ETH",
              icon: getChainIcon(chain.id),
              logoURI: chain.logoURI || getChainLogoURI(chain.id),
              lifiChain: chain, // Keep reference to original LI.FI chain data
            };
          })
          .filter((chain) =>
            // Only include chains that are in our network configs
            Object.keys(networkConfigs).includes(chain.id.toString())
          );

        setAvailableChains(chains);

        // Get token data for each chain from LI.FI
        const tokenData = {};

        for (const chain of chains) {
          try {
            const { tokens } = await lifi.getTokens({
              chains: [chain.id],
            });

            // Find the USDC token for this chain
            const usdcToken = tokens[chain.id]?.find(
              (token) =>
                token.address.toLowerCase() ===
                usdcAddresses[chain.id]?.toLowerCase()
            );

            // Store USDC and native token for each chain
            if (tokens[chain.id]) {
              const nativeToken = tokens[chain.id].find(
                (token) =>
                  token.address ===
                    "0x0000000000000000000000000000000000000000" ||
                  token.symbol === chain.token
              );

              tokenData[chain.id] = [nativeToken, usdcToken].filter(Boolean);
            }
          } catch (err) {
            console.error(`Failed to get tokens for chain ${chain.id}:`, err);
          }
        }

        // Fall back to mock data if we couldn't get token data
        if (Object.keys(tokenData).length === 0) {
          chains.forEach((chain) => {
            tokenData[chain.id] = [
              {
                address: "0x0000000000000000000000000000000000000000",
                symbol: chain.token,
                name: chain.name + " " + chain.token,
                decimals: 18,
                chainId: chain.id,
                logoURI: getTokenLogoURI(chain.token),
              },
              {
                address:
                  usdcAddresses[chain.id] ||
                  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                symbol: "USDC",
                name: "USD Coin",
                decimals: 6,
                chainId: chain.id,
                logoURI:
                  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
              },
            ].filter(Boolean);
          });
        }

        setAvailableTokens(tokenData);
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize LiFi:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeLiFi();
  }, [networkConfigs]);

  // Helper function to get chain icon
  const getChainIcon = (chainId) => {
    switch (chainId) {
      case 1:
        return "🔷"; // Ethereum
      case 137:
        return "🟣"; // Polygon
      case 10:
        return "🔴"; // Optimism
      case 42161:
        return "🔵"; // Arbitrum
      case 56:
        return "🟡"; // BNB Chain
      case 43114:
        return "🔺"; // Avalanche
      case 42220:
        return "🟢"; // Celo
      case 8453:
        return "🔷"; // Base
      default:
        return "🌐";
    }
  };

  // Helper function to get chain logo URI
  const getChainLogoURI = (chainId) => {
    switch (chainId) {
      case 1:
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png";
      case 137:
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png";
      case 10:
        return "https://raw.githubusercontent.com/ethereum-optimism/brand-kit/main/assets/svg/Optimism_Logo_Circle.svg";
      case 42161:
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png";
      case 56:
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png";
      case 43114:
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png";
      case 42220:
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/celo/info/logo.png";
      case 8453:
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png";
      default:
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png";
    }
  };

  // Helper function to get token logo URI
  const getTokenLogoURI = (symbol) => {
    switch (symbol) {
      case "ETH":
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png";
      case "MATIC":
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png";
      case "BNB":
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png";
      case "AVAX":
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png";
      case "CELO":
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/celo/info/logo.png";
      default:
        return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png";
    }
  };

  // Get a quote for a cross-chain transfer
  const getQuote = async (
    fromChainId,
    toChainId,
    fromTokenAddress,
    toTokenAddress,
    fromAmount,
    options = {}
  ) => {
    if (!account || !provider || !isInitialized || !lifi) {
      throw new Error("LiFi not initialized or wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      // Format the quote request for LI.FI SDK
      const quoteRequest = {
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        fromAmount,
        fromAddress: account,
        options: {
          slippage: parseFloat(options.slippage || 1) / 100, // Convert percentage to decimal
          integrator: "BuilderCredit",
          // Add any other options
          ...options,
        },
      };

      // Call the LI.FI SDK to get a quote
      const quoteResult = await lifi.getQuote(quoteRequest);

      return quoteResult;
    } catch (err) {
      console.error("Failed to get quote:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load transfer history from localStorage
  useEffect(() => {
    const loadTransferHistory = () => {
      try {
        const storedHistory = localStorage.getItem("lifi_transfer_history");
        if (storedHistory) {
          setTransferHistory(JSON.parse(storedHistory));
        }
      } catch (err) {
        console.error("Failed to load transfer history:", err);
      }
    };

    loadTransferHistory();
  }, []);

  // Save transfer history to localStorage
  const saveTransferHistory = useCallback((history) => {
    try {
      localStorage.setItem("lifi_transfer_history", JSON.stringify(history));
    } catch (err) {
      console.error("Failed to save transfer history:", err);
    }
  }, []);

  // Execute a cross-chain transfer
  const executeTransfer = async (quote) => {
    if (!account || !provider || !isInitialized || !lifi) {
      throw new Error("LiFi not initialized or wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      // We need to use the provider from MetaMask
      // Convert provider to ethers.js provider
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const signer = ethersProvider.getSigner();

      // Execute the transfer using the LI.FI SDK
      const result = await lifi.executeQuote(quote, {
        signer,
        infiniteApproval: false, // Set to true to enable infinite approval
      });

      // Create transfer record
      const transfer = {
        id: `${result.transactionHash}-${Date.now()}`,
        txHash: result.transactionHash,
        fromChainId: quote.action.fromChainId,
        toChainId: quote.action.toChainId,
        fromToken: quote.action.fromToken,
        toToken: quote.action.toToken,
        fromAmount: quote.action.fromAmount,
        estimatedToAmount: quote.estimate.toAmount,
        timestamp: Date.now(),
        status: "PENDING",
        route: quote.tool || quote.includedSteps?.[0]?.tool || "Direct",
        estimated: {
          executionDuration: quote.estimate.executionDuration,
          feeCosts: quote.estimate.feeCosts,
          gasCosts: quote.estimate.gasCosts,
        },
      };

      // Add to transfer history
      const updatedHistory = [transfer, ...transferHistory];
      setTransferHistory(updatedHistory);
      saveTransferHistory(updatedHistory);

      return transfer;
    } catch (err) {
      console.error("Transfer failed:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Track a transfer's status
  const getTransferStatus = async (txHash, fromChainId, toChainId) => {
    if (!lifi) {
      throw new Error("LiFi not initialized");
    }

    try {
      // Get transfer status from LI.FI
      const status = await lifi.getStatus({
        txHash,
        fromChainId,
        toChainId,
      });

      return status;
    } catch (err) {
      console.error("Failed to get transfer status:", err);
      throw err;
    }
  };

  // Get routes for a potential transfer
  const getRoutes = async (
    fromChainId,
    toChainId,
    fromTokenAddress,
    toTokenAddress,
    fromAmount
  ) => {
    if (!lifi) {
      throw new Error("LiFi not initialized");
    }

    try {
      setLoading(true);

      const routesRequest = {
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        fromAmount,
        fromAddress: account,
      };

      const routesResult = await lifi.getRoutes(routesRequest);

      return routesResult;
    } catch (err) {
      console.error("Failed to get routes:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get transaction status updates via subscription
  const subscribeToStatus = (txHash, fromChainId, callback) => {
    if (!lifi) {
      throw new Error("LiFi not initialized");
    }

    // Create subscription to status updates
    const subscription = lifi.subscribeToStatus(
      {
        txHash,
        fromChainId,
      },
      callback
    );

    // Return unsubscribe function
    return () => subscription.unsubscribe();
  };

  // Get all transfer history
  const getTransferHistory = () => {
    return transferHistory;
  };

  // Update transfer status in history
  const updateTransferStatus = useCallback(async () => {
    if (!lifi || transferHistory.length === 0) return;

    try {
      const updatedHistory = [...transferHistory];
      let hasUpdates = false;

      for (let i = 0; i < updatedHistory.length; i++) {
        const transfer = updatedHistory[i];

        // Only check status for pending or ongoing transfers
        if (transfer.status !== "DONE" && transfer.status !== "FAILED") {
          try {
            const status = await getTransferStatus(
              transfer.txHash,
              transfer.fromChainId,
              transfer.toChainId
            );

            if (status && status.status !== transfer.status) {
              updatedHistory[i] = {
                ...transfer,
                status: status.status,
                lastUpdated: Date.now(),
              };
              hasUpdates = true;
            }
          } catch (err) {
            console.error(
              `Failed to update status for transfer ${transfer.id}:`,
              err
            );
          }
        }
      }

      if (hasUpdates) {
        setTransferHistory(updatedHistory);
        saveTransferHistory(updatedHistory);
      }

      return updatedHistory;
    } catch (err) {
      console.error("Failed to update transfer statuses:", err);
      return transferHistory;
    }
  }, [lifi, transferHistory, getTransferStatus, saveTransferHistory]);

  // Periodically update transfer statuses
  useEffect(() => {
    if (!lifi || transferHistory.length === 0) return;

    // Check if we have any pending transfers
    const hasPendingTransfers = transferHistory.some(
      (transfer) => transfer.status !== "DONE" && transfer.status !== "FAILED"
    );

    if (!hasPendingTransfers) return;

    // Update status every 30 seconds
    const intervalId = setInterval(() => {
      updateTransferStatus();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [lifi, transferHistory, updateTransferStatus]);

  // Context value
  const value = {
    // State
    isInitialized,
    availableChains,
    availableTokens,
    loading,
    error,

    // Chain data helpers
    usdcAddresses,
    getChainIcon,
    getChainLogoURI,
    getTokenLogoURI,

    // LiFi SDK instance
    lifi,

    // Actions
    getQuote,
    executeTransfer,
    getTransferStatus,
    getRoutes,
    subscribeToStatus,

    // Transfer history
    transferHistory,
    getTransferHistory,
    updateTransferStatus,
  };

  return <LiFiContext.Provider value={value}>{children}</LiFiContext.Provider>;
};

export default LiFiProvider;
