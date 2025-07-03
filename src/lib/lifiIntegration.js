import { LiFi } from '@lifi/sdk';
import { ethers } from 'ethers';

// Initialize LI.FI SDK
const lifi = new LiFi({
  integrator: 'proof-of-ship-dashboard',
});

export class CrossChainUSDCService {
  constructor() {
    this.lifi = lifi;
  }

  /**
   * Get available chains for USDC transfers
   */
  async getSupportedChains() {
    try {
      const chains = await this.lifi.getChains();
      // Filter for chains that support USDC
      return chains.filter(chain => 
        chain.tokenListUrl && 
        (chain.name.toLowerCase().includes('ethereum') || 
         chain.name.toLowerCase().includes('linea') ||
         chain.name.toLowerCase().includes('polygon') ||
         chain.name.toLowerCase().includes('optimism') ||
         chain.name.toLowerCase().includes('arbitrum'))
      );
    } catch (error) {
      console.error('Error fetching supported chains:', error);
      throw error;
    }
  }

  /**
   * Get USDC token info for a specific chain
   */
  async getUSDCToken(chainId) {
    try {
      const tokens = await this.lifi.getTokens({ chains: [chainId] });
      const usdcToken = tokens.tokens[chainId]?.find(token => 
        token.symbol === 'USDC' || token.symbol === 'USDC.e'
      );
      return usdcToken;
    } catch (error) {
      console.error('Error fetching USDC token:', error);
      throw error;
    }
  }

  /**
   * Get quote for cross-chain USDC transfer
   */
  async getTransferQuote({
    fromChainId,
    toChainId,
    fromTokenAddress,
    toTokenAddress,
    fromAmount,
    fromAddress,
    toAddress
  }) {
    try {
      const quote = await this.lifi.getQuote({
        fromChain: fromChainId,
        toChain: toChainId,
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        fromAmount: fromAmount,
        fromAddress: fromAddress,
        toAddress: toAddress,
        options: {
          slippage: 0.03, // 3% slippage tolerance
          order: 'RECOMMENDED', // Get best route
        }
      });

      return {
        route: quote,
        estimatedGas: quote.estimate.gasCosts,
        estimatedTime: quote.estimate.executionDuration,
        fees: quote.estimate.feeCosts,
        toAmountMin: quote.estimate.toAmountMin,
        toAmount: quote.estimate.toAmount
      };
    } catch (error) {
      console.error('Error getting transfer quote:', error);
      throw error;
    }
  }

  /**
   * Execute cross-chain USDC transfer
   */
  async executeTransfer(route, signer) {
    try {
      // Get step transactions
      const stepTransactions = await this.lifi.getStepTransaction(route);
      
      const results = [];
      
      for (const step of stepTransactions) {
        // Execute each step transaction
        const tx = await signer.sendTransaction({
          to: step.transactionRequest.to,
          data: step.transactionRequest.data,
          value: step.transactionRequest.value || '0x0',
          gasLimit: step.transactionRequest.gasLimit,
          gasPrice: step.transactionRequest.gasPrice,
        });

        const receipt = await tx.wait();
        results.push({
          stepId: step.id,
          txHash: receipt.transactionHash,
          status: receipt.status === 1 ? 'success' : 'failed'
        });

        // Wait for step completion before proceeding
        if (step.estimate?.executionDuration) {
          await new Promise(resolve => 
            setTimeout(resolve, step.estimate.executionDuration * 1000)
          );
        }
      }

      return {
        success: true,
        results: results,
        finalTxHash: results[results.length - 1]?.txHash
      };
    } catch (error) {
      console.error('Error executing transfer:', error);
      throw error;
    }
  }

  /**
   * Check transfer status
   */
  async getTransferStatus(txHash, fromChainId) {
    try {
      const status = await this.lifi.getStatus({
        txHash: txHash,
        bridge: 'lifi', // or specific bridge used
        fromChain: fromChainId
      });

      return {
        status: status.status, // 'PENDING', 'DONE', 'FAILED'
        substatus: status.substatus,
        substatusMessage: status.substatusMessage,
        sending: status.sending,
        receiving: status.receiving,
        lifiExplorerLink: status.lifiExplorerLink
      };
    } catch (error) {
      console.error('Error checking transfer status:', error);
      throw error;
    }
  }

  /**
   * Fund developer across multiple chains
   * Automatically distributes USDC funding across preferred chains
   */
  async fundDeveloperMultichain({
    developerAddress,
    totalAmount,
    preferredChains = [1, 59144], // Ethereum, Linea
    sourceChainId = 1, // Default to Ethereum
    sourceTokenAddress
  }) {
    try {
      const results = [];
      const amountPerChain = Math.floor(totalAmount / preferredChains.length);

      for (const chainId of preferredChains) {
        if (chainId === sourceChainId) {
          // Direct transfer on same chain
          results.push({
            chainId,
            amount: amountPerChain,
            type: 'direct',
            status: 'pending'
          });
          continue;
        }

        // Cross-chain transfer
        const toToken = await this.getUSDCToken(chainId);
        if (!toToken) {
          console.warn(`USDC not found on chain ${chainId}`);
          continue;
        }

        const quote = await this.getTransferQuote({
          fromChainId: sourceChainId,
          toChainId: chainId,
          fromTokenAddress: sourceTokenAddress,
          toTokenAddress: toToken.address,
          fromAmount: amountPerChain.toString(),
          fromAddress: developerAddress,
          toAddress: developerAddress
        });

        results.push({
          chainId,
          amount: amountPerChain,
          type: 'cross-chain',
          quote: quote,
          status: 'quoted'
        });
      }

      return {
        success: true,
        distribution: results,
        totalAmount,
        chainsCount: preferredChains.length
      };
    } catch (error) {
      console.error('Error planning multichain funding:', error);
      throw error;
    }
  }

  /**
   * Get developer's USDC balances across all chains
   */
  async getDeveloperBalances(address) {
    try {
      const supportedChains = await this.getSupportedChains();
      const balances = [];

      for (const chain of supportedChains) {
        try {
          const usdcToken = await this.getUSDCToken(chain.id);
          if (!usdcToken) continue;

          // This would require RPC calls to each chain
          // For demo purposes, we'll return mock data
          balances.push({
            chainId: chain.id,
            chainName: chain.name,
            tokenAddress: usdcToken.address,
            balance: '0', // Would fetch actual balance
            symbol: usdcToken.symbol,
            decimals: usdcToken.decimals
          });
        } catch (error) {
          console.warn(`Error fetching balance for chain ${chain.id}:`, error);
        }
      }

      return balances;
    } catch (error) {
      console.error('Error fetching developer balances:', error);
      throw error;
    }
  }
}

export const crossChainUSDCService = new CrossChainUSDCService();
