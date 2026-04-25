/**
 * @deprecated BuilderCreditContext.tsx - Functionality merged into WalletContext.tsx
 * 
 * Use: import { useWallet } from '@/contexts/WalletContext';
 * 
 * Re-exports credit-related functionality from WalletContext.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { creditService } from '@/services/creditService';

// Re-export CreditProfile interface for compatibility
export interface CreditProfile {
  usedAmount: string;
  reputation: number;
}

interface BuilderCreditContextType {
  creditProfile: CreditProfile | null;
  repayLoan: (amount: string | number) => Promise<void>;
  loadUserData: () => Promise<void>;
  loading: boolean;
  // Contract access (for backward compatibility)
  coreContract: any;
  usdcContract: any;
  usdcBalance: string;
  developerProjects: any[];
  projectDetails: (slug: string) => Promise<any>;
}

const BuilderCreditContext = createContext<BuilderCreditContextType>({
  creditProfile: null,
  repayLoan: async () => {},
  loadUserData: async () => {},
  loading: false,
  coreContract: null,
  usdcContract: null,
  usdcBalance: '0',
  developerProjects: [],
  projectDetails: async () => null,
});

export const useBuilderCredit = () => useContext(BuilderCreditContext);

export const BuilderCreditProvider = ({ children }: { children: ReactNode }) => {
  const { account, chainId, signer, connected, ethersProvider, creditProfile, getUSDCBalance } = useWallet();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any>(null);
  const [developerProjects, setDeveloperProjects] = useState<any[]>([]);
  const [usdcBalance, setUsdcBalance] = useState<string>('0');

  // Initialize contracts when wallet connects
  useEffect(() => {
    if (connected && signer && chainId) {
      try {
        const c = creditService.getContracts(chainId, signer);
        setContracts(c);
      } catch (err) {
        console.warn('Failed to initialize credit contracts:', err);
      }
    } else {
      setContracts(null);
    }
  }, [connected, signer, chainId]);

  // Load USDC balance
  useEffect(() => {
    if (connected && account) {
      getUSDCBalance().then(setUsdcBalance).catch(() => setUsdcBalance('0'));
    }
  }, [connected, account, getUSDCBalance]);

  const loadUserData = useCallback(async () => {
    if (!contracts?.core || !account) return;
    setLoading(true);
    try {
      await contracts.core.creditLines(account);
    } catch (err) {
      console.error('Failed to load user data:', err);
    } finally {
      setLoading(false);
    }
  }, [contracts, account]);

  const repayLoan = async (amount: string | number) => {
    if (!chainId || !signer) throw new Error('Not connected');
    await creditService.repayLoan(chainId, signer, amount);
    await loadUserData();
  };

  const projectDetails = async (slug: string) => {
    // TODO: Implement project details fetching
    return null;
  };

  const value: BuilderCreditContextType = {
    creditProfile,
    repayLoan,
    loadUserData,
    loading,
    coreContract: contracts?.core || null,
    usdcContract: contracts?.usdc || null,
    usdcBalance,
    developerProjects,
    projectDetails,
  };

  return (
    <BuilderCreditContext.Provider value={value}>
      {children}
    </BuilderCreditContext.Provider>
  );
};

export default BuilderCreditContext;