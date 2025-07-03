import { Circle, CircleEnvironments } from '@circle-fin/circle-sdk';

// Initialize Circle SDK with proper environment configuration
const getCircleEnvironment = () => {
  const env = process.env.CIRCLE_ENVIRONMENT || 'sandbox';
  return env === 'production' ? CircleEnvironments.production : CircleEnvironments.sandbox;
};

const circle = new Circle(
  process.env.CIRCLE_API_KEY,
  getCircleEnvironment()
);

export class USDCPaymentService {
  constructor() {
    this.circle = circle;
    this.environment = process.env.CIRCLE_ENVIRONMENT || 'sandbox';
    
    // Validate API key is present
    if (!process.env.CIRCLE_API_KEY) {
      console.warn('Circle API key not found. USDC payment features will be disabled.');
    }
    
    // Log environment for debugging (safe for testnet keys)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Circle SDK initialized in ${this.environment} mode`);
    }
  }

  /**
   * Create a wallet for a user
   * @param {string} userId - Unique user identifier
   * @returns {Promise<Object>} Wallet creation response
   */
  async createWallet(userId) {
    try {
      if (!process.env.CIRCLE_API_KEY) {
        throw new Error('Circle API key not configured');
      }

      const response = await this.circle.wallets.createWallet({
        idempotencyKey: `wallet-${userId}-${Date.now()}`,
        description: `POS Dashboard wallet for user ${userId}`,
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet balance
   * @param {string} walletId - Circle wallet ID
   * @returns {Promise<Object>} Wallet balance information
   */
  async getWalletBalance(walletId) {
    try {
      if (!process.env.CIRCLE_API_KEY) {
        throw new Error('Circle API key not configured');
      }

      const response = await this.circle.wallets.getWallet(walletId);
      return response.data;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }

  /**
   * Transfer USDC to a recipient
   * @param {string} sourceWalletId - Source wallet ID
   * @param {string} destinationAddress - Recipient address
   * @param {string} amount - Amount in USDC (as string)
   * @returns {Promise<Object>} Transfer response
   */
  async transferUSDC(sourceWalletId, destinationAddress, amount) {
    try {
      if (!process.env.CIRCLE_API_KEY) {
        throw new Error('Circle API key not configured');
      }

      const response = await this.circle.transfers.createTransfer({
        idempotencyKey: `transfer-${Date.now()}-${Math.random()}`,
        source: {
          type: 'wallet',
          id: sourceWalletId
        },
        destination: {
          type: 'blockchain',
          address: destinationAddress,
          chain: this.environment === 'sandbox' ? 'ETH-SEPOLIA' : 'ETH'
        },
        amount: {
          amount: amount,
          currency: 'USD'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error transferring USDC:', error);
      throw new Error(`Failed to transfer USDC: ${error.message}`);
    }
  }

  /**
   * Process developer funding based on credit score
   * @param {string} developerAddress - Developer's wallet address
   * @param {number} creditScore - Developer's credit score
   * @param {Object} creditData - Additional credit data
   * @returns {Promise<Object>} Funding result
   */
  async processDeveloperFunding(developerAddress, creditScore, creditData) {
    try {
      if (!process.env.CIRCLE_API_KEY) {
        return {
          success: false,
          error: 'Circle API not configured. Using mock funding for development.',
          mockFunding: true,
          amount: this.calculateFundingAmount(creditScore),
          developerAddress
        };
      }

      // Validate credit score
      if (creditScore < 400) {
        throw new Error('Credit score too low for funding eligibility');
      }

      const fundingAmount = this.calculateFundingAmount(creditScore);
      
      // In a real implementation, you would:
      // 1. Create or get platform wallet
      // 2. Transfer USDC to developer address
      // 3. Record transaction in database
      
      // For hackathon demo, we'll simulate the process
      const mockTransfer = {
        id: `mock-transfer-${Date.now()}`,
        amount: fundingAmount.toString(),
        currency: 'USD',
        destination: developerAddress,
        status: 'complete',
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        createdAt: new Date().toISOString()
      };

      return {
        success: true,
        transfer: mockTransfer,
        amount: fundingAmount,
        creditScore,
        developerAddress,
        environment: this.environment
      };

    } catch (error) {
      console.error('Error processing developer funding:', error);
      throw error;
    }
  }

  /**
   * Calculate funding amount based on credit score
   * @param {number} creditScore - Credit score (0-850)
   * @returns {number} Funding amount in USDC
   */
  calculateFundingAmount(creditScore) {
    if (creditScore < 400) return 0;
    if (creditScore >= 800) return 5000;
    
    const minFunding = 500;
    const maxFunding = 5000;
    const range = maxFunding - minFunding;
    const scoreRange = 800 - 400;
    const adjustedScore = creditScore - 400;
    
    return Math.floor(minFunding + (range * adjustedScore) / scoreRange);
  }

  /**
   * Get transfer status
   * @param {string} transferId - Transfer ID
   * @returns {Promise<Object>} Transfer status
   */
  async getTransferStatus(transferId) {
    try {
      if (!process.env.CIRCLE_API_KEY) {
        return {
          id: transferId,
          status: 'complete',
          mock: true
        };
      }

      const response = await this.circle.transfers.getTransfer(transferId);
      return response.data;
    } catch (error) {
      console.error('Error getting transfer status:', error);
      throw new Error(`Failed to get transfer status: ${error.message}`);
    }
  }

  /**
   * Get funding history for a developer
   * @param {string} developerAddress - Developer's wallet address
   * @returns {Promise<Array>} Funding history
   */
  async getFundingHistory(developerAddress) {
    try {
      // In a real implementation, this would query your database
      // For now, return mock data
      return [
        {
          id: 'mock-funding-1',
          amount: '2500',
          currency: 'USD',
          status: 'complete',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          creditScore: 720
        }
      ];
    } catch (error) {
      console.error('Error getting funding history:', error);
      throw new Error(`Failed to get funding history: ${error.message}`);
    }
  }

  /**
   * Check if Circle API is properly configured
   * @returns {boolean} Configuration status
   */
  isConfigured() {
    return !!process.env.CIRCLE_API_KEY;
  }

  /**
   * Get current environment
   * @returns {string} Environment (sandbox/production)
   */
  getEnvironment() {
    return this.environment;
  }
}

export const usdcPaymentService = new USDCPaymentService();
   * @param {number} amount - Amount in USDC
   * @param {string} reason - Transfer reason/description
   * @returns {Promise<Object>} Transfer response
   */
  async transferUSDC(sourceWalletId, destinationAddress, amount, reason = 'Developer funding') {
    try {
      const response = await this.circle.transfers.createTransfer({
        idempotencyKey: `transfer-${Date.now()}-${Math.random()}`,
        source: {
          type: 'wallet',
          id: sourceWalletId,
        },
        destination: {
          type: 'blockchain',
          address: destinationAddress,
          chain: 'ETH', // or 'MATIC' for Polygon
        },
        amount: {
          amount: amount.toString(),
          currency: 'USD',
        },
        description: reason,
      });
      return response.data;
    } catch (error) {
      console.error('Error transferring USDC:', error);
      throw new Error('Failed to transfer USDC');
    }
  }

  /**
   * Get transfer status
   * @param {string} transferId - Transfer ID
   * @returns {Promise<Object>} Transfer status
   */
  async getTransferStatus(transferId) {
    try {
      const response = await this.circle.transfers.getTransfer(transferId);
      return response.data;
    } catch (error) {
      console.error('Error getting transfer status:', error);
      throw new Error('Failed to get transfer status');
    }
  }

  /**
   * Calculate funding amount based on credit score
   * @param {number} creditScore - User's credit score (0-1000)
   * @returns {number} Funding amount in USDC
   */
  calculateFundingAmount(creditScore) {
    // Funding tiers based on credit score
    if (creditScore >= 800) return 5000; // Excellent: $5,000
    if (creditScore >= 700) return 3500; // Good: $3,500
    if (creditScore >= 600) return 2000; // Fair: $2,000
    if (creditScore >= 500) return 1000; // Poor: $1,000
    return 500; // Very Poor: $500 (minimum)
  }

  /**
   * Process developer funding based on credit score
   * @param {string} developerAddress - Developer's wallet address
   * @param {number} creditScore - Developer's credit score
   * @param {Object} creditData - Detailed credit information
   * @returns {Promise<Object>} Funding transaction result
   */
  async processDeveloperFunding(developerAddress, creditScore, creditData) {
    try {
      const fundingAmount = this.calculateFundingAmount(creditScore);
      
      // Get treasury wallet (this would be configured in environment)
      const treasuryWalletId = process.env.CIRCLE_TREASURY_WALLET_ID;
      
      if (!treasuryWalletId) {
        throw new Error('Treasury wallet not configured');
      }

      // Create transfer
      const transfer = await this.transferUSDC(
        treasuryWalletId,
        developerAddress,
        fundingAmount,
        `Developer funding - Credit Score: ${creditScore} - GitHub: ${creditData.github?.username || 'N/A'}`
      );

      return {
        success: true,
        transferId: transfer.id,
        amount: fundingAmount,
        status: transfer.status,
        creditScore,
        developerAddress,
      };
    } catch (error) {
      console.error('Error processing developer funding:', error);
      return {
        success: false,
        error: error.message,
        creditScore,
        developerAddress,
      };
    }
  }

  /**
   * Get funding history for a developer
   * @param {string} developerAddress - Developer's wallet address
   * @returns {Promise<Array>} Array of funding transactions
   */
  async getFundingHistory(developerAddress) {
    try {
      // This would typically query your database for funding history
      // For now, we'll return a placeholder
      return [];
    } catch (error) {
      console.error('Error getting funding history:', error);
      throw new Error('Failed to get funding history');
    }
  }
}

// Export singleton instance
export const usdcPaymentService = new USDCPaymentService();

// Helper functions for frontend use
export const formatUSDC = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getFundingTier = (creditScore) => {
  if (creditScore >= 800) return { tier: 'Excellent', color: 'green' };
  if (creditScore >= 700) return { tier: 'Good', color: 'blue' };
  if (creditScore >= 600) return { tier: 'Fair', color: 'yellow' };
  if (creditScore >= 500) return { tier: 'Poor', color: 'orange' };
  return { tier: 'Very Poor', color: 'red' };
};

export default USDCPaymentService;
