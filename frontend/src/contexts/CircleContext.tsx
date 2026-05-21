/**
 * Circle Context
 *
 * Manages Circle Modular Wallets for USDC transfers.
 * Extracted from the monolithic WalletContext.tsx for separation of concerns.
 *
 * Consumers can use useCircleWallet() directly.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { walletService } from '../services/walletService';

// ── Types ──────────────────────────────────────────────────────────

export interface CircleWalletContextType {
  circleWallets: any[];
  circleConfig: any;
  loading: boolean;
  error: string | null;
  createWallet: (config?: any) => Promise<any>;
  refreshWallets: () => Promise<void>;
  transferUSDC: (amount: number, destinationAddress: string, walletId: string, reason?: string) => Promise<any>;
  isConfigured: () => boolean;
  getEnvironment: () => string;
}

// ── Context ────────────────────────────────────────────────────────

const CircleContext = createContext<CircleWalletContextType | undefined>(undefined);

export const useCircleWallet = () => {
  const context = useContext(CircleContext);
  if (!context) {
    throw new Error('useCircleWallet must be used within a CircleProvider');
  }
  return context;
};

// ── Provider ───────────────────────────────────────────────────────

export function CircleProvider({ children }: { children: ReactNode }) {
  const [circleWallets, setCircleWallets] = useState<any[]>([]);
  const [circleConfig, setCircleConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshWallets = useCallback(async () => {
    try {
      const result = await walletService.getWallets();
      if (result.success) {
        setCircleWallets(result.data.wallets || []);
      }
    } catch (err: any) {
      console.warn('Failed to fetch Circle wallets:', err?.message || err);
    }
  }, []);

  const initializeCircleService = useCallback(async () => {
    try {
      const config = await walletService.getConfig();
      if (config.success) {
        setCircleConfig(config.data);
        await refreshWallets();
      }
    } catch (err: unknown) {
      console.warn('Circle initialization skipped:', err instanceof Error ? err.message : err);
    }
  }, [refreshWallets]);

  useEffect(() => {
    initializeCircleService();
  }, [initializeCircleService]);

  const createWallet = useCallback(async (config: any = {}) => {
    if (!circleConfig) throw new Error('Circle not initialized');
    setLoading(true);
    try {
      const walletParams = {
        idempotencyKey: `wallet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        metadata: {
          name: config.name || 'Developer Wallet',
          userId: config.userId || 'anonymous',
          ...config.metadata
        }
      };
      const result = await walletService.createWallet(walletParams);
      if (result.success) {
        await refreshWallets();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create wallet');
      }
    } finally {
      setLoading(false);
    }
  }, [circleConfig, refreshWallets]);

  const transferUSDC = useCallback(async (amount: number, destinationAddress: string, walletId: string, reason?: string) => {
    setLoading(true);
    try {
      const transferRequest = {
        idempotencyKey: `transfer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        walletId,
        amount: amount.toString(),
        destinationAddress,
        metadata: { reason: reason || 'Transfer' }
      };
      const result = await walletService.transferUSDC(transferRequest);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Transfer failed');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const value: CircleWalletContextType = {
    circleWallets,
    circleConfig,
    loading,
    error,
    createWallet,
    refreshWallets,
    transferUSDC,
    isConfigured: () => !!circleConfig,
    getEnvironment: () => circleConfig?.environment || 'sandbox',
  };

  return (
    <CircleContext.Provider value={value}>
      {children}
    </CircleContext.Provider>
  );
}

export default CircleContext;
