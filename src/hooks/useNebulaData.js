import { useState, useEffect } from "react";
import {
  getTokenPriceByAddress,
  getTokenPriceHistory,
  getContractTransactionHistory,
  getTokenHolders,
  getContractAnalytics,
} from "@/utils/nebulaClient";

// Mock data for when the API is not available or fails
const mockNebulaData = {
  transactions: {
    transactions: [
      {
        hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        timestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        method: "transfer",
        value: "1.5",
        from: "0x1234...5678",
        to: "0xabcd...ef01",
      },
      {
        hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        timestamp: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
        method: "swap",
        value: "2.3",
        from: "0x2345...6789",
        to: "0xbcde...f012",
      },
      {
        hash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
        timestamp: Math.floor(Date.now() / 1000) - 259200, // 3 days ago
        method: "transfer",
        value: "0.75",
        from: "0x3456...7890",
        to: "0xcdef...0123",
      },
    ],
    message: "Here are the recent transactions for the contract.",
  },
  analytics: {
    analytics: {
      totalTransactions: "156",
      uniqueUsers: "42",
      avgDailyTransactions: "8",
      contractAge: "3 months",
      transactionVolume: "12,345 CUSD",
      priceImpact: "0.05%",
    },
    message:
      "The contract has processed 156 transactions from 42 unique users.",
  },
  price: {
    price: "$0.85",
    message: "The current price of the token is $0.85 USD.",
  },
  priceHistory: {
    history: [
      { date: "2023-01-01", price: 0.75 },
      { date: "2023-01-15", price: 0.8 },
      { date: "2023-02-01", price: 0.82 },
      { date: "2023-02-15", price: 0.79 },
      { date: "2023-03-01", price: 0.85 },
    ],
    message: "Here is the price history for the token.",
  },
  holders: {
    holders: [
      { address: "0x1234...5678", balance: "1,000,000", percentage: "25%" },
      { address: "0x2345...6789", balance: "750,000", percentage: "18.75%" },
      { address: "0x3456...7890", balance: "500,000", percentage: "12.5%" },
      { address: "0x4567...8901", balance: "250,000", percentage: "6.25%" },
      { address: "0x5678...9012", balance: "100,000", percentage: "2.5%" },
    ],
    message: "Here are the top token holders.",
  },
};

/**
 * Hook for fetching and managing Nebula API data
 *
 * @param {string} contractAddress - The contract address
 * @param {string} network - The blockchain network (e.g., 'celo', 'ethereum')
 * @param {Array<string>} dataTypes - Types of data to fetch ('price', 'priceHistory', 'transactions', 'holders', 'analytics')
 * @param {boolean} useMockData - Whether to use mock data instead of making API calls
 * @param {Object} options - Additional options
 * @param {boolean} options.refreshOnMount - Whether to refresh data when component mounts
 * @param {number} options.refreshInterval - Interval in milliseconds to refresh data
 * @returns {Object} - Nebula data and loading states
 */
export function useNebulaData(
  contractAddress,
  network = "celo",
  dataTypes = ["analytics"],
  useMockData = false, // Set to true to use mock data
  options = {}
) {
  // Check if we're in a production environment
  const isProduction =
    typeof window !== "undefined" &&
    (window.location.hostname === "proofofship.web.app" ||
      window.location.hostname === "proof-of-ship.vercel.app");

  // Always use mock data in production, regardless of the useMockData parameter
  const effectiveUseMockData = useMockData || isProduction;

  const { refreshOnMount = true, refreshInterval = 0 } = options;

  const [data, setData] = useState({
    price: null,
    priceHistory: null,
    transactions: null,
    holders: null,
    analytics: null,
  });

  const [loading, setLoading] = useState({
    price: false,
    priceHistory: false,
    transactions: false,
    holders: false,
    analytics: false,
  });

  const [error, setError] = useState({
    price: null,
    priceHistory: null,
    transactions: null,
    holders: null,
    analytics: null,
  });

  // Function to fetch all requested data types
  const fetchAllData = async () => {
    if (!contractAddress) return;

    // If using mock data, set it and return
    if (effectiveUseMockData) {
      const mockData = {};
      dataTypes.forEach((type) => {
        if (mockNebulaData[type]) {
          mockData[type] = mockNebulaData[type];
        }
      });

      setData((prev) => ({ ...prev, ...mockData }));
      return;
    }

    // Helper function to fetch data and update state
    const fetchData = async (type, fetchFn, ...args) => {
      if (!dataTypes.includes(type)) return;

      setLoading((prev) => ({ ...prev, [type]: true }));
      setError((prev) => ({ ...prev, [type]: null }));

      try {
        const result = await fetchFn(...args);
        setData((prev) => ({ ...prev, [type]: result }));
      } catch (err) {
        console.error(`Error fetching ${type} data:`, err);
        setError((prev) => ({ ...prev, [type]: err.message }));

        // Fallback to mock data on error
        if (mockNebulaData[type]) {
          setData((prev) => ({ ...prev, [type]: mockNebulaData[type] }));
        }
      } finally {
        setLoading((prev) => ({ ...prev, [type]: false }));
      }
    };

    // Create an array of promises for all data types
    const fetchPromises = [];

    if (dataTypes.includes("price")) {
      fetchPromises.push(
        fetchData("price", getTokenPriceByAddress, contractAddress, network)
      );
    }

    if (dataTypes.includes("priceHistory")) {
      fetchPromises.push(
        fetchData(
          "priceHistory",
          getTokenPriceHistory,
          contractAddress,
          network,
          "30d"
        )
      );
    }

    if (dataTypes.includes("transactions")) {
      fetchPromises.push(
        fetchData(
          "transactions",
          getContractTransactionHistory,
          contractAddress,
          network,
          20
        )
      );
    }

    if (dataTypes.includes("holders")) {
      fetchPromises.push(
        fetchData("holders", getTokenHolders, contractAddress, network)
      );
    }

    if (dataTypes.includes("analytics")) {
      fetchPromises.push(
        fetchData("analytics", getContractAnalytics, contractAddress, network)
      );
    }

    // Wait for all promises to resolve
    await Promise.all(fetchPromises);
  };

  // Initial data fetch on mount
  useEffect(() => {
    if (refreshOnMount) {
      fetchAllData();
    }

    // Set up refresh interval if specified
    let intervalId = null;
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchAllData, refreshInterval);
    }

    // Clean up interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    contractAddress,
    network,
    dataTypes,
    effectiveUseMockData,
    refreshOnMount,
    refreshInterval,
  ]);

  return {
    data,
    loading,
    error,
    isLoading: Object.values(loading).some(Boolean),
    hasError: Object.values(error).some(Boolean),
    refresh: fetchAllData, // Expose refresh function
  };
}
