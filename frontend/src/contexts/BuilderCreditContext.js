import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useMetaMask } from "./MetaMaskContext";
import { 
  BUILDER_CREDIT_CORE_ABI, 
  BUILDER_CREDIT_FACTORY_ABI, 
  BUILDER_CREDIT_SCORING_ABI,
  CONTRACT_ADDRESSES
} from "../constants/builderCreditAbi";
import { ERC20_ABI } from "../constants/abis";

// Create context
const BuilderCreditContext = createContext();

// Hook for using the BuilderCredit context
export const useBuilderCredit = () => {
  const context = useContext(BuilderCreditContext);
  if (!context) {
    throw new Error("useBuilderCredit must be used within a BuilderCreditProvider");
  }
  return context;
};

// Provider component
export const BuilderCreditProvider = ({ children }) => {
  // Connect to MetaMask
  const {
    provider,
    account,
    chainId,
    connected,
    ethersProvider,
    signer,
    getCurrentUSDCAddress,
    getUSDCBalance: getMetaMaskUSDCBalance,
    networkName
  } = useMetaMask();
  
  // Contract instances
  const [coreContract, setCoreContract] = useState(null);
  const [factoryContract, setFactoryContract] = useState(null);
  const [scoringContract, setScoringContract] = useState(null);
  const [usdcContract, setUsdcContract] = useState(null);
  
  // Contract states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creditProfile, setCreditProfile] = useState(null);
  const [developerProjects, setDeveloperProjects] = useState([]);
  const [projectDetails, setProjectDetails] = useState({});
  const [creditFactors, setCreditFactors] = useState([]);
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [contractAddresses, setContractAddresses] = useState(null);
  
  // Initialize contracts based on network
  useEffect(() => {
    if (!provider || !chainId) return;
    
    const initializeContracts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Determine network type
        let networkType = "testnet";
        if (chainId === 1 || chainId === 137 || chainId === 42161 || chainId === 10) {
          networkType = "mainnet";
        } else if (chainId === 1337 || chainId === 31337) {
          networkType = "localhost";
        }
        
        // Get contract addresses for this network
        const addresses = CONTRACT_ADDRESSES[networkType];
        setContractAddresses(addresses);
        
        // Check if contract addresses are available
        if (!addresses.core || !addresses.factory || !addresses.scoring) {
          console.warn(`BuilderCredit contracts not deployed on network ${chainId}`);
          return;
        }
        
        // Use ethersProvider and signer from MetaMask context
        if (!ethersProvider || !signer) {
          throw new Error("Ethereum provider not initialized");
        }
        
        // Core contract
        const core = new ethers.Contract(
          addresses.core,
          BUILDER_CREDIT_CORE_ABI,
          signer
        );
        setCoreContract(core);
        
        // Factory contract
        const factory = new ethers.Contract(
          addresses.factory,
          BUILDER_CREDIT_FACTORY_ABI,
          signer
        );
        setFactoryContract(factory);
        
        // Scoring contract
        const scoring = new ethers.Contract(
          addresses.scoring,
          BUILDER_CREDIT_SCORING_ABI,
          signer
        );
        setScoringContract(scoring);
        
        // Get USDC contract address - try both methods
        // First try getting from core contract (will work if it's properly initialized)
        try {
          const usdcAddress = await core.usdc();
          const usdc = new ethers.Contract(
            usdcAddress,
            ERC20_ABI,
            signer
          );
          setUsdcContract(usdc);
        } catch (err) {
          // Fallback to network-specific addresses
          const usdcAddress = getCurrentUSDCAddress();
          if (usdcAddress) {
            const usdc = new ethers.Contract(
              usdcAddress,
              ERC20_ABI,
              signer
            );
            setUsdcContract(usdc);
          } else {
            console.warn("USDC contract address not available for this network");
          }
        }
        
      } catch (err) {
        console.error("Failed to initialize contracts:", err);
        setError("Failed to initialize contracts: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    initializeContracts();
  }, [ethersProvider, signer, chainId, getCurrentUSDCAddress]);
  
  // Load user data when contracts and account are available
  useEffect(() => {
    if (!coreContract || !scoringContract || !account || !connected) return;
    
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Load credit profile
        const profile = await coreContract.creditProfiles(account);
        setCreditProfile({
          creditScore: profile.creditScore.toNumber(),
          totalFunded: ethers.utils.formatUnits(profile.totalFunded, 6),
          totalRepaid: ethers.utils.formatUnits(profile.totalRepaid, 6),
          activeLoanAmount: ethers.utils.formatUnits(profile.activeLoanAmount, 6),
          lastFundingTime: profile.lastFundingTime.toNumber(),
          reputation: profile.reputation.toNumber(),
          isActive: profile.isActive
        });
        
        // Load developer projects
        const projectIds = await coreContract.getDeveloperProjects(account);
        setDeveloperProjects(projectIds);
        
        // Load project details for each project
        const details = {};
        for (const projectId of projectIds) {
          const project = await coreContract.projects(projectId);
          details[projectId] = {
            developer: project.developer,
            githubUrl: project.githubUrl,
            name: project.name,
            fundingAmount: ethers.utils.formatUnits(project.fundingAmount, 6),
            fundedAt: project.fundedAt.toNumber(),
            isActive: project.isActive,
            milestones: []
          };
          
          // Load milestones
          // We'll use a safer approach with a maximum milestone count to prevent infinite loops
          const MAX_MILESTONES = 20; // Reasonable upper limit for milestone count
          
          for (let milestoneIndex = 0; milestoneIndex < MAX_MILESTONES; milestoneIndex++) {
            try {
              const milestone = await coreContract.getMilestoneDetails(projectId, milestoneIndex);
              
              // Check if we got a valid milestone (some contracts might return empty values instead of reverting)
              if (!milestone || !milestone.description) {
                break;
              }
              
              details[projectId].milestones.push({
                description: milestone.description,
                reward: ethers.utils.formatUnits(milestone.reward, 6),
                confirmations: milestone.confirmations.toNumber(),
                completed: milestone.completed,
                completedAt: milestone.completedAt.toNumber()
              });
            } catch (err) {
              // We've reached the end of milestones when we get an error
              // This is expected behavior
              break;
            }
          }
        }
        setProjectDetails(details);
        
        // Load credit factors from scoring contract
        const factorsData = await scoringContract.getAllCreditFactors();
        const factors = factorsData.ids.map((id, index) => ({
          id,
          name: factorsData.names[index],
          weight: factorsData.weights[index].toNumber(),
          isActive: factorsData.actives[index]
        }));
        setCreditFactors(factors);
        
        // Load USDC balance - try both methods
        try {
          // First try using MetaMask context's getUSDCBalance
          const balance = await getMetaMaskUSDCBalance();
          if (balance) {
            setUsdcBalance(balance);
          } else if (usdcContract) {
            // Fallback to direct contract call
            const balance = await usdcContract.balanceOf(account);
            setUsdcBalance(ethers.utils.formatUnits(balance, 6));
          }
        } catch (err) {
          console.error("Failed to load USDC balance:", err);
          // Don't throw error here, continue with other data loading
        }
        
      } catch (err) {
        console.error("Failed to load user data:", err);
        setError("Failed to load user data: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [coreContract, scoringContract, usdcContract, account, connected, getMetaMaskUSDCBalance]);
  
  // Calculate funding amount based on credit score
  const calculateFundingAmount = async (creditScore) => {
    if (!coreContract) return 0;
    
    try {
      const amount = await coreContract.calculateFundingAmount(creditScore);
      return parseFloat(ethers.utils.formatUnits(amount, 6));
    } catch (err) {
      console.error("Failed to calculate funding amount:", err);
      setError("Failed to calculate funding amount: " + err.message);
      return 0;
    }
  };
  
  // Request funding for a project
  const requestFunding = async (creditScore, githubUrl, projectName, milestoneDescriptions, milestoneRewards) => {
    if (!coreContract || !account) {
      throw new Error("Contract or account not available");
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Convert reward amounts to USDC units (6 decimals)
      const rewardAmounts = milestoneRewards.map(reward => 
        ethers.utils.parseUnits(reward.toString(), 6)
      );
      
      // Request funding
      const tx = await coreContract.requestFunding(
        creditScore,
        githubUrl,
        projectName,
        milestoneDescriptions,
        rewardAmounts
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Find FundingProvided event to get project ID
      const fundingEvent = receipt.events.find(e => e.event === "FundingProvided");
      const projectId = fundingEvent.args.projectId;
      
      // Reload user data
      await loadUserData();
      
      return {
        transactionHash: receipt.transactionHash,
        projectId,
        amount: parseFloat(ethers.utils.formatUnits(fundingEvent.args.amount, 6))
      };
      
    } catch (err) {
      console.error("Failed to request funding:", err);
      setError("Failed to request funding: " + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Repay loan
  const repayLoan = async (amount) => {
    if (!coreContract || !usdcContract || !account) {
      throw new Error("Contracts or account not available");
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Convert amount to USDC units
      const repayAmount = ethers.utils.parseUnits(amount.toString(), 6);
      
      // Approve USDC transfer
      const approveTx = await usdcContract.approve(coreContract.address, repayAmount);
      await approveTx.wait();
      
      // Repay loan
      const repayTx = await coreContract.repayLoan(repayAmount);
      const receipt = await repayTx.wait();
      
      // Reload user data
      await loadUserData();
      
      return {
        transactionHash: receipt.transactionHash,
        amount
      };
      
    } catch (err) {
      console.error("Failed to repay loan:", err);
      setError("Failed to repay loan: " + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Link GitHub account
  const linkGithubAccount = async (githubUsername, signature, timestamp) => {
    if (!scoringContract || !account) {
      throw new Error("Contract or account not available");
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Link GitHub account
      const tx = await scoringContract.linkGithubAccount(
        account,
        githubUsername,
        signature,
        timestamp
      );
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.transactionHash,
        githubUsername
      };
      
    } catch (err) {
      console.error("Failed to link GitHub account:", err);
      setError("Failed to link GitHub account: " + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Get credit score
  const getCreditScore = async (address) => {
    if (!scoringContract) {
      throw new Error("Scoring contract not available");
    }
    
    try {
      const result = await scoringContract.getCreditScore(address || account);
      return {
        score: result.creditScore.toNumber(),
        isVerified: result.isVerified
      };
    } catch (err) {
      console.error("Failed to get credit score:", err);
      setError("Failed to get credit score: " + err.message);
      throw err;
    }
  };
  
  // Helper function to load user data
  const loadUserData = async () => {
    if (!coreContract || !scoringContract || !account) return;
    
    try {
      setLoading(true);
      
      // Load credit profile
      const profile = await coreContract.creditProfiles(account);
      setCreditProfile({
        creditScore: profile.creditScore.toNumber(),
        totalFunded: ethers.utils.formatUnits(profile.totalFunded, 6),
        totalRepaid: ethers.utils.formatUnits(profile.totalRepaid, 6),
        activeLoanAmount: ethers.utils.formatUnits(profile.activeLoanAmount, 6),
        lastFundingTime: profile.lastFundingTime.toNumber(),
        reputation: profile.reputation.toNumber(),
        isActive: profile.isActive
      });
      
      // Load developer projects
      const projectIds = await coreContract.getDeveloperProjects(account);
      setDeveloperProjects(projectIds);
      
      // Load USDC balance - try both methods
      try {
        // First try using MetaMask context's getUSDCBalance
        const balance = await getMetaMaskUSDCBalance();
        if (balance) {
          setUsdcBalance(balance);
        } else if (usdcContract) {
          // Fallback to direct contract call
          const balance = await usdcContract.balanceOf(account);
          setUsdcBalance(ethers.utils.formatUnits(balance, 6));
        }
      } catch (err) {
        console.error("Failed to reload USDC balance:", err);
      }
      
    } catch (err) {
      console.error("Failed to reload user data:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Context value
  const value = {
    // Contract instances
    coreContract,
    factoryContract,
    scoringContract,
    usdcContract,
    
    // State
    loading,
    error,
    creditProfile,
    developerProjects,
    projectDetails,
    creditFactors,
    usdcBalance,
    contractAddresses,
    networkName,
    
    // Actions
    calculateFundingAmount,
    requestFunding,
    repayLoan,
    linkGithubAccount,
    getCreditScore,
    loadUserData,
    
    // Utilities
    formatUSDC: (value) => parseFloat(value).toFixed(2)
  };
  
  return (
    <BuilderCreditContext.Provider value={value}>
      {children}
    </BuilderCreditContext.Provider>
  );
};

export default BuilderCreditContext;