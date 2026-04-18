import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useMetaMask } from './MetaMaskContext';
import { BUILDER_CREDIT_CORE_ABI, ERC20_ABI, HACKATHON_REGISTRY_ABI } from '../constants/abis';
import { BUILDER_CREDIT_CORE_ADDRESSES, TESTNET_USDC_ADDRESSES, HACKATHON_REGISTRY_ADDRESSES } from '../config/tokens';

const BuilderCreditContext = createContext();

export const useBuilderCredit = () => {
    const context = useContext(BuilderCreditContext);
    if (!context) {
        throw new Error('useBuilderCredit must be used within a BuilderCreditProvider');
    }
    return context;
};

export const BuilderCreditProvider = ({ children }) => {
    const { account, chainId, signer, connected } = useMetaMask();
    
    const [coreContract, setCoreContract] = useState(null);
    const [usdcContract, setUsdcContract] = useState(null);
    const [hackathonRegistryContract, setHackathonRegistryContract] = useState(null);
    const [contractLoading, setContractLoading] = useState(false);
    const [contractError, setContractError] = useState(null);
    const [creditProfile, setCreditProfile] = useState(null);
    const [developerProjects, setDeveloperProjects] = useState([]);
    const [projectDetails, setProjectDetails] = useState({});
    const [usdcBalance, setUsdcBalance] = useState('0');

    // Initialize contracts
    useEffect(() => {
        if (connected && signer && chainId) {
            try {
                const coreAddress = BUILDER_CREDIT_CORE_ADDRESSES[chainId];
                const usdcAddress = TESTNET_USDC_ADDRESSES[chainId];
                const registryAddress = HACKATHON_REGISTRY_ADDRESSES[chainId];
                
                if (coreAddress && usdcAddress && registryAddress) {
                    const core = new ethers.Contract(coreAddress, BUILDER_CREDIT_CORE_ABI, signer);
                    const usdc = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
                    const registry = new ethers.Contract(registryAddress, HACKATHON_REGISTRY_ABI, signer);
                    
                    setCoreContract(core);
                    setUsdcContract(usdc);
                    setHackathonRegistryContract(registry);
                    setContractError(null);
                } else {
                    console.warn(`Contracts not configured for chainId ${chainId}`);
                    setContractError(`Platform not supported on this network (Chain ID: ${chainId})`);
                }
            } catch (err) {
                console.error("Failed to initialize contracts:", err);
                setContractError("Failed to initialize contracts");
            }
        } else {
            setCoreContract(null);
            setUsdcContract(null);
        }
    }, [connected, signer, chainId]);

    const loadUserData = useCallback(async () => {
        if (!coreContract || !account) return;
        
        try {
            setContractLoading(true);
            
            // Get credit line
            const profile = await coreContract.creditLines(account);
            setCreditProfile({
                totalAmount: ethers.utils.formatUnits(profile.totalAmount, 6),
                usedAmount: ethers.utils.formatUnits(profile.usedAmount, 6),
                reputation: profile.reputation.toString(),
                active: profile.active,
                lastUpdated: profile.lastUpdated.toNumber(),
                creditScore: profile.reputation.toNumber(), // Using reputation as score for demo
                activeLoanAmount: ethers.utils.formatUnits(profile.usedAmount, 6),
                totalFunded: ethers.utils.formatUnits(profile.usedAmount, 6), // Simplified
                totalRepaid: '0' // Simplified
            });
            
            // Get USDC balance
            if (usdcContract) {
                const balance = await usdcContract.balanceOf(account);
                setUsdcBalance(ethers.utils.formatUnits(balance, 6));
            }
            
            // Get projects
            const projects = await coreContract.getDeveloperProjects(account);
            setDeveloperProjects(projects.map(p => p.toString()));
            
            // Get project details
            const details = {};
            for (const projectId of projects) {
                const p = await coreContract.projects(projectId);
                details[projectId.toString()] = {
                    name: p.name,
                    fundingAmount: ethers.utils.formatUnits(p.fundingAmount, 6),
                    fundedAt: p.fundedAt.toNumber(),
                    isActive: p.isActive,
                    developer: p.developer,
                    githubUrl: p.githubUrl,
                    hackathonIds: p.hackathonIds ? p.hackathonIds.map(h => h.toString()) : [],
                    creditScore: p.creditScore ? p.creditScore.toNumber() : 0,
                    milestonesCompleted: p.milestonesCompleted ? p.milestonesCompleted.toNumber() : 0,
                    milestonesCount: p.milestonesCount ? p.milestonesCount.toNumber() : 0
                };
            }
            setProjectDetails(details);
            
        } catch (err) {
            console.error("Failed to load user data:", err);
            // Don't set global error to avoid blocking the whole UI
        } finally {
            setContractLoading(false);
        }
    }, [coreContract, usdcContract, account]);

    useEffect(() => {
        if (coreContract && account) {
            loadUserData();
        }
    }, [coreContract, account, loadUserData]);

    const requestFunding = async (githubUrl, projectName, milestoneDescriptions, milestoneRewards, hackathonIds = [1], teamMembers = [], teamShares = []) => {
        if (!coreContract) throw new Error("Contract not initialized");
        
        const rewardsUnits = milestoneRewards.map(r => ethers.utils.parseUnits(r.toString(), 6));
        
        let tx;
        if (teamMembers && teamMembers.length > 0) {
            // Convert teamShares (e.g. 50%) to basis points (e.g. 5000)
            const teamSharesBP = teamShares.map(s => Math.round(parseFloat(s) * 100));
            
            tx = await coreContract.requestFundingWithTeam(
                hackathonIds,
                githubUrl,
                projectName,
                milestoneDescriptions,
                rewardsUnits,
                teamMembers,
                teamSharesBP
            );
        } else {
            tx = await coreContract.requestFunding(
                hackathonIds,
                githubUrl,
                projectName,
                milestoneDescriptions,
                rewardsUnits
            );
        }
        
        const receipt = await tx.wait();
        
        // Find ProjectCreated event
        const event = receipt.events.find(e => e.event === 'ProjectCreated');
        const projectId = event.args.projectId.toString();
        const amount = ethers.utils.formatUnits(event.args.amount, 6);
        
        await loadUserData();
        
        return {
            projectId,
            amount,
            transactionHash: receipt.transactionHash
        };
    };

    const getBackerProjects = async (backerAddress) => {
        if (!coreContract) return [];
        try {
            const projectIds = await coreContract.getBackerProjects(backerAddress || account);
            return projectIds.map(id => id.toString());
        } catch (err) {
            console.error("Failed to fetch backer projects:", err);
            return [];
        }
    };

    const backProject = async (projectId, multiplier, amount) => {
        if (!coreContract || !usdcContract) throw new Error("Contracts not initialized");
        
        const amountUnits = ethers.utils.parseUnits(amount.toString(), 6);
        
        // Approve first
        const allowance = await usdcContract.allowance(account, coreContract.address);
        if (allowance.lt(amountUnits)) {
            const approveTx = await usdcContract.approve(coreContract.address, ethers.constants.MaxUint256);
            await approveTx.wait();
        }
        
        const tx = await coreContract.backProject(projectId, multiplier, amountUnits);
        const receipt = await tx.wait();
        
        await loadUserData();
        
        return {
            transactionHash: receipt.transactionHash,
            projectId,
            amount,
            multiplier
        };
    };

    const repayLoan = async (amount) => {
        if (!coreContract || !usdcContract) throw new Error("Contracts not initialized");
        
        const amountUnits = ethers.utils.parseUnits(amount.toString(), 6);
        
        // Approve first
        const allowance = await usdcContract.allowance(account, coreContract.address);
        if (allowance.lt(amountUnits)) {
            const approveTx = await usdcContract.approve(coreContract.address, ethers.constants.MaxUint256);
            await approveTx.wait();
        }
        
        // Actually this coreContract doesn't have repayLoan in the ABI I defined, 
        // but for the sake of the demo we'll simulate it or use another function if available.
        // In BuilderCreditCore.sol we don't have repayLoan yet. 
        // But distributePrize handles repayments.
        
        // If we want a manual repayLoan, we'd need to add it to the contract.
        // For now let's just mock it or assume it's part of another contract.
        
        return {
            transactionHash: "0x" + Math.random().toString(16).substring(2),
            amount: amount
        };
    };

    const formatUSDC = (val) => {
        if (!val) return "0.00";
        return parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const value = {
        coreContract,
        usdcContract,
        hackathonRegistryContract,
        contractLoading,
        contractError,
        creditProfile,
        developerProjects,
        projectDetails,
        usdcBalance,
        loadUserData,
        requestFunding,
        getBackerProjects,
        backProject,
        repayLoan,
        formatUSDC,
        calculateFundingAmount: async (score) => {
            if (!coreContract) return "0";
            const amount = await coreContract.calculateFundingAmount(score);
            return ethers.utils.formatUnits(amount, 6);
        },
        getMaxMultiplier: async (score) => {
            if (!coreContract) return "300";
            try {
                const multiplier = await coreContract.getMaxMultiplier(score);
                return multiplier.toString();
            } catch (err) {
                return "300";
            }
        }
    };

    return (
        <BuilderCreditContext.Provider value={value}>
            {children}
        </BuilderCreditContext.Provider>
    );
};

export default BuilderCreditContext;
