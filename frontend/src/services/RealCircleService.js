/**
 * Real Circle API Service
 * Actual implementation using Circle's APIs
 */

import { Circle, CircleEnvironments } from "@circle-fin/circle-sdk";
import { TESTNET_USDC_ADDRESSES } from "../config/tokens";

class RealCircleService {
  constructor() {
    this.circle = null;
    this.environment = process.env.CIRCLE_ENVIRONMENT || "sandbox";
    this.apiKey = process.env.CIRCLE_API_KEY;
    this.walletSetId = process.env.CIRCLE_WALLET_SET_ID;
    this.entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    this.initialize();
  }

  initialize() {
    if (!this.apiKey) {
      console.warn("Circle API key not configured");
      return;
    }

    const circleEnvironment =
      this.environment === "production"
        ? CircleEnvironments.PRODUCTION
        : CircleEnvironments.SANDBOX;

    this.circle = new Circle(this.apiKey, circleEnvironment);
    console.log(`Circle SDK initialized in ${this.environment} mode`);
  }

  isConfigured() {
    return !!(this.circle && this.apiKey && this.walletSetId);
  }

  generateIdempotencyKey(prefix = "tx") {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}`;
  }

  /**
   * Create a new Circle wallet
   */
  async createWallet(config = {}) {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    const idempotencyKey = this.generateIdempotencyKey("wallet");

    try {
      const response = await this.circle.wallets.create({
        idempotencyKey,
        entitySecretCiphertext: this.entitySecret,
        walletSetId: this.walletSetId,
        blockchains: ["ETH", "MATIC", "ARB", "BASE", "OP"],
        count: 1,
        metadata: {
          name: config.name || "Developer Wallet",
          description: config.description || "Wallet for developer funding",
          userId: config.userId || "unknown",
          ...config.metadata,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Failed to create wallet:", error);
      throw new Error(`Wallet creation failed: ${error.message}`);
    }
  }

  /**
   * Get all wallets for the wallet set
   */
  async getWallets(walletSetId = null) {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    try {
      const response = await this.circle.wallets.list({
        walletSetId: walletSetId || this.walletSetId,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Failed to get wallets:", error);
      throw new Error(`Get wallets failed: ${error.message}`);
    }
  }

  /**
   * Get wallet by ID
   */
  async getWalletById(walletId) {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    try {
      const response = await this.circle.wallets.get({ id: walletId });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Failed to get wallet:", error);
      throw new Error(`Get wallet failed: ${error.message}`);
    }
  }

  /**
   * Get wallet balances
   */
  async getWalletBalances(walletId) {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    try {
      const response = await this.circle.wallets.getBalance({
        id: walletId,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Failed to get wallet balances:", error);
      throw new Error(`Get wallet balances failed: ${error.message}`);
    }
  }

  /**
   * Create a transaction (transfer)
   */
  async createTransaction(config) {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    const idempotencyKey = this.generateIdempotencyKey("tx");

    try {
      const response = await this.circle.transactions.create({
        idempotencyKey,
        walletId: config.walletId,
        blockchain: config.blockchain || "ETH",
        tokenId: config.tokenId || TESTNET_USDC_ADDRESSES[11155111], // Default to Sepolia USDC
        amount: config.amount,
        destinationAddress: config.destinationAddress,
        feeLevel: config.feeLevel || "HIGH",
        metadata: config.metadata || {},
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Failed to create transaction:", error);
      throw new Error(`Transaction creation failed: ${error.message}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId) {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    try {
      const response = await this.circle.transactions.get({
        id: transactionId,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Failed to get transaction status:", error);
      throw new Error(`Get transaction status failed: ${error.message}`);
    }
  }

  /**
   * Test API connection
   */
  async ping() {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    try {
      const response = await this.circle.ping.ping();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Failed to ping Circle API:", error);
      throw new Error(`Ping failed: ${error.message}`);
    }
  }

  /**
   * Process developer funding
   */
  async processDeveloperFunding(developerAddress, creditScore, metadata = {}) {
    if (!this.isConfigured()) {
      console.warn("Circle API not configured, using mock funding");
      return this.mockFunding(developerAddress, creditScore, metadata);
    }

    try {
      // Calculate funding amount based on credit score
      const fundingAmount = this.calculateFundingAmount(creditScore);

      if (fundingAmount <= 0) {
        throw new Error("Not eligible for funding");
      }

      // Create a wallet for the developer if needed
      const wallet = await this.createWallet({
        name: `Developer Wallet - ${metadata.githubUsername || "Unknown"}`,
        description: `Funding wallet for developer ${developerAddress}`,
        userId: developerAddress,
        metadata: {
          creditScore,
          developerAddress,
          ...metadata,
        },
      });

      // For now, we'll just return the wallet creation
      // In a real implementation, you'd fund the wallet from a treasury
      return {
        success: true,
        walletId: wallet.data.wallets[0].id,
        fundingAmount,
        creditScore,
        message:
          "Wallet created successfully. Funding will be processed separately.",
      };
    } catch (error) {
      console.error("Failed to process developer funding:", error);
      throw new Error(`Developer funding failed: ${error.message}`);
    }
  }

  /**
   * Mock funding for when Circle API is not configured
   */
  mockFunding(developerAddress, creditScore, metadata = {}) {
    const fundingAmount = this.calculateFundingAmount(creditScore);

    return {
      success: true,
      walletId: `mock-wallet-${Date.now()}`,
      fundingAmount,
      creditScore,
      message: "Mock funding processed (Circle API not configured)",
      mock: true,
    };
  }

  /**
   * Calculate funding amount based on credit score
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
}

// Export singleton instance
export const realCircleService = new RealCircleService();
export default realCircleService;
