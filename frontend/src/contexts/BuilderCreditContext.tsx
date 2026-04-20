import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useMetaMask } from './MetaMaskContext';
import { creditService } from '../services/creditService';

interface CreditProfile {
    usedAmount: string;
    reputation: number;
}

interface BuilderCreditContextType {
    creditProfile: CreditProfile | null;
    repayLoan: (amount: string | number) => Promise<void>;
    loadUserData: () => Promise<void>;
    loading: boolean;
}

const BuilderCreditContext = createContext<BuilderCreditContextType>({
    creditProfile: null,
    repayLoan: async () => {},
    loadUserData: async () => {},
    loading: false
});

export const useBuilderCredit = () => useContext(BuilderCreditContext);

export const BuilderCreditProvider = ({ children }: { children: ReactNode }) => {
    const { account, chainId, signer, connected } = useMetaMask();
    const [contracts, setContracts] = useState<any>(null);
    const [creditProfile, setCreditProfile] = useState<CreditProfile | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (connected && signer && chainId) {
            try {
                setContracts(creditService.getContracts(chainId, signer));
            } catch (err) {
                console.warn(err);
            }
        } else {
            setContracts(null);
        }
    }, [connected, signer, chainId]);

    const loadUserData = useCallback(async () => {
        if (!contracts?.core || !account) return;
        setLoading(true);
        try {
            const profile = await contracts.core.creditLines(account);
            setCreditProfile({
                usedAmount: ethers.utils.formatUnits(profile.usedAmount, 6),
                reputation: profile.reputation.toNumber()
            });
        } catch (err) {
            console.error("Failed to load user data:", err);
        } finally {
            setLoading(false);
        }
    }, [contracts, account]);

    const repayLoan = async (amount: string | number) => {
        if (!chainId || !signer) throw new Error("Not connected");
        await creditService.repayLoan(chainId, signer, amount);
        await loadUserData();
    };

    return (
        <BuilderCreditContext.Provider value={{ creditProfile, repayLoan, loadUserData, loading }}>
            {children}
        </BuilderCreditContext.Provider>
    );
};

export default BuilderCreditContext;
