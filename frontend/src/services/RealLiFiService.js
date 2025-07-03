/**
 * Real LI.FI Service
 * Actual implementation using LI.FI SDK for cross-chain transfers
 */

import { LiFi } from "@lifi/sdk";
import { ethers } from "ethers";
import { TESTNET_USDC_ADDRESSES, TESTNET_CHAIN_INFO } from "../config/tokens";

class RealLiFiService {
  constructor() {
    this.lifi = null;
    this.apiKey = process.env.NEXT_PUBLIC_LIFI_API_KEY;
    this.integrator = "BuilderCredit";
    this.initialize();
  }

  initialize() {
    try {
      this.lifi = new LiFi({
        apiUrl: "https://li.fi/api",
        integrator: this.integrator,
        apiKey: this.apiKey,
      });

      console.log("LI.FI SDK initialized successfully");
    } catch (error) {
      console.error("Failed to initialize LI.FI SDK:", error);
    }
  }

  isConfigured() {
    return !!this.lifi;
  }

  /**
   * Get available chains for cross-chain transfers
   */
  async getAvailableChains() {
    if (!this.isConfigured()) {
      throw new Error("LI.FI SDK not configured");
    }

    try {
      const { chains } = await this.lifi.getChains();

      // Filter to only include our supported testnet chains
      const supportedChainIds = Object.keys(TESTNET_CHAIN_INFO).map((id) =>
        parseInt(id)
      );

      return chains
        .filter((chain) => supportedChainIds.includes(chain.id))
        .map((chain) => ({
          id: chain.id,
          name: chain.name,
          token: chain.nativeCurrency?.symbol || "ETH",
          logoURI: chain.logoURI,
          testnet: true,
          usdcAddress: TESTNET_USDC_ADDRESSES[chain.id],
        }));
    } catch (error) {
      console.error("Failed to get available chains:", error);
      throw error;
    }
  }

  /**
   * Get available tokens for a specific chain
   */
  async getChainTokens(chainId) {
    if (!this.isConfigured()) {
      throw new Error("LI.FI SDK not configured");
    }

    try {
      const { tokens } = await this.lifi.getTokens({
        chains: [chainId],
      });

      return tokens[chainId] || [];
    } catch (error) {
      console.error("Failed to get chain tokens:", error);
      throw error;
    }
  }

  /**
   * Get a quote for cross-chain transfer
   */
  async getQuote(params) {
    if (!this.isConfigured()) {
      throw new Error("LI.FI SDK not configured");
    }

    const {
      fromChainId,
      toChainId,
      fromTokenAddress,
      toTokenAddress,
      fromAmount,
      fromAddress,
      toAddress,
      slippage = 1,
    } = params;

    try {
      const quoteRequest = {
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        fromAmount,
        fromAddress,
        toAddress: toAddress || fromAddress,
        options: {
          slippage: slippage / 100, // Convert percentage to decimal
          integrator: this.integrator,
          allowSwitchChain: true,
        },
      };

      console.log("Getting LI.FI quote:", quoteRequest);
      const quote = await this.lifi.getQuote(quoteRequest);

      return {
        success: true,
        quote,
        estimatedTime: quote.estimate?.executionDuration || 0,
        estimatedFees: quote.estimate?.feeCosts || [],
        estimatedGas: quote.estimate?.gasCosts || [],
      };
    } catch (error) {
      console.error("Failed to get LI.FI quote:", error);
      throw new Error(`Quote failed: ${error.message}`);
    }
  }

  /**
   * Get multiple route options for a transfer
   */
  async getRoutes(params) {
    if (!this.isConfigured()) {
      throw new Error("LI.FI SDK not configured");
    }

    const {
      fromChainId,
      toChainId,
      fromTokenAddress,
      toTokenAddress,
      fromAmount,
      fromAddress,
      toAddress,
    } = params;

    try {
      const routesRequest = {
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        fromAmount,
        fromAddress,
        toAddress: toAddress || fromAddress,
        options: {
          integrator: this.integrator,
          allowSwitchChain: true,
        },
      };

      console.log("Getting LI.FI routes:", routesRequest);
      const routes = await this.lifi.getRoutes(routesRequest);

      return {
        success: true,
        routes: routes.routes || [],
        routesRequest,
      };
    } catch (error) {
      console.error("Failed to get LI.FI routes:", error);
      throw new Error(`Routes failed: ${error.message}`);
    }
  }

