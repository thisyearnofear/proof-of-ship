/**
 * Nanopayment Context
 * 
 * Manages the Circle Gateway wallet and nanopayment flow for ALL AI agents:
 * - AI Underwriter (0.05 USDC) — project health scoring
 * - AI Scout (0.01 USDC) — portfolio recommendations
 * - Verifier Agent (0.001 USDC/10 LOC) — code verification
 * 
 * Part of "Agentic Economy on Arc" hackathon submission.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { nanopaymentService } from "@/services/nanopaymentService";

const NanopaymentContext = createContext();

export const useNanopayment = () => {
  const context = useContext(NanopaymentContext);
  if (!context) {
    throw new Error("useNanopayment must be used within NanopaymentProvider");
  }
  return context;
};

const AGENT_PRICES = {
  underwrite: 0.05,
  scout: 0.01,
  verify: 0.001,
  rebalance: 0.01,
};

export const NanopaymentProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState({ available: "0", locked: "0" });
  const [walletAddress, setWalletAddress] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [streamingPayment, setStreamingPayment] = useState(null);

  const initializeWithKey = useCallback(async (pk) => {
    try {
      setLoading(true);
      setError(null);
      const client = await nanopaymentService.initialize({
        chain: "arcTestnet",
        privateKey: pk,
      });
      setPrivateKey(pk);
      setWalletAddress(client.account?.address || null);
      setIsInitialized(true);
      const bal = await nanopaymentService.getBalance();
      setBalance(bal);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeWithDemo = useCallback(async () => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      setIsInitialized(true);
      setWalletAddress("0xDEMO");
      setBalance({ available: "10.00", locked: "0.00" });
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!isInitialized) return;
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return;
    try {
      const bal = await nanopaymentService.getBalance();
      setBalance(bal);
    } catch (err) {
      console.error("Balance fetch failed:", err);
    }
  }, [isInitialized]);

  const deposit = useCallback(async (amountUSDC) => {
    if (!isInitialized) throw new Error("Wallet not initialized");
    setLoading(true);
    try {
      const result = await nanopaymentService.deposit(amountUSDC);
      await fetchBalance();
      addTransaction({
        id: Date.now().toString(),
        type: "deposit",
        amount: amountUSDC,
        status: "confirmed",
        timestamp: new Date().toISOString(),
        txHash: result.txHash,
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isInitialized, fetchBalance]);

  const addTransaction = useCallback((tx) => {
    setTransactions((prev) => [tx, ...prev].slice(0, 50));
  }, []);

  const payForAgent = useCallback(async (agentType, params = {}) => {
    if (!isInitialized) {
      if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
        await initializeWithDemo();
      } else {
        throw new Error("Wallet not initialized");
      }
    }

    const requiredAmount = AGENT_PRICES[agentType] || 0.05;
    const currentBalance = parseFloat(balance.available);
    
    if (currentBalance < requiredAmount && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
      throw new Error(`Insufficient balance. Need $${requiredAmount}, have $${currentBalance}`);
    }

    setLoading(true);
    setStreamingPayment({ agentType, amount: requiredAmount, status: "pending" });

    try {
      let result;
      let endpoint;
      let displayName;

      switch (agentType) {
        case "underwrite":
          endpoint = `/api/agent/underwrite?projectId=${params.projectId}`;
          displayName = "AI Underwriter";
          break;
        case "scout":
          endpoint = "/api/agent/scout";
          displayName = "AI Scout";
          break;
        case "verify":
          endpoint = `/api/agent/verify?prId=${params.prId}&lines=${params.lines}`;
          displayName = "Verifier Agent";
          break;
        case "rebalance":
          endpoint = "/api/agent/rebalance";
          displayName = "AI Portfolio Manager";
          break;
        default:
          throw new Error(`Unknown agent: ${agentType}`);
      }

      const baseUrl = params.baseUrl || "";
      const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
      if (isDemo) {
        const resp = await fetch(`${baseUrl}${endpoint}`, {
          headers: { "x-demo-key": "demo" },
        });
        const data = resp.ok ? await resp.json() : null;
        result = { success: resp.ok, data, txHash: `0xdemo${Date.now().toString(16)}` };
      } else {
        result = await nanopaymentService.pay(`${baseUrl}${endpoint}`);
      }

      const tx = {
        id: Date.now().toString(),
        type: agentType,
        agentName: displayName,
        amount: requiredAmount,
        status: result.success ? "confirmed" : "failed",
        timestamp: new Date().toISOString(),
        txHash: result.txHash,
        projectName: params.projectName,
      };

      addTransaction(tx);
      setStreamingPayment(null);

      if (result.success) {
        if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
          setBalance((prev) => ({
            ...prev,
            available: (parseFloat(prev.available) - requiredAmount).toFixed(2),
          }));
        } else {
          await fetchBalance();
        }
      }

      return { ...result, transaction: tx };
    } catch (err) {
      setError(err.message);
      setStreamingPayment(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isInitialized, balance.available, fetchBalance, addTransaction, initializeWithDemo]);

  const payForHealthScore = useCallback(async (projectId, baseUrl, projectName) => {
    return payForAgent("underwrite", { projectId, baseUrl, projectName });
  }, [payForAgent]);

  const payForScout = useCallback(async (baseUrl) => {
    return payForAgent("scout", { baseUrl });
  }, [payForAgent]);

  const payForVerification = useCallback(async (prId, lines, baseUrl) => {
    const cost = (lines / 10) * AGENT_PRICES.verify;
    return payForAgent("verify", { prId, lines, amount: cost, baseUrl });
  }, [payForAgent]);

  const payForRebalance = useCallback(async (baseUrl) => {
    return payForAgent("rebalance", { baseUrl });
  }, [payForAgent]);

  const value = {
    isInitialized,
    loading,
    error,
    balance,
    walletAddress,
    transactions,
    streamingPayment,
    agentPrices: AGENT_PRICES,
    initializeWithKey,
    initializeWithDemo,
    deposit,
    fetchBalance,
    payForAgent,
    payForHealthScore,
    payForScout,
    payForVerification,
    payForRebalance,
  };

  return (
    <NanopaymentContext.Provider value={value}>
      {children}
    </NanopaymentContext.Provider>
  );
};

export default NanopaymentContext;