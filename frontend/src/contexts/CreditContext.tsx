/**
 * Credit Context
 *
 * Manages on-chain credit profiles, chain balance fetching, Firestore
 * project loading, and the backProject flow with USDC approval.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PublicKey } from '@solana/web3.js';
import { formatUnits, parseUnits, maxUint256, parseAbi } from 'viem';
import { useWallet } from './WalletContext';
import { useUser } from './UserContext';
import { getSolanaConnection } from './wallet/constants';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface CreditContextType {
  creditProfile: any;
  repayLoan: (amount: string | number, projectPda?: PublicKey) => Promise<any>;
  loadCreditProfile: () => Promise<void>;
  postCheckIn: (projectId: number, metadata: string) => Promise<any>;
  requestFunding: (projectData: any) => Promise<any>;
  activeChainFamily: 'evm' | 'solana';
  switchChain: (chainFamily: 'evm' | 'solana', chainId?: number) => Promise<void>;
  developerProjects: any[];
  projectDetails: any[];
  loadingProjects: boolean;
  coreContract: null;
  hackathonRegistryContract: null;
  account: string | null | undefined;
  address: string | null | undefined;
  chainId: number | undefined;
  signer: any;
  ethersProvider: any;
  connected: boolean;
  getBackerProjects: (backerAddress: string) => Promise<string[]>;
  backProject: (projectId: string, multiplier: number, amount: string | number) => Promise<string>;
  contractLoading: boolean;
  usdcBalance: string;
  chainBalances: Record<string, string>;
  isFetchingBalances: boolean;
  getUSDCBalanceAsync: () => Promise<string>;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const useBuilderCredit = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useBuilderCredit must be used within a CreditProvider');
  }
  return context;
};

export function CreditProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const { currentUser } = useUser();

  const [creditProfile, setCreditProfile] = useState<any>(null);
  const [chainBalances, setChainBalances] = useState<Record<string, string>>({});
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [developerProjects, setDeveloperProjects] = useState<any[]>([]);
  const [projectDetails, setProjectDetails] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const usdcBalance = wallet.activeChainFamily === 'solana'
    ? (wallet.solanaBalance || '0.00')
    : (wallet.chainId ? (chainBalances[wallet.chainId.toString()] || '0.00') : '0.00');

  useEffect(() => {
    const fetchAllBalances = async () => {
      if (!wallet.connected && !wallet.solanaConnected) {
        setChainBalances({});
        return;
      }
      setIsFetchingBalances(true);
      const newBalances: Record<string, string> = {};
      if (wallet.solanaConnected) {
        newBalances['solana'] = wallet.solanaBalance || '0.00';
      }
      if (wallet.connected && wallet.account) {
        try {
          const currentBalance = await wallet.getUSDCBalance();
          if (wallet.chainId) {
            newBalances[wallet.chainId.toString()] = currentBalance;
          }
        } catch {}
      }
      setChainBalances(newBalances);
      setIsFetchingBalances(false);
    };
    fetchAllBalances();
  }, [wallet.connected, wallet.solanaConnected, wallet.account, wallet.chainId]);

  useEffect(() => {
    const loadUserProjects = async () => {
      if (!currentUser?.uid && !currentUser?.githubUsername) return;
      setLoadingProjects(true);
      try {
        const projectsRef = collection(db, 'projects');
        let q;
        if (currentUser.githubUsername) {
          q = query(projectsRef, where('submittedBy', '==', currentUser.githubUsername), orderBy('createdAt', 'desc'));
        } else if (currentUser.uid) {
          q = query(projectsRef, where('owners', 'array-contains', currentUser.uid), orderBy('createdAt', 'desc'));
        }
        if (!q) { setLoadingProjects(false); return; }
        const snapshot = await getDocs(q);
        const projects = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        setDeveloperProjects(projects);
        setProjectDetails(projects.map((p: any) => ({
          id: p.id, name: p.name, milestonesCompleted: 0, milestonesCount: 3,
          fundingAmount: 0, isActive: p.status === 'submitted' || p.status === 'approved'
        })));
      } catch (error) {
        console.error('Failed to load user projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };
    loadUserProjects();
  }, [currentUser?.uid, currentUser?.githubUsername]);

  const loadCreditProfile = useCallback(async () => {
    if (wallet.activeChainFamily === 'solana') {
      if (!wallet.solanaWallet?.publicKey) return;
      try {
        const { solanaCreditService } = await import('@/services/SolanaCreditService');
        const connection = getSolanaConnection();
        const creditLine = await solanaCreditService.getDeveloperCreditLine(connection, wallet.solanaWallet.publicKey);
        if (creditLine) {
          const usedAmount = creditLine.usedAmount?.toString?.() ?? '0';
          const totalAmount = creditLine.totalAmount?.toString?.() ?? '0';
          const reputation = Number(creditLine.reputation || 0);
          const baseAmount = Math.min(5000, 500 + (Math.max(0, reputation - 400) * 11.25));
          const marketBoost = Math.max(0, parseFloat(totalAmount) - baseAmount);
          setCreditProfile({ usedAmount, totalAmount, baseAmount: baseAmount.toFixed(0), marketBoost: marketBoost.toFixed(0), reputation });
        }
      } catch (err) {
        console.warn('Failed to load Solana credit profile:', err);
      }
      return;
    }
    if (!wallet.publicClient || !wallet.account || !wallet.chainId) return;
    try {
      const { creditService } = await import('@/services/creditService');
      const contracts = creditService.getContracts(wallet.chainId, wallet.publicClient);
      if (!contracts) return;
      const profile = await contracts.core.read.creditLines([wallet.account] as any) as any;
      const usedAmount = formatUnits(profile.usedAmount || 0n, 6);
      const totalAmount = formatUnits(profile.totalAmount || 0n, 6);
      const reputation = Number(profile.reputation || 0);
      const baseAmount = creditService.calculateBaseFunding(reputation);
      const marketBoost = Math.max(0, parseFloat(totalAmount) - baseAmount);
      setCreditProfile({ usedAmount, totalAmount, baseAmount: baseAmount.toString(), marketBoost: marketBoost.toString(), reputation });
    } catch (err) {
      console.warn('Failed to load credit profile:', err);
    }
  }, [wallet.publicClient, wallet.account, wallet.chainId, wallet.activeChainFamily, wallet.solanaWallet]);

  const repayLoan = async (amount: string | number, projectPda?: PublicKey) => {
    if (wallet.activeChainFamily === 'solana') {
      if (!wallet.solanaWallet?.publicKey) throw new Error('Solana wallet not connected');
      if (!projectPda) throw new Error('Project PDA required for Solana repayment');
      const { solanaCreditService } = await import('@/services/SolanaCreditService');
      const connection = getSolanaConnection();
      const result = await solanaCreditService.repayLoan(connection, wallet.solanaWallet, amount, projectPda);
      await loadCreditProfile();
      return result;
    }
    if (!wallet.publicClient || !wallet.walletClient || !wallet.chainId) throw new Error('Not connected');
    const { creditService } = await import('@/services/creditService');
    await creditService.repayLoan(wallet.chainId, wallet.publicClient, wallet.walletClient, amount);
    await loadCreditProfile();
  };

  const requestFunding = useCallback(async (projectData: any) => {
    if (wallet.activeChainFamily === 'solana') {
      if (!wallet.solanaWallet?.publicKey) throw new Error('Solana wallet not connected');
      const { solanaCreditService } = await import('@/services/SolanaCreditService');
      const connection = getSolanaConnection();
      return await solanaCreditService.requestFunding(connection, wallet.solanaWallet, projectData);
    }
    if (!wallet.publicClient || !wallet.walletClient || !wallet.chainId) throw new Error('EVM wallet not connected');
    const { creditService } = await import('@/services/creditService');
    return await creditService.requestFunding(wallet.chainId, wallet.publicClient, wallet.walletClient, projectData);
  }, [wallet.activeChainFamily, wallet.publicClient, wallet.walletClient, wallet.chainId, wallet.solanaWallet]);

  const switchChain = useCallback(async (chainFamily: 'evm' | 'solana', chainId?: number) => {
    if (chainFamily === 'solana') { wallet.setActiveChainFamily('solana'); return; }
    wallet.setActiveChainFamily('evm');
    if (chainId) await wallet.switchNetwork(chainId);
  }, [wallet]);

  const getUSDCBalanceAsync = useCallback(async () => {
    if (wallet.activeChainFamily === 'solana') return wallet.solanaBalance || '0.00';
    try { return await wallet.getUSDCBalance(); } catch { return '0.00'; }
  }, [wallet]);

  const backProject = async (projectId: string, multiplier: number, amount: string | number): Promise<string> => {
    if (wallet.activeChainFamily === 'solana') {
      if (!wallet.solanaWallet?.publicKey) throw new Error('Solana wallet not connected');
      const { solanaCreditService } = await import('@/services/SolanaCreditService');
      const connection = getSolanaConnection();
      const projectPda = new PublicKey(projectId);
      const result = await solanaCreditService.backProject(connection, wallet.solanaWallet, projectPda, amount, multiplier);
      return result.hash;
    }
    if (!wallet.publicClient || !wallet.walletClient || !wallet.chainId) throw new Error('Not connected');
    const { creditService } = await import('@/services/creditService');
    const contracts = creditService.getContracts(wallet.chainId, wallet.publicClient, wallet.walletClient);
    if (!contracts) throw new Error('Contracts not available');
    const parsedAmount = parseFloat(amount.toString());
    if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error('Invalid amount');
    if (parsedAmount < 1) throw new Error('Minimum backing amount is 1 USDC');
    const amountInUnits = parseUnits(parsedAmount.toString(), 6);
    const account = wallet.walletClient.account!.address;
    const balance = await contracts.usdc.read.balanceOf([account]) as bigint;
    if (balance < amountInUnits) throw new Error(`Insufficient USDC balance. Need: ${parsedAmount}, Available: ${formatUnits(balance, 6)}`);
    const currentAllowance = await contracts.usdc.read.allowance([account, contracts.coreAddress]) as bigint;
    if (currentAllowance < amountInUnits) {
      const approveTx = await contracts.usdc.write.approve([contracts.coreAddress, maxUint256] as any);
      await wallet.publicClient.waitForTransactionReceipt({ hash: approveTx });
    }
    const tx = await contracts.core.write.backProject([projectId, multiplier, amountInUnits] as any);
    await wallet.publicClient.waitForTransactionReceipt({ hash: tx });
    return tx;
  };

  const value: CreditContextType = {
    creditProfile,
    repayLoan,
    loadCreditProfile,
    postCheckIn: async (projectId: number, metadata: string) => {
      if (wallet.activeChainFamily === 'solana') throw new Error('Check-ins not yet implemented on Solana');
      if (!wallet.publicClient || !wallet.walletClient || !wallet.chainId) throw new Error('Wallet not connected');
      const { creditService } = await import('@/services/creditService');
      return creditService.postCheckIn(wallet.chainId, wallet.publicClient, wallet.walletClient, projectId, metadata);
    },
    requestFunding,
    activeChainFamily: wallet.activeChainFamily,
    switchChain,
    developerProjects,
    projectDetails,
    loadingProjects,
    coreContract: null,
    hackathonRegistryContract: null,
    account: wallet.activeChainFamily === 'solana' ? wallet.solanaAddress : wallet.account,
    address: wallet.activeChainFamily === 'solana' ? wallet.solanaAddress : wallet.account,
    chainId: wallet.chainId,
    // Legacy fields — consumers should migrate to publicClient/walletClient
    signer: wallet.walletClient,
    ethersProvider: wallet.publicClient,
    connected: wallet.activeChainFamily === 'solana' ? wallet.solanaConnected : wallet.connected,
    getBackerProjects: async (backerAddress: string): Promise<string[]> => {
      if (wallet.activeChainFamily === 'solana') return [];
      if (!wallet.publicClient || !wallet.chainId) return [];
      const { creditService } = await import('@/services/creditService');
      const contracts = creditService.getContracts(wallet.chainId, wallet.publicClient);
      if (!contracts) return [];
      try {
        const count = await contracts.core.read.getBackerProjectCount([backerAddress] as any) as bigint;
        const projectIds: string[] = [];
        for (let i = 0; i < Number(count); i++) {
          const id = await contracts.core.read.backerProjects([backerAddress, i] as any);
          projectIds.push(id as string);
        }
        return projectIds;
      } catch { return []; }
    },
    backProject,
    contractLoading: wallet.loading,
    usdcBalance,
    chainBalances,
    isFetchingBalances,
    getUSDCBalanceAsync,
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
}

export default CreditContext;
