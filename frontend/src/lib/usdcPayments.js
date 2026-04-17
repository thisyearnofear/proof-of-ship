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
    this.environment = process.env.CIRCLE_ENVIRONMENT || 'sandbox';
    
    // Initialize Circle SDK only if API key is available
    if (process.env.CIRCLE_API_KEY) {
      this.circle = circle;
      
      // Log environment for debugging (safe for testnet keys)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Circle SDK initialized in ${this.environment} mode`);
      }
    } else {
      this.circle = null;
      console.warn('Circle API key not found. Service will require API key for operations.');
    }
  }

  /**
   * Validate that Circle API is configured before operations
   * @private
   */
  _validateApiKey() {
    if (!process.env.CIRCLE_API_KEY || !this.circle) {
      throw new Error('Circle API key is required. Please set CIRCLE_API_KEY environment variable.');
    }
  }

  /**
   * Create a wallet for a user
   * @param {string} userId - Unique user identifier
   * @returns {Promise<Object>} Wallet creation response
   */
  async createWallet(userId) {
    try {
      this._validateApiKey();

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
      this._validateApiKey();

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
      this._validateApiKey();

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
  async processDeveloperFunding(developerAddress, creditScore, creditData = {}) {
    try {
      // Validate Circle API configuration
      this._validateApiKey();

      // Validate credit score
      if (creditScore < 400) {
        throw new Error('Credit score too low for funding eligibility');
      }

      const fundingAmount = this.calculateFundingAmount(creditScore);
      const fundingReason = `Developer funding - Credit Score: ${creditScore}, Amount: $${fundingAmount}`;

      // Execute real funding transfer
      const transfer = await this.executeFundingTransfer(
        developerAddress,
        fundingAmount,
        fundingReason
      );

      return {
        success: true,
        transfer,
        amount: fundingAmount,
        creditScore,
        developerAddress,
        environment: this.environment,
        message: 'Funding transfer completed successfully'
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
      this._validateApiKey();

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
      this._validateApiKey();

      // In a real implementation, this would query your database for funding records
      // For now, we'll query Circle API for transfer history
      // Note: You would typically store funding records in your own database
      // and associate them with developer addresses
      
      // This is a placeholder - you would implement database queries here
      // to get funding history for the specific developer address
      
      return [];
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
    return !!(process.env.CIRCLE_API_KEY && this.circle);
  }

  /**
   * Get current environment
   * @returns {string} Environment (sandbox/production)
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Validate wallet address format
   * @param {string} address - Wallet address to validate
   * @returns {boolean} Whether address is valid
   */
  validateWalletAddress(address) {
    if (!address || typeof address !== 'string') {
      return false;
    }
    
    // Basic Ethereum address validation
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }

  /**
   * Get supported chains for current environment
   * @returns {Array} List of supported chains
   */
  getSupportedChains() {
    if (this.environment === 'sandbox') {
      return [
        { id: 'ETH-SEPOLIA', name: 'Ethereum Sepolia', testnet: true },
        { id: 'MATIC-MUMBAI', name: 'Polygon Mumbai', testnet: true }
      ];
    } else {
      return [
        { id: 'ETH', name: 'Ethereum Mainnet', testnet: false },
        { id: 'MATIC', name: 'Polygon Mainnet', testnet: false }
      ];
    }
  }

  /**
   * Get funding eligibility info
   * @param {number} creditScore - Credit score to check
   * @returns {Object} Eligibility information
   */
  getFundingEligibility(creditScore) {
    const amount = this.calculateFundingAmount(creditScore);
    const tier = getFundingTier(creditScore);
    
    return {
      eligible: creditScore >= 400,
      amount,
      tier,
      creditScore,
      requirements: creditScore < 400 ? [
        'Credit score must be at least 400',
        'Complete credit profile verification',
        'Link GitHub account with active repositories'
      ] : [],
      benefits: amount > 0 ? [
        `Up to $${amount} in USDC funding`,
        'No upfront collateral required',
        'Flexible repayment terms',
        'Build credit history through successful projects'
      ] : []
    };
  }

  /**
   * Estimate transaction fees
   * @param {string} chain - Target blockchain
   * @param {number} amount - Transfer amount
   * @returns {Object} Fee estimation
   */
  estimateTransactionFees(chain = 'ETH-SEPOLIA', amount = 0) {
    // Mock fee estimation for demo
    const baseFees = {
      'ETH': { gas: 0.005, platform: 0.01 },
      'ETH-SEPOLIA': { gas: 0.001, platform: 0.005 },
      'MATIC': { gas: 0.001, platform: 0.005 },
      'MATIC-MUMBAI': { gas: 0.0005, platform: 0.002 }
    };

    const fees = baseFees[chain] || baseFees['ETH-SEPOLIA'];
    const totalFees = fees.gas + fees.platform;
    
    return {
      gasEstimate: fees.gas,
      platformFee: fees.platform,
      totalFees,
      netAmount: Math.max(0, amount - totalFees),
      chain,
      currency: 'USD'
    };
  }
  /**
   * Transfer USDC with custom reason/description
   * @param {string} sourceWalletId - Source wallet ID
   * @param {string} destinationAddress - Recipient address
   * @param {number} amount - Amount in USDC
   * @param {string} reason - Transfer reason/description
   * @returns {Promise<Object>} Transfer response
   */
  async transferUSDCWithReason(sourceWalletId, destinationAddress, amount, reason = 'Developer funding') {
    try {
      this._validateApiKey();

      const response = await this.circle.transfers.createTransfer({
        idempotencyKey: `transfer-${Date.now()}-${Math.random()}`,
        source: {
          type: 'wallet',
          id: sourceWalletId,
        },
        destination: {
          type: 'blockchain',
          address: destinationAddress,
          chain: this.environment === 'sandbox' ? 'ETH-SEPOLIA' : 'ETH'
        },
        amount: {
          amount: amount.toString(),
          currency: 'USD',
        },
        description: reason,
      });
      
      return response.data;
    } catch (error) {
      console.error('Error transferring USDC with reason:', error);
      throw new Error(`Failed to transfer USDC: ${error.message}`);
    }
  }

  /**
   * Get platform wallet for funding operations
   * @returns {Promise<Object>} Platform wallet information
   */
  async getPlatformWallet() {
    try {
      this._validateApiKey();

      if (!process.env.CIRCLE_PLATFORM_WALLET_ID) {
        throw new Error('Circle platform wallet ID not configured. Please set CIRCLE_PLATFORM_WALLET_ID environment variable.');
      }

      // Get actual platform wallet information
      const response = await this.circle.wallets.getWallet(process.env.CIRCLE_PLATFORM_WALLET_ID);
      return response.data;
    } catch (error) {
      console.error('Error getting platform wallet:', error);
      throw new Error(`Failed to get platform wallet: ${error.message}`);
    }
  }

  /**
   * Execute actual funding transfer to developer
   * @param {string} developerAddress - Developer's wallet address
   * @param {number} amount - Amount to transfer
   * @param {string} reason - Funding reason
   * @returns {Promise<Object>} Transfer result
   */
  async executeFundingTransfer(developerAddress, amount, reason = 'Developer funding based on credit score') {
    try {
      this._validateApiKey();

      const platformWallet = await this.getPlatformWallet();
      
      return await this.transferUSDCWithReason(
        platformWallet.id,
        developerAddress,
        amount,
        reason
      );
    } catch (error) {
      console.error('Error executing funding transfer:', error);
      throw new Error(`Failed to execute funding transfer: ${error.message}`);
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
