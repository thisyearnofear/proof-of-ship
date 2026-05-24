/**
 * Credit Context
 *
 * Manages on-chain credit profiles, chain balance fetching, Firestore
 * project loading, and the backProject flow with USDC approval.
 *
 * Extracted from WalletContext.tsx for separation of concerns.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
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
  chainId: string | number | undefined;
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

  const [chainBalances, setChainBalances] = useState<Record<string, string>>({});
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [developerProjects, setDeveloperProjects] = useState<any[]>([]);
  const [projectDetails, setProjectDetails] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const usdcBalance = wallet.activeChainFamily === 'solana'
    ? (wallet.solanaBalance || '0.00')
    : (wallet.chainId ? (chainBalances[wallet.chainId.toString()] || '0.00') : '0.00');

  // Fetch all connected chain balances on mount/connect
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

  // Load user's projects from Firestore
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
          id: p.id,
          name: p.name,
          milestonesCompleted: 0,
          milestonesCount: 3,
          fundingAmount: 0,
          isActive: p.status === 'submitted' || p.status === 'approved'
        })));
      } catch (error) {
        console.error('Failed to load user projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };
    loadUserProjects();
  }, [currentUser?.uid, currentUser?.githubUsername, db, collection, query, where, getDocs, orderBy]);

  // Refresh balance when active chain changes
  useEffect(() => {
    const refreshBalance = async () => {
      if (!wallet.connected || !wallet.chainId) return;
      try {
        const balance = await wallet.getUSDCBalance();
        setChainBalances(prev => ({ ...prev, [wallet.chainId!.toString()]: balance }));
      } catch {}
    };
    refreshBalance();
  }, [wallet.chainId, wallet.connected, wallet.getUSDCBalance]);

  const getUSDCBalanceAsync = useCallback(async () => {
    if (wallet.activeChainFamily === 'solana') return wallet.solanaBalance || '0.00';
    try { return await wallet.getUSDCBalance(); } catch { return '0.00'; }
  }, [wallet]);

  const switchChain = useCallback(async (chainFamily: 'evm' | 'solana', chainId?: number) => {
    if (chainFamily === 'solana') { wallet.setActiveChainFamily('solana'); return; }
    wallet.setActiveChainFamily('evm');
    if (chainId) await wallet.switchNetwork(chainId);
  }, [wallet]);

  const value: CreditContextType = {
    creditProfile: wallet.creditProfile,
    repayLoan: wallet.repayLoan,
    loadCreditProfile: wallet.loadCreditProfile,
    postCheckIn: async (projectId: number, metadata: string) => {
      if (wallet.activeChainFamily === 'solana') throw new Error('Check-ins not yet implemented on Solana');
      const { creditService } = await import('@/services/creditService');
      if (!wallet.chainId || !wallet.signer) throw new Error('Wallet not connected');
      const numericChainId = typeof wallet.chainId === 'number' ? wallet.chainId : parseInt(wallet.chainId as string, 10);
      return creditService.postCheckIn(numericChainId, wallet.signer, projectId, metadata);
    },
    requestFunding: wallet.requestFunding,
    activeChainFamily: wallet.activeChainFamily,
    switchChain,
    developerProjects,
    projectDetails,
    loadingProjects,
    coreContract: null,
    hackathonRegistryContract: null,
    account: wallet.activeChainFamily === 'solana' ? wallet.solanaAddress : wallet.account,
    address: wallet.activeChainFamily === 'solana' ? wallet.solanaAddress : wallet.account,
    chainId: wallet.chainId ?? undefined,
    signer: wallet.signer,
    ethersProvider: wallet.ethersProvider,
    connected: wallet.activeChainFamily === 'solana' ? wallet.solanaConnected : wallet.connected,
    getBackerProjects: async (backerAddress: string): Promise<string[]> => {
      if (wallet.activeChainFamily === 'solana') return [];
      const { creditService } = await import('@/services/creditService');
      if (!wallet.chainId || !wallet.signer || typeof wallet.chainId !== 'number') return [];
      const contracts = creditService.getContracts(wallet.chainId, wallet.signer);
      if (!contracts) return [];
      try {
        const count = await contracts.core.getBackerProjectCount(backerAddress);
        const projectIds: string[] = [];
        const countNum = count?.toNumber ? count.toNumber() : 0;
        for (let i = 0; i < countNum; i++) {
          projectIds.push(await contracts.core.backerProjects(backerAddress, i));
        }
        return projectIds;
      } catch { return []; }
    },
    backProject: async (projectId: string, multiplier: number, amount: string | number): Promise<string> => {
      if (wallet.activeChainFamily === 'solana') {
        if (!wallet.solanaWallet) throw new Error('Solana wallet not connected');
        if (!wallet.solanaConnected || !wallet.solanaAddress || !wallet.solanaWallet.publicKey) throw new Error('Solana wallet not connected');
        const { solanaCreditService } = await import('@/services/SolanaCreditService');
        const connection = getSolanaConnection();
        const projectPda = new PublicKey(projectId);
        const result = await solanaCreditService.backProject(connection, wallet.solanaWallet, projectPda, amount, multiplier);
        return result.hash;
      }
      const { creditService } = await import('@/services/creditService');
      if (!projectId || typeof projectId !== 'string') throw new Error('Invalid project ID');
      if (typeof multiplier !== 'number' || multiplier < 100 || multiplier > 500) throw new Error('Invalid multiplier');
      const parsedAmount = parseFloat(amount.toString());
      if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error('Invalid amount');
      if (parsedAmount < 1) throw new Error('Minimum backing amount is 1 USDC');
      if (!wallet.chainId || !wallet.signer) throw new Error('Not connected');
      if (typeof wallet.chainId !== 'number') throw new Error('Invalid chain ID');
      const contracts = creditService.getContracts(wallet.chainId, wallet.signer);
      if (!contracts) throw new Error('Contracts not available');
      const amountInUnits = ethers.utils.parseUnits(parsedAmount.toString(), 6);
      const signerAddress = await wallet.signer.getAddress();
      const balance = await contracts.usdc.balanceOf(signerAddress);
      if (balance.lt(amountInUnits)) throw new Error(`Insufficient USDC balance. Need: ${parsedAmount}, Available: ${ethers.utils.formatUnits(balance, 6)}`);
      const currentAllowance = await contracts.usdc.allowance(signerAddress, contracts.core.address);
      if (currentAllowance.lt(amountInUnits)) {
        const approveTx = await contracts.usdc.approve(contracts.core.address, ethers.constants.MaxUint256);
        await approveTx.wait();
      }
      const tx = await contracts.core.backProject(projectId, multiplier, amountInUnits);
      await tx.wait();
      return tx.hash;
    },
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
