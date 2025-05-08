/**
 * Nebula API Client
 *
 * This module provides functions to interact with the Thirdweb Nebula API
 * for retrieving blockchain data and analytics.
 *
 * API Reference: https://portal.thirdweb.com/nebula/api-reference
 */

/**
 * Send a message to the Nebula API via our API route
 *
 * @param {string} message - The message to send to Nebula
 * @param {Object} options - Additional options
 * @param {boolean} options.stream - Whether to stream the response
 * @param {string} options.sessionId - Session ID for continuing a conversation
 * @param {Object} options.context - Additional context (chainIds, walletAddress)
 * @returns {Promise<Object>} - The response from Nebula
 */
export async function sendNebulaMessage(message, options = {}) {
  try {
    const response = await fetch("/api/nebula", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        stream: options.stream || false,
        sessionId: options.sessionId,
        context: options.context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Nebula API error: ${response.status} - ${
          errorData.message || response.statusText
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending message to Nebula:", error);
    throw error;
  }
}

/**
 * Get token price data by contract address
 *
 * @param {string} contractAddress - The token contract address
 * @param {string} network - The blockchain network (e.g., 'celo', 'ethereum')
 * @returns {Promise<Object>} - Token price data
 */
export async function getTokenPriceByAddress(
  contractAddress,
  network = "celo"
) {
  const message = `Get the current price of the token at address ${contractAddress} on ${network}`;
  return sendNebulaMessage(message, {
    context: {
      chainIds: [network],
    },
  });
}

/**
 * Get token price history by contract address
 *
 * @param {string} contractAddress - The token contract address
 * @param {string} network - The blockchain network (e.g., 'celo', 'ethereum')
 * @param {string} timeframe - The timeframe for price history (e.g., '1d', '7d', '30d')
 * @returns {Promise<Object>} - Token price history data
 */
export async function getTokenPriceHistory(
  contractAddress,
  network = "celo",
  timeframe = "30d"
) {
  const message = `Get the price history for the token at address ${contractAddress} on ${network} for the last ${timeframe}`;
  return sendNebulaMessage(message, {
    context: {
      chainIds: [network],
    },
  });
}

/**
 * Get transaction history for a contract
 *
 * @param {string} contractAddress - The contract address
 * @param {string} network - The blockchain network (e.g., 'celo', 'ethereum')
 * @param {number} limit - Maximum number of transactions to return
 * @returns {Promise<Object>} - Transaction history data
 */
export async function getContractTransactionHistory(
  contractAddress,
  network = "celo",
  limit = 10
) {
  const message = `Get the last ${limit} transactions for contract ${contractAddress} on ${network}`;
  return sendNebulaMessage(message, {
    context: {
      chainIds: [network],
    },
  });
}

/**
 * Get token holders data
 *
 * @param {string} contractAddress - The token contract address
 * @param {string} network - The blockchain network (e.g., 'celo', 'ethereum')
 * @returns {Promise<Object>} - Token holders data
 */
export async function getTokenHolders(contractAddress, network = "celo") {
  const message = `Get the top token holders for the token at address ${contractAddress} on ${network}`;
  return sendNebulaMessage(message, {
    context: {
      chainIds: [network],
    },
  });
}

/**
 * Get contract analytics data
 *
 * @param {string} contractAddress - The contract address
 * @param {string} network - The blockchain network (e.g., 'celo', 'ethereum')
 * @returns {Promise<Object>} - Contract analytics data
 */
export async function getContractAnalytics(contractAddress, network = "celo") {
  const message = `Analyze the contract at address ${contractAddress} on ${network} and provide transaction volume, user growth, and other key metrics`;
  return sendNebulaMessage(message, {
    context: {
      chainIds: [network],
    },
  });
}
