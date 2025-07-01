import { Circle, CircleEnvironments } from '@circle-fin/circle-sdk';

// Initialize Circle SDK
const circle = new Circle(
  process.env.CIRCLE_API_KEY || process.env.NEXT_PUBLIC_CIRCLE_API_KEY,
  CircleEnvironments.sandbox // Use sandbox for development
);

export class USDCPaymentService {
  constructor() {
    this.circle = circle;
  }

  /**
   * Create a wallet for a user
   * @param {string} userId - Unique user identifier
   * @returns {Promise<Object>} Wallet creation response
   */
  async createWallet(userId) {
    try {
      const response = await this.circle.wallets.createWallet({
        idempotencyKey: `wallet-${userId}-${Date.now()}`,
        description: `POS Dashboard wallet for user ${userId}`,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  /**
   * Get wallet balance
   * @param {string} walletId - Circle wallet ID
   * @returns {Promise<Object>} Wallet balance information
   */
  async getWalletBalance(walletId) {
    try {
      const response = await this.circle.wallets.getWallet(walletId);
      return response.data;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  /**
   * Transfer USDC to a recipient
   * @param {string} sourceWalletId - Source wallet ID
   * @param {string} destinationAddress - Recipient address
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
