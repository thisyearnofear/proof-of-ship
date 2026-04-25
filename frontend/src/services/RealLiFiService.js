/**
 * Real LI.FI Service
 * Actual implementation using LI.FI SDK for cross-chain transfers
 */

import { LiFi } from "@lifi/sdk";
import { ethers } from "ethers";
import { USDC_ADDRESSES, TESTNET_CHAIN_INFO } from "../config/tokens";

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
        apiUrl: "https://li.fi/v1",
        integrator: this.integrator,
        apiKey: this.apiKey,
      });

    } catch (error) {
      console.error("Failed to initialize LI.FI SDK:", error);
    }
  }

  isConfigured() {
    return !!this.lifi;
  }

  /**
   * Get available chains for cross-chain transfers
   * Uses backend proxy to avoid CORS issues
   */
  async getAvailableChains() {
    try {
      // Use backend proxy to avoid CORS
      const response = await fetch('/api/lifi/chains');
      if (!response.ok) throw new Error(`Proxy returned ${response.status}`);
      const { data } = await response.json();
      const { chains } = data;

      // Filter to only include our supported testnet chains
      return chains
        .filter((chain) => chain.id in USDC_ADDRESSES)
        .map((chain) => ({
          id: chain.id,
          name: chain.name,
          token: chain.nativeCurrency?.symbol || "ETH",
          logoURI: chain.logoURI,
          testnet: !!chain.metamask?.testnet,
          usdcAddress: USDC_ADDRESSES[chain.id],
        }));
    } catch (error) {
      console.error("Failed to get available chains:", error);
      // Fall back to hardcoded chains if proxy fails
      return this.getHardcodedChains();
    }
  }

  /**
   * Fallback: return hardcoded chain list when LiFi API is unavailable
   */
  getHardcodedChains() {
    return Object.entries(TESTNET_CHAIN_INFO).map(([id, info]) => ({
      id: parseInt(id),
      name: info.name,
      token: info.symbol,
      usdcAddress: USDC_ADDRESSES[id],
      testnet: true,
    }));
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

      // Execute the quote using LI.FI SDK
      const result = await this.lifi.executeRoute(quote, {
        signer,
        infiniteApproval: false,
        updateCallback: (update) => {
          console.log("Transfer update:", update);
        },
      });

      // Get transaction hash from the last step
      const lastStep = result.steps[result.steps.length - 1];
      const txHash =
        lastStep.execution?.process.find((p) => p.txHash)?.txHash ||
        result.transactionHash;

      // Create transfer record
      const transfer = {
        id: `${txHash || Date.now()}-${Date.now()}`,
        txHash: txHash,
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
        transactionHash: txHash,
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
    const fromUSDCAddress = USDC_ADDRESSES[fromChainId];
    const toUSDCAddress = USDC_ADDRESSES[toChainId];

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
