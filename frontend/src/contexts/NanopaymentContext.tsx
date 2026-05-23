/**
 * Nanopayment Context
 *
 * Manages AI agent nanopayments on Arc (x402 protocol).
 * Extracted from the monolithic WalletContext.tsx for separation of concerns.
 *
 * Consumers can use useNanopayment() directly instead of reaching into
 * the wallet context for payment-specific concerns.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { nanopaymentService } from '@/services/nanopaymentService';

import type { NanopaymentTransaction } from './wallet/types';
import { AGENT_PRICES } from './wallet/constants';

export type { NanopaymentTransaction } from './wallet/types';

// ── Types ──────────────────────────────────────────────────────────

export interface NanopaymentContextType {
  isInitialized: boolean;
  nanopaymentDemoMode: boolean;
  setNanopaymentDemoMode: (mode: boolean) => void;
  loading: boolean;
  error: string | null;
  balance: { available: string; locked: string };
  walletAddress: string | null;
  transactions: NanopaymentTransaction[];
  streamingPayment: { agentType: string; amount: number } | null;
  initialize: (pk: string) => Promise<void>;
  initializeWithDemo: () => void;
  deposit: (amountUSDC: number) => Promise<any>;
  pay: (endpoint: string, options?: any) => Promise<any>;
  payForAgent: (agentType: string, params?: any) => Promise<any>;
  payForVerification: (prId: string, lines: number, baseUrl?: string) => Promise<any>;
  payForScout: (baseUrl?: string) => Promise<any>;
  payForUnderwrite: (projectId: string, baseUrl?: string, projectName?: string) => Promise<any>;
  payForRebalance: (baseUrl?: string) => Promise<any>;
  agentPrices: { underwrite: number; scout: number; verify: number; rebalance: number; chat: number };
}

// ── Context ────────────────────────────────────────────────────────

const NanopaymentContext = createContext<NanopaymentContextType | undefined>(undefined);

export const useNanopayment = () => {
  const context = useContext(NanopaymentContext);
  if (!context) {
    throw new Error('useNanopayment must be used within a NanopaymentProvider');
  }
  return context;
};

// ── Provider ───────────────────────────────────────────────────────

export function NanopaymentProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [balance, setBalance] = useState({ available: '0', locked: '0' });
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<NanopaymentTransaction[]>([]);
  const [streamingPayment, setStreamingPayment] = useState<{ agentType: string; amount: number } | null>(null);

  const [nanopaymentDemoMode, setNanopaymentDemoMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nanopayment-demo-mode');
      return saved !== null
        ? saved === 'true'
        : (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NODE_ENV === 'development');
    }
    return process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NODE_ENV === 'development';
  });

  const addTransaction = useCallback((tx: NanopaymentTransaction) => {
    setTransactions(prev => [tx, ...prev].slice(0, 50));
  }, []);

  const setDemoMode = useCallback((mode: boolean) => {
    setNanopaymentDemoMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nanopayment-demo-mode', mode.toString());
    }
  }, []);

  const initialize = useCallback(async (pk: string) => {
    try {
      setLoading(true);
      const client = await nanopaymentService.initialize({
        chain: 'arcTestnet',
        privateKey: pk as `0x${string}`,
      });
      const address = client.account?.address;
      setWalletAddress(address ?? null);
      setIsInitialized(true);
      const bal = await nanopaymentService.getBalance();
      setBalance(bal);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeWithDemo = useCallback(() => {
    setIsInitialized(true);
    setWalletAddress('0xDEMO');
    setBalance({ available: '10.00', locked: '0.00' });
  }, []);

  const deposit = useCallback(async (amountUSDC: number) => {
    if (!isInitialized) throw new Error('Wallet not initialized');
    setLoading(true);
    try {
      const result = await nanopaymentService.deposit(amountUSDC);
      const bal = await nanopaymentService.getBalance();
      setBalance(bal);
      addTransaction({
        id: Date.now().toString(),
        type: 'deposit',
        agentName: 'Deposit',
        amount: amountUSDC,
        status: 'confirmed',
        timestamp: new Date().toISOString(),
        txHash: result.txHash,
      } as NanopaymentTransaction);
      return result;
    } finally {
      setLoading(false);
    }
  }, [isInitialized, addTransaction]);

  const payForAgent = useCallback(async (agentType: string, params: any = {}) => {
    const useDemoMode = nanopaymentDemoMode || !isInitialized;

    if (!isInitialized && useDemoMode) {
      initializeWithDemo();
    }

    const requiredAmount = typeof params.amount === 'number'
      ? params.amount
      : (AGENT_PRICES[agentType] || 0.05);

    setLoading(true);
    try {
      let endpoint: string;
      let displayName: string;

      switch (agentType) {
        case 'underwrite':
          endpoint = `/api/agent/underwrite?projectId=${params.projectId}`;
          displayName = 'AI Underwriter';
          break;
        case 'scout':
          endpoint = '/api/agent/scout';
          displayName = 'AI Scout';
          break;
        case 'verify':
          endpoint = `/api/agent/verify?prId=${params.prId}&lines=${params.lines}`;
          displayName = 'Verifier Agent';
          break;
        case 'rebalance':
          endpoint = '/api/agent/rebalance';
          displayName = 'AI Portfolio Manager';
          break;
        case 'chat':
          endpoint = '/api/agent/chat';
          displayName = 'AI Chat';
          break;
        default:
          throw new Error(`Unknown agent: ${agentType}`);
      }

      const baseUrl = params.baseUrl || '';
      const isChat = agentType === 'chat';
      let requestOptions: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: string; headers?: Record<string, string> } = {};
      if (isChat) {
        requestOptions = {
          method: 'POST',
          body: JSON.stringify({
            message: params.message,
            history: params.history || [],
            modelTier: 'premium',
          }),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      let result: any;

      if (useDemoMode) {
        const resp = await fetch(`${baseUrl}${endpoint}`, {
          ...(isChat ? { method: 'POST' } : {}),
          headers: {
            ...(isChat ? { 'Content-Type': 'application/json' } : {}),
            'x-demo-key': 'demo',
          },
          ...(isChat ? { body: requestOptions.body } : {}),
        });
        const data = await resp.json().catch(() => null);
        result = {
          success: resp.ok,
          status: resp.ok ? 'paid' : (resp.status === 402 ? 'payment_required' : 'failed'),
          data,
          error: resp.ok ? undefined : (data?.error || data?.message || 'Request failed'),
          txHash: data?.agentInfo?.txHash || `0xdemo${Date.now().toString(16)}`,
        };
      } else {
        if (!nanopaymentService.isInitialized()) {
          throw new Error('Live Arc payment wallet is not initialized');
        }
        result = await nanopaymentService.pay(`${baseUrl}${endpoint}`, isChat ? requestOptions : undefined);
      }

      const tx: NanopaymentTransaction = {
        id: Date.now().toString(),
        type: agentType,
        agentName: displayName,
        amount: requiredAmount,
        status: result.success ? 'confirmed' : (result.status || 'failed'),
        timestamp: new Date().toISOString(),
        txHash: result.txHash,
        projectName: params.projectName,
      };

      addTransaction(tx);

      if (result.success) {
        setBalance(prev => ({
          ...prev,
          available: (Math.max(0, parseFloat(prev.available) - requiredAmount)).toFixed(2),
        }));
      }

      return { ...result, demoMode: useDemoMode, transaction: tx };
    } finally {
      setLoading(false);
    }
  }, [nanopaymentDemoMode, isInitialized, initializeWithDemo, addTransaction]);

  const payForVerification = useCallback(async (prId: string, lines: number, baseUrl?: string) => {
    return payForAgent('verify', { prId, lines, amount: (lines / 10) * AGENT_PRICES.verify, baseUrl });
  }, [payForAgent]);

  const payForScout = useCallback(async (baseUrl?: string) => {
    return payForAgent('scout', { baseUrl });
  }, [payForAgent]);

  const payForUnderwrite = useCallback(async (projectId: string, baseUrl?: string, projectName?: string) => {
    return payForAgent('underwrite', { projectId, baseUrl, projectName });
  }, [payForAgent]);

  const payForRebalance = useCallback(async (baseUrl?: string) => {
    return payForAgent('rebalance', { baseUrl });
  }, [payForAgent]);

  const pay = useCallback(async (endpoint: string, options?: any) => {
    return payForAgent('chat', { endpoint, ...options });
  }, [payForAgent]);

  const value: NanopaymentContextType = {
    isInitialized,
    nanopaymentDemoMode,
    setNanopaymentDemoMode: setDemoMode,
    loading,
    error,
    balance,
    walletAddress,
    transactions,
    streamingPayment,
    initialize,
    initializeWithDemo,
    deposit,
    pay,
    payForAgent,
    payForVerification,
    payForScout,
    payForUnderwrite,
    payForRebalance,
    agentPrices: {
      underwrite: 0.05,
      scout: 0.01,
      verify: 0.001,
      rebalance: 0.01,
      chat: 0.005,
    },
  };

  return (
    <NanopaymentContext.Provider value={value}>
      {children}
    </NanopaymentContext.Provider>
  );
}

export default NanopaymentContext;
