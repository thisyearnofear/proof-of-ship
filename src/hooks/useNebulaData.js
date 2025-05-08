import { useState, useEffect } from "react";
import {
  getTokenPriceByAddress,
  getTokenPriceHistory,
  getContractTransactionHistory,
  getTokenHolders,
  getContractAnalytics,
} from "@/utils/nebulaClient";

// Mock data for when the API is not available
const mockNebulaData = {
  transactions: {
    transactions: [
      {
        hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        timestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        method: "transfer",
        value: "1.5",
      },
      {
        hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        timestamp: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
        method: "swap",
        value: "2.3",
      },
      {
        hash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
        timestamp: Math.floor(Date.now() / 1000) - 259200, // 3 days ago
        method: "transfer",
        value: "0.75",
      },
    ],
  },
  analytics: {
    totalTransactions: "156",
    uniqueUsers: "42",
    avgDailyTransactions: "8",
    contractAge: "3 months",
    transactionVolume: "12,345 CUSD",
    priceImpact: "0.05%",
  },
};

/**
 * Hook for fetching and managing Nebula API data
 *
 * @param {string} contractAddress - The contract address
 * @param {string} network - The blockchain network (e.g., 'celo', 'ethereum')
 * @param {Array<string>} dataTypes - Types of data to fetch ('price', 'priceHistory', 'transactions', 'holders', 'analytics')
 * @param {boolean} useMockData - Whether to use mock data instead of making API calls
 * @returns {Object} - Nebula data and loading states
 */
export function useNebulaData(
  contractAddress,
  network = "celo",
  dataTypes = ["analytics"],
  useMockData = false // Set to true to use mock data
) {
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

  useEffect(() => {
    if (!contractAddress) return;

    // If using mock data, set it and return
    if (useMockData) {
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

    // Fetch selected data types
    if (dataTypes.includes("price")) {
      fetchData("price", getTokenPriceByAddress, contractAddress, network);
    }

    if (dataTypes.includes("priceHistory")) {
      fetchData(
        "priceHistory",
        getTokenPriceHistory,
        contractAddress,
        network,
        "30d"
      );
    }

    if (dataTypes.includes("transactions")) {
      fetchData(
        "transactions",
        getContractTransactionHistory,
        contractAddress,
        network,
        20
      );
    }

    if (dataTypes.includes("holders")) {
      fetchData("holders", getTokenHolders, contractAddress, network);
    }

    if (dataTypes.includes("analytics")) {
      fetchData("analytics", getContractAnalytics, contractAddress, network);
    }
  }, [contractAddress, network, dataTypes, useMockData]);

  return {
    data,
    loading,
    error,
    isLoading: Object.values(loading).some(Boolean),
    hasError: Object.values(error).some(Boolean),
  };
}
