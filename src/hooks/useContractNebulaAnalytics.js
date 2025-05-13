import { useState, useCallback } from "react";
import {
  getContractAnalytics,
  getContractTransactionHistory,
} from "@/utils/nebulaClient";

/**
 * Fetches Nebula contract analytics and recent transactions for a contract address.
 * Manual fetch only (no auto-fetch on mount).
 * @param {string} contractAddress
 * @param {string} network (default: 'celo')
 */
export function useContractNebulaAnalytics(contractAddress, network = "celo") {
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!contractAddress) return;
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, txRes] = await Promise.all([
        getContractAnalytics(contractAddress, network),
        getContractTransactionHistory(contractAddress, network, 20),
      ]);
      setAnalytics(analyticsRes.analytics);
      setTransactions(txRes.transactions || []);
      setHasFetched(true);
    } catch (err) {
      setError(err.message || "Failed to fetch contract analytics");
    } finally {
      setLoading(false);
    }
  }, [contractAddress, network]);

  return { analytics, transactions, loading, error, fetchAnalytics, hasFetched };
}
