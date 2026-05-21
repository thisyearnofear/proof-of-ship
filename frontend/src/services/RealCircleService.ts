/**
 * Real Circle API Service
 * Uses @circle-fin/developer-controlled-wallets for W3S API
 */

import {
  initiateDeveloperControlledWalletsClient,
  type CircleDeveloperControlledWalletsClient,
} from "@circle-fin/developer-controlled-wallets";
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
  /** Contract address for smart contract interactions (e.g., BuilderCreditCore.backProject) */
  contractAddress?: string;
  /** ABI-encoded calldata for the contract call */
  calldata?: string;
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
  private client: CircleDeveloperControlledWalletsClient | null = null;
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
    if (!this.apiKey || !this.entitySecret) {
      console.warn("Circle API key or entity secret not configured");
      return;
    }

    this.client = initiateDeveloperControlledWalletsClient({
      apiKey: this.apiKey,
      entitySecret: this.entitySecret,
    });
  }

  isConfigured(): boolean {
    return !!(this.client && this.apiKey && this.walletSetId);
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
      const response = await this.client!.createWallets({
        idempotencyKey,
        walletSetId: this.walletSetId!,
        blockchains: ["ETH", "MATIC-AMOY", "BASE-SEPOLIA", "ARB-SEPOLIA"] as any,
        count: 1,
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
      const response = await this.client!.listWallets({
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
      const response = await this.client!.getWallet({ id: walletId });
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
      const response = await this.client!.getWalletTokenBalance({ id: walletId });
      return { success: true, data: response.data };
    } catch (error: any) {
      throw new Error(`Get wallet balances failed: ${error.message}`);
    }
  }

  /**
   * Create a transaction — supports USDC transfers AND smart contract calls.
   *
   * For USDC transfers: set destinationAddress + amount + tokenId.
   * For contract calls (e.g. backProject): set contractAddress + calldata + destinationAddress.
   * Circle signs and broadcasts the transaction using the wallet's stored key.
   */
  async createTransaction(config: TransactionConfig): Promise<CircleResponse> {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    const idempotencyKey = this.generateIdempotencyKey("tx");
    const txParams: Record<string, any> = {
      idempotencyKey,
      walletId: config.walletId,
      destinationAddress: config.destinationAddress,
      fee: { feeLevel: "HIGH" },
    };

    // Smart contract call mode (e.g., BuilderCreditCore.backProject)
    if (config.contractAddress && config.calldata) {
      txParams.contractAddress = config.contractAddress;
      txParams.calldata = config.calldata;
      txParams.tokenId = config.tokenId || (TESTNET_USDC_ADDRESSES as Record<number, string>)[ARC_TESTNET_CHAIN_ID];
    } else {
      // Standard USDC transfer mode
      txParams.tokenId = config.tokenId || (TESTNET_USDC_ADDRESSES as Record<number, string>)[ARC_TESTNET_CHAIN_ID];
      txParams.amount = [config.amount];
    }

    try {
      const response = await this.client!.createTransaction(txParams);
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
      const response = await this.client!.getTransaction({ id: transactionId });
      return { success: true, data: response.data };
    } catch (error: any) {
      throw new Error(`Get transaction status failed: ${error.message}`);
    }
  }

  /**
   * Get Circle config info for the frontend
   */
  getConfig(): { success: boolean; data: { walletSetId: string; environment: string; configured: boolean } } {
    return {
      success: true,
      data: {
        walletSetId: this.walletSetId || "",
        environment: this.environment,
        configured: this.isConfigured(),
      },
    };
  }

  /**
   * Test API connection (list wallets as a connectivity check)
   */
  async ping(): Promise<CircleResponse> {
    if (!this.isConfigured()) {
      throw new Error("Circle API not properly configured");
    }

    try {
      // List wallets as a connectivity test
      const response = await this.client!.listWallets({
        walletSetId: this.walletSetId!,
      });
      return { success: true, data: { message: "OK", wallets: response.data } };
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
