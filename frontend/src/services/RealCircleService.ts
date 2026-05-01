/**
 * Real Circle API Service
 * TypeScript implementation using Circle's SDK
 */

import { Circle, CircleEnvironments } from "@circle-fin/circle-sdk";
import { TESTNET_USDC_ADDRESSES, ARC_TESTNET_CHAIN_ID } from "../config/tokens";

interface WalletConfig {
  name?: string;
  description?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface TransactionConfig {
  walletId: string;
  blockchain?: string;
  tokenId?: string;
  amount: string;
  destinationAddress: string;
  feeLevel?: string;
  metadata?: Record<string, any>;
}

interface FundingResult {
  success: boolean;
  walletId: string;
  fundingAmount: number;
  creditScore: number;
  message: string;
  mock?: boolean;
}

interface CircleResponse<T = any> {
  success: boolean;
  data: T;
}

class RealCircleService {
  private circle: Circle | null = null;
  private readonly environment: string;
  private readonly apiKey: string | undefined;
  private readonly walletSetId: string | undefined;
  private readonly entitySecret: string | undefined;

  constructor() {
    this.environment = process.env.CIRCLE_ENVIRONMENT || "sandbox";
    this.apiKey = process.env.CIRCLE_API_KEY;
    this.walletSetId = process.env.CIRCLE_WALLET_SET_ID;
    this.entitySecret = process.env.CIRCLE_ENTITY_SECRET;
    this.initialize();
  }

  private initialize(): void {
    if (!this.apiKey) {
      console.warn("Circle API key not configured");
      return;
    }

    const circleEnvironment =
      this.environment === "production"
        ? CircleEnvironments.PRODUCTION
        : CircleEnvironments.SANDBOX;

    this.circle = new Circle(this.apiKey, circleEnvironment as string);
  }

  isConfigured(): boolean {
    return !!(this.circle && this.apiKey && this.walletSetId);
  }

  generateIdempotencyKey(prefix = "tx"): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}`;
  }

  /**
   * Create a new Circle wallet
   */
  async createWallet(config: WalletConfig = {}): Promise<CircleResponse> {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    const idempotencyKey = this.generateIdempotencyKey("wallet");

    try {
      const response = await (this.circle as any).wallets.create({
        idempotencyKey,
        entitySecretCiphertext: this.entitySecret,
        walletSetId: this.walletSetId,
        blockchains: ["ETH", "MATIC", "ARB", "BASE", "OP", "ARC"],
        count: 1,
        metadata: {
          name: config.name || "Developer Wallet",
          description: config.description || "Wallet for developer funding",
          userId: config.userId || "unknown",
          ...config.metadata,
        },
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      throw new Error(`Wallet creation failed: ${error.message}`);
    }
  }

  /**
   * Get all wallets for the wallet set
   */
  async getWallets(walletSetId: string | null = null): Promise<CircleResponse> {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    try {
      const response = await (this.circle as any).wallets.list({
        walletSetId: walletSetId || this.walletSetId,
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      throw new Error(`Get wallets failed: ${error.message}`);
    }
  }

  /**
   * Get wallet by ID
   */
  async getWalletById(walletId: string): Promise<CircleResponse> {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    try {
      const response = await (this.circle as any).wallets.get({ id: walletId });
      return { success: true, data: response.data };
    } catch (error: any) {
      throw new Error(`Get wallet failed: ${error.message}`);
    }
  }

  /**
   * Get wallet balances
   */
  async getWalletBalances(walletId: string): Promise<CircleResponse> {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    try {
      const response = await (this.circle as any).wallets.getBalance({ id: walletId });
      return { success: true, data: response.data };
    } catch (error: any) {
      throw new Error(`Get wallet balances failed: ${error.message}`);
    }
  }

  /**
   * Create a transaction (transfer)
   */
  async createTransaction(config: TransactionConfig): Promise<CircleResponse> {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    const idempotencyKey = this.generateIdempotencyKey("tx");

    try {
      const response = await (this.circle as any).transactions.create({
        idempotencyKey,
        walletId: config.walletId,
        blockchain: config.blockchain || "ARC",
        tokenId: config.tokenId || (TESTNET_USDC_ADDRESSES as Record<number, string>)[ARC_TESTNET_CHAIN_ID],
        amount: config.amount,
        destinationAddress: config.destinationAddress,
        feeLevel: config.feeLevel || "HIGH",
        metadata: config.metadata || {},
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      throw new Error(`Transaction creation failed: ${error.message}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<CircleResponse> {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    try {
      const response = await (this.circle as any).transactions.get({ id: transactionId });
      return { success: true, data: response.data };
    } catch (error: any) {
      throw new Error(`Get transaction status failed: ${error.message}`);
    }
  }

  /**
   * Test API connection
   */
  async ping(): Promise<CircleResponse> {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    try {
      const response = await (this.circle as any).ping.ping();
      return { success: true, data: response.data };
    } catch (error: any) {
      throw new Error(`Ping failed: ${error.message}`);
    }
  }

  /**
   * Process developer funding
   */
  async processDeveloperFunding(
    developerAddress: string,
    creditScore: number,
    metadata: Record<string, any> = {}
  ): Promise<FundingResult> {
    if (!this.isConfigured()) {
      console.warn("Circle API not configured, using mock funding");
      return this.mockFunding(developerAddress, creditScore, metadata);
    }

    try {
      const fundingAmount = this.calculateFundingAmount(creditScore);

      if (fundingAmount <= 0) {
        throw new Error("Not eligible for funding");
      }

      const wallet = await this.createWallet({
        name: `Developer Wallet - ${metadata.githubUsername || "Unknown"}`,
        description: `Funding wallet for developer ${developerAddress}`,
        userId: developerAddress,
        metadata: { creditScore, developerAddress, ...metadata },
      });

      return {
        success: true,
        walletId: wallet.data.wallets[0].id,
        fundingAmount,
        creditScore,
        message: "Wallet created successfully. Funding will be processed separately.",
      };
    } catch (error: any) {
      throw new Error(`Developer funding failed: ${error.message}`);
    }
  }

  /**
   * Mock funding for when Circle API is not configured
   */
  mockFunding(
    developerAddress: string,
    creditScore: number,
    metadata: Record<string, any> = {}
  ): FundingResult {
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
  calculateFundingAmount(creditScore: number): number {
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