  /**
   * Execute a cross-chain transfer
   */
  async executeTransfer(quote, signer) {
    if (!this.isConfigured()) {
      throw new Error("LI.FI SDK not configured");
    }

    if (!signer) {
      throw new Error("Signer is required for transfer execution");
    }

    try {
      console.log("Executing LI.FI transfer:", quote);

      // Execute the quote using LI.FI SDK
      const result = await this.lifi.executeQuote(quote, {
        signer,
        infiniteApproval: false,
        updateCallback: (update) => {
          console.log("Transfer update:", update);
        },
      });

      // Create transfer record
      const transfer = {
        id: `${result.transactionHash}-${Date.now()}`,
        txHash: result.transactionHash,
        fromChainId: quote.action.fromChainId,
        toChainId: quote.action.toChainId,
        fromToken: quote.action.fromToken,
        toToken: quote.action.toToken,
        fromAmount: quote.action.fromAmount,
        toAmount: quote.estimate.toAmount,
        status: "PENDING",
        timestamp: Date.now(),
        tool: quote.tool || quote.toolDetails?.name || "Unknown",
        route: quote.includedSteps || [],
      };

      return {
        success: true,
        transfer,
        transactionHash: result.transactionHash,
      };
    } catch (error) {
      console.error("Failed to execute LI.FI transfer:", error);
      throw new Error(`Transfer execution failed: ${error.message}`);
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(txHash, fromChainId, toChainId) {
    if (!this.isConfigured()) {
      throw new Error("LI.FI SDK not configured");
    }

    try {
      const status = await this.lifi.getStatus({
        txHash,
        fromChainId,
        toChainId,
      });

      return {
        success: true,
        status: status.status,
        substatus: status.substatus,
        sending: status.sending,
        receiving: status.receiving,
        lifiExplorerLink: status.lifiExplorerLink,
      };
    } catch (error) {
      console.error("Failed to get transfer status:", error);
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  /**
   * Check if tokens need approval
   */
  async checkTokenApproval(
    tokenAddress,
    ownerAddress,
    spenderAddress,
    amount,
    chainId
  ) {
    if (!this.isConfigured()) {
      throw new Error("LI.FI SDK not configured");
    }

    try {
      // Get token allowance
      const allowance = await this.lifi.getTokenAllowance({
        tokenAddress,
        ownerAddress,
        spenderAddress,
        chainId,
      });

      const needsApproval = ethers.BigNumber.from(allowance).lt(
        ethers.BigNumber.from(amount)
      );

      return {
        success: true,
        needsApproval,
        currentAllowance: allowance,
        requiredAmount: amount,
      };
    } catch (error) {
      console.error("Failed to check token approval:", error);
      throw new Error(`Approval check failed: ${error.message}`);
    }
  }

  /**
   * Get supported bridges for a route
   */
  async getSupportedBridges(fromChainId, toChainId) {
    if (!this.isConfigured()) {
      throw new Error("LI.FI SDK not configured");
    }

    try {
      const connections = await this.lifi.getConnections({
        fromChainId,
        toChainId,
      });

      return {
        success: true,
        bridges: connections.connections || [],
      };
    } catch (error) {
      console.error("Failed to get supported bridges:", error);
      throw new Error(`Bridges query failed: ${error.message}`);
    }
  }

  /**
   * Create a USDC cross-chain transfer quote
   */
  async getUSDCTransferQuote(
    fromChainId,
    toChainId,
    amount,
    fromAddress,
    toAddress = null
  ) {
    const fromUSDCAddress = TESTNET_USDC_ADDRESSES[fromChainId];
    const toUSDCAddress = TESTNET_USDC_ADDRESSES[toChainId];

    if (!fromUSDCAddress || !toUSDCAddress) {
      throw new Error(
        `USDC not supported on one of the chains: ${fromChainId} -> ${toChainId}`
      );
    }

    return this.getQuote({
      fromChainId,
      toChainId,
      fromTokenAddress: fromUSDCAddress,
      toTokenAddress: toUSDCAddress,
      fromAmount: amount,
      fromAddress,
      toAddress,
    });
  }

  /**
   * Execute a USDC cross-chain transfer
   */
  async executeUSDCTransfer(
    fromChainId,
    toChainId,
    amount,
    fromAddress,
    toAddress,
    signer
  ) {
    try {
      // Get quote first
      const quoteResult = await this.getUSDCTransferQuote(
        fromChainId,
        toChainId,
        amount,
        fromAddress,
        toAddress
      );

      if (!quoteResult.success) {
        throw new Error("Failed to get quote for USDC transfer");
      }

      // Execute the transfer
      return await this.executeTransfer(quoteResult.quote, signer);
    } catch (error) {
      console.error("Failed to execute USDC transfer:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const realLiFiService = new RealLiFiService();
export default realLiFiService;
