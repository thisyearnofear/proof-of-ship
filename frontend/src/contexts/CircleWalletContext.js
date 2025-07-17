/**
 * Circle Wallet Context
 * Frontend integration with Circle's Modular Wallets SDK
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Circle, CircleEnvironments } from '@circle-fin/circle-sdk';

const CircleWalletContext = createContext();
const useBuilderCreditInternal = () => {
  try {
    // Dynamically import to avoid circular dependencies
    const { useBuilderCredit } = require('./BuilderCreditContext');
    return useBuilderCredit();
  } catch (err) {
    console.warn("BuilderCredit context not available yet", err);
    return null;
  }
};

export const useCircleWallet = () => {
  const context = useContext(CircleWalletContext);
  if (!context) {
    throw new Error('useCircleWallet must be used within a CircleWalletProvider');
  }
  return context;
};

export const CircleWalletProvider = ({ children }) => {
  const [sdk, setSdk] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [walletConfig, setWalletConfig] = useState(null);

  // Initialize Circle Wallet SDK
  useEffect(() => {
    initializeSDK();
  }, []);

  const initializeSDK = async () => {
    try {
      setLoading(true);
      
      // Get wallet configuration from the API
      const configResponse = await fetch('/api/circle/config');
      const config = await configResponse.json();
      
      if (!config.success) {
        throw new Error(config.error || 'Failed to load wallet configuration');
      }

      setWalletConfig(config.data);
      
      // Check API status
      const statusResponse = await fetch('/api/circle/status');
      const status = await statusResponse.json();
      
      if (!status.success) {
        console.warn('Circle API status check failed:', status.error);
        setError(status.error || 'Circle API connection failed');
        return;
      }
      
      // Set the Circle environment from the status response
      const environment = status.data.environment || 'sandbox';
      
      // We don't need to initialize the actual SDK on the client side anymore
      // as all operations will go through our API endpoints
      setIsInitialized(true);
      
      // Load existing wallets
      try {
        await getWallets();
      } catch (err) {
        console.warn('Failed to load existing wallets:', err);
        // Don't block initialization for this error
      }
      

    } catch (err) {
      console.error('Failed to initialize Circle Wallet SDK:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async (config = {}) => {
    if (!isInitialized) {
      throw new Error('Circle Wallet context not initialized');
    }

    setLoading(true);
    try {
      // Create wallet configuration
      const walletParams = {
        idempotencyKey: `wallet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        entitySecretCiphertext: walletConfig?.entitySecretCiphertext,
        walletSetId: walletConfig?.walletSetId,
        blockchains: ['ETH', 'MATIC', 'AVAX', 'ARB'],
        count: 1,
        metadata: {
          name: config.name || 'Developer Wallet',
          description: config.description || 'Wallet for developer funding',
          ...config.metadata
        }
      };

      // Call our API endpoint to create wallet
      const response = await fetch('/api/circle/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(walletParams)
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create wallet');
      }
      
      if (!result.data || !result.data.wallets || result.data.wallets.length === 0) {
        throw new Error('Failed to create wallet: No wallet returned from API');
      }

      const newWallet = result.data.wallets[0];
      setWallets(prev => [...prev, newWallet]);
      return newWallet;
    } catch (err) {
      console.error('Failed to create wallet:', err);
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getWallets = async () => {
    if (!isInitialized) {
      throw new Error('Circle Wallet context not initialized');
    }

    setLoading(true);
    try {
      // Use our API endpoint
      const queryParams = walletConfig?.walletSetId
        ? `?walletSetId=${encodeURIComponent(walletConfig.walletSetId)}`
        : '';
      
      const response = await fetch(`/api/circle/wallets${queryParams}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to get wallets');
      }
      
      if (!result.data || !result.data.wallets) {
        throw new Error('Failed to get wallets: Invalid response from API');
      }

      const userWallets = result.data.wallets;
      setWallets(userWallets);
      return userWallets;
    } catch (err) {
      console.error('Failed to get wallets:', err);
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getWalletById = async (walletId) => {
    if (!isInitialized) {
      throw new Error('Circle Wallet context not initialized');
    }

    try {
      const response = await fetch(`/api/circle/wallets/${walletId}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to get wallet');
      }
      
      if (!result.data || !result.data.wallet) {
        throw new Error('Failed to get wallet: Invalid response from API');
      }

      return result.data.wallet;
    } catch (err) {
      console.error(`Failed to get wallet ${walletId}:`, err);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  const signTransaction = async (walletId, transaction) => {
    if (!isInitialized) {
      throw new Error('Circle Wallet context not initialized');
    }

    try {
      // Prepare transaction for signing
      const signRequest = {
        idempotencyKey: `sign-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        walletId: walletId,
        blockchain: transaction.blockchain || 'ETH', // Default to Ethereum
        tokenId: transaction.tokenId,
        amount: transaction.amount,
        destinationAddress: transaction.destination,
        feeLevel: transaction.feeLevel || 'HIGH'
      };

      // Submit signing request to our API
      const response = await fetch('/api/circle/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(signRequest)
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to sign transaction');
      }
      
      if (!result.data) {
        throw new Error('Failed to sign transaction: Invalid response from API');
      }

      return result.data;
    } catch (err) {
      console.error('Failed to sign transaction:', err);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  const requestFunding = async (walletId, creditScore, githubUrl, projectName, milestoneDescriptions, milestoneRewards) => {
    try {
      setLoading(true);
      
      // Get BuilderCredit context safely
      const builderCredit = useBuilderCreditInternal();
      
      if (!builderCredit || !builderCredit.coreContract) {
        throw new Error('BuilderCredit contract not initialized');
      }
      
      // Request funding through smart contract
      const result = await builderCredit.requestFunding(
        creditScore,
        githubUrl,
        projectName,
        milestoneDescriptions,
        milestoneRewards
      );
      
      // Record the funding in Circle's system
      if (walletId && sdk) {
        try {
          // Create note in wallet metadata
          await sdk.wallets.updateWalletMetadata({
            walletId: walletId,
            metadata: {
              fundingHistory: [
                {
                  projectId: result.projectId,
                  amount: result.amount,
                  transactionHash: result.transactionHash,
                  timestamp: Date.now()
                }
              ]
            }
          });
        } catch (metadataErr) {
          console.warn('Failed to update wallet metadata with funding info:', metadataErr);
          // Continue despite metadata update failure
        }
      }
      
      return {
        success: true,
        projectId: result.projectId,
        amount: result.amount,
        transactionHash: result.transactionHash
      };
    } catch (err) {
      console.error('Funding request failed:', err);
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getFundingHistory = async (walletAddress) => {
    try {
      // Get BuilderCredit context safely
      const builderCredit = useBuilderCreditInternal();
      
      if (!builderCredit || !builderCredit.coreContract) {
        throw new Error('BuilderCredit contract not initialized');
      }
      
      // Get the address to check - either the provided one or the one associated with the wallet
      const addressToCheck = walletAddress || (wallets.length > 0 ? wallets[0].address : null);
      
      if (!addressToCheck) {
        throw new Error('No wallet address available');
      }
      
      // Get projects for the address
      const projectIds = await builderCredit.coreContract.getDeveloperProjects(addressToCheck);
      
      // Get project details for each project ID
      const history = [];
      for (const projectId of projectIds) {
        const project = await builderCredit.coreContract.projects(projectId);
        
        history.push({
          projectId: projectId.toString(),
          name: project.name,
          amount: ethers.utils.formatUnits(project.fundingAmount, 6),
          timestamp: new Date(project.fundedAt.toNumber() * 1000).toISOString(),
          status: project.isActive ? 'active' : 'completed'
        });
      }
      
      return history;
    } catch (err) {
      console.error('Failed to get funding history:', err);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  const calculateFundingAmount = async (creditScore) => {
    try {
      // Get BuilderCredit context safely
      const builderCredit = useBuilderCreditInternal();
      
      if (!builderCredit || !builderCredit.coreContract) {
        throw new Error('BuilderCredit contract not initialized');
      }
      
      // Calculate funding amount from smart contract
      const amount = await builderCredit.calculateFundingAmount(creditScore);
      
      return {
        amount: amount,
        creditScore: creditScore,
        currency: 'USDC'
      };
    } catch (err) {
      console.error('Failed to calculate funding:', err);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  const checkAPIConfiguration = async () => {
    try {
      const response = await fetch('/api/circle/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to check configuration');
      }

      return result;
    } catch (err) {
      console.error('Failed to check API configuration:', err);
      setError(err.message);
      throw err;
    }
  };

  const transferUSDC = async (sourceWalletId, destinationAddress, amount, reason) => {
    try {
      setLoading(true);
      
      if (!isInitialized) {
        throw new Error('Circle Wallet context not initialized');
      }
      
      // Get BuilderCredit context safely
      const builderCredit = useBuilderCreditInternal();
      
      if (!builderCredit || !builderCredit.usdcContract) {
        throw new Error('USDC contract not initialized');
      }
      
      // Convert amount to USDC units
      const usdcAmount = ethers.utils.parseUnits(amount.toString(), 6);
      
      // Get wallet by ID
      const wallet = await getWalletById(sourceWalletId);
      if (!wallet) {
        throw new Error(`Wallet with ID ${sourceWalletId} not found`);
      }
      
      // Create transaction with our Circle API endpoint
      const transactionRequest = {
        idempotencyKey: `transfer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        walletId: sourceWalletId,
        tokenId: 'USDC', // USDC token
        amount: amount.toString(),
        destinationAddress: destinationAddress,
        feeLevel: 'MEDIUM',
        metadata: {
          reason: reason || 'Developer funding'
        }
      };
      
      const response = await fetch('/api/circle/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionRequest)
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create transaction');
      }
      
      if (!result.data) {
        throw new Error('Failed to create transaction: Invalid response from API');
      }
      
      const transaction = result.data;
      
      // Poll for transaction status
      let finalTransaction = transaction;
      let retries = 0;
      const maxRetries = 10;
      
      while (finalTransaction.state === 'PENDING' && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        const statusResponse = await fetch(`/api/circle/transactions?id=${transaction.id}`);
        const statusResult = await statusResponse.json();
        
        if (statusResult.success && statusResult.data) {
          finalTransaction = statusResult.data;
        }
        
        retries++;
      }
      
      return {
        transactionId: finalTransaction.id,
        transactionHash: finalTransaction.transactionHash,
        from: wallet.address,
        to: destinationAddress,
        amount: amount,
        currency: 'USDC',
        status: finalTransaction.state,
        reason: reason || 'Developer funding'
      };
    } catch (err) {
      console.error('USDC transfer failed:', err);
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Repay loan function
  const repayLoan = async (amount, walletId) => {
    try {
      setLoading(true);
      
      // Get BuilderCredit context safely
      const builderCredit = useBuilderCreditInternal();
      
      if (!builderCredit || !builderCredit.coreContract || !builderCredit.usdcContract) {
        throw new Error('BuilderCredit contracts not initialized');
      }
      
      // Get wallet by ID if provided
      let selectedWallet = null;
      if (walletId) {
        selectedWallet = await getWalletById(walletId);
        if (!selectedWallet) {
          throw new Error(`Wallet with ID ${walletId} not found`);
        }
      } else if (wallets.length > 0) {
        selectedWallet = wallets[0];
      }
      
      if (!selectedWallet) {
        throw new Error('No wallet available for repayment');
      }
      
      // Approve USDC for repayment using Circle wallet
      // First approve USDC transfer to the core contract
      const approvalRequest = {
        idempotencyKey: `approve-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        walletId: selectedWallet.id,
        tokenId: 'USDC',
        amount: amount.toString(),
        destinationAddress: builderCredit.coreContract.address,
        feeLevel: 'MEDIUM',
        metadata: {
          reason: 'Loan Repayment Approval'
        }
      };
      
      // Call our API endpoint for transaction
      await fetch('/api/circle/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(approvalRequest)
      });
      
      // Call the BuilderCredit repayLoan function
      const result = await builderCredit.repayLoan(amount);
      
      return {
        transactionHash: result.transactionHash,
        amount: result.amount,
        status: 'completed'
      };
    } catch (err) {
      console.error('Loan repayment failed:', err);
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const value = {
    // Context state
    isInitialized,
    error,
    loading,
    
    // Wallet management
    wallets,
    createWallet,
    getWallets,
    getWalletById,
    signTransaction,
    
    // Funding operations
    requestFunding,
    getFundingHistory,
    calculateFundingAmount,
    transferUSDC,
    repayLoan,
    
    // Utilities
    isConfigured: async () => {
      try {
        const status = await checkAPIConfiguration();
        return status.success && status.data?.apiKeyConfigured;
      } catch {
        return false;
      }
    },
    getEnvironment: async () => {
      try {
        const status = await checkAPIConfiguration();
        return status.success ? status.data?.environment : 'sandbox';
      } catch {
        return 'sandbox';
      }
    },
    checkAPIConfiguration
  };

  return (
    <CircleWalletContext.Provider value={value}>
      {children}
    </CircleWalletContext.Provider>
  );
};

export default CircleWalletContext;
