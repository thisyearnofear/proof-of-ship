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

    const data = await response.json();

    // Process and extract structured data from the response
    // Nebula returns both a message (text) and potentially actions
    return {
      rawResponse: data,
      message: data.message,
      actions: data.actions || [],
      sessionId: data.session_id || data.sessionId,
      requestId: data.request_id || data.requestId,
      // Try to extract structured data from the message using regex or simple parsing
      // This is a fallback if the API doesn't return structured data in actions
      extractedData: extractStructuredDataFromMessage(data.message),
    };
  } catch (error) {
    console.error("Error sending message to Nebula:", error);
    throw error;
  }
}

/**
 * Extract structured data from Nebula's text response
 * This is a helper function to parse the natural language response
 * into structured data when possible
 *
 * @param {string} message - The message from Nebula
 * @returns {Object} - Extracted structured data
 */
function extractStructuredDataFromMessage(message) {
  if (!message) return {};

  const data = {};

  // Extract token price if present
  const priceMatch = message.match(/current price.*?(\$[\d,.]+)/i);
  if (priceMatch && priceMatch[1]) {
    data.price = priceMatch[1];
  }

  // Extract transaction count if present
  const txCountMatch = message.match(/(\d+[\d,]*)\s*transactions/i);
  if (txCountMatch && txCountMatch[1]) {
    data.transactionCount = txCountMatch[1].replace(/,/g, "");
  }

  // Extract unique users/holders if present
  const usersMatch =
    message.match(/(\d+[\d,]*)\s*unique users/i) ||
    message.match(/(\d+[\d,]*)\s*holders/i);
  if (usersMatch && usersMatch[1]) {
    data.uniqueUsers = usersMatch[1].replace(/,/g, "");
  }

  // Extract volume if present
  const volumeMatch = message.match(/volume of\s*([\d,.]+)\s*([A-Z]{3,4})/i);
  if (volumeMatch && volumeMatch[1]) {
    data.volume = {
      amount: volumeMatch[1].replace(/,/g, ""),
      currency: volumeMatch[2],
    };
  }

  return data;
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
  const message = `Get the current price of the token at address ${contractAddress} on ${network}. Return the price in USD.`;
  const response = await sendNebulaMessage(message, {
    context: {
      chainIds: [getChainId(network)],
    },
  });

  // Process the response to extract structured price data
  return {
    price: response.extractedData.price,
    message: response.message,
    rawData: response.rawResponse,
  };
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
  const message = `Get the price history for the token at address ${contractAddress} on ${network} for the last ${timeframe}. Format the data as a JSON array of {date, price} objects.`;
  const response = await sendNebulaMessage(message, {
    context: {
      chainIds: [getChainId(network)],
    },
  });

  // Try to extract price history data from the response
  let priceHistory = [];
  try {
    // Look for JSON in the message
    const jsonMatch =
      response.message.match(/```json\n([\s\S]*?)\n```/) ||
      response.message.match(/```\n([\s\S]*?)\n```/);

    if (jsonMatch && jsonMatch[1]) {
      priceHistory = JSON.parse(jsonMatch[1]);
    }
  } catch (error) {
    console.error("Error parsing price history data:", error);
  }

  return {
    history: priceHistory,
    message: response.message,
    rawData: response.rawResponse,
  };
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
  const message = `Get the last ${limit} transactions for contract ${contractAddress} on ${network}. Format the data as a JSON array of transaction objects with hash, timestamp, method, and value fields.`;
  const response = await sendNebulaMessage(message, {
    context: {
      chainIds: [getChainId(network)],
    },
  });

  // Try to extract transaction data from the response
  let transactions = [];
  try {
    // Look for JSON in the message
    const jsonMatch =
      response.message.match(/```json\n([\s\S]*?)\n```/) ||
      response.message.match(/```\n([\s\S]*?)\n```/);

    if (jsonMatch && jsonMatch[1]) {
      transactions = JSON.parse(jsonMatch[1]);
    }
  } catch (error) {
    console.error("Error parsing transaction data:", error);
  }

  return {
    transactions,
    message: response.message,
    rawData: response.rawResponse,
  };
}

/**
 * Get token holders data
 *
 * @param {string} contractAddress - The token contract address
 * @param {string} network - The blockchain network (e.g., 'celo', 'ethereum')
 * @returns {Promise<Object>} - Token holders data
 */
export async function getTokenHolders(contractAddress, network = "celo") {
  const message = `Get the top token holders for the token at address ${contractAddress} on ${network}. Format the data as a JSON array of {address, balance, percentage} objects.`;
  const response = await sendNebulaMessage(message, {
    context: {
      chainIds: [getChainId(network)],
    },
  });

  // Try to extract holders data from the response
  let holders = [];
  try {
    // Look for JSON in the message
    const jsonMatch =
      response.message.match(/```json\n([\s\S]*?)\n```/) ||
      response.message.match(/```\n([\s\S]*?)\n```/);

    if (jsonMatch && jsonMatch[1]) {
      holders = JSON.parse(jsonMatch[1]);
    }
  } catch (error) {
    console.error("Error parsing holders data:", error);
  }

  return {
    holders,
    message: response.message,
    rawData: response.rawResponse,
  };
}

/**
 * Get contract analytics data
 *
 * @param {string} contractAddress - The contract address
 * @param {string} network - The blockchain network (e.g., 'celo', 'ethereum')
 * @returns {Promise<Object>} - Contract analytics data
 */
export async function getContractAnalytics(contractAddress, network = "celo") {
  const message = `Analyze the contract at address ${contractAddress} on ${network} and provide transaction volume, user growth, and other key metrics. Format the data as a JSON object with totalTransactions, uniqueUsers, avgDailyTransactions, contractAge, transactionVolume, and priceImpact fields.`;
  const response = await sendNebulaMessage(message, {
    context: {
      chainIds: [getChainId(network)],
    },
  });

  // Try to extract analytics data from the response
  let analytics = {};
  try {
    // Look for JSON in the message
    const jsonMatch =
      response.message.match(/```json\n([\s\S]*?)\n```/) ||
      response.message.match(/```\n([\s\S]*?)\n```/);

    if (jsonMatch && jsonMatch[1]) {
      analytics = JSON.parse(jsonMatch[1]);
    } else {
      // Fallback to extracted data
      analytics = {
        totalTransactions: response.extractedData.transactionCount,
        uniqueUsers: response.extractedData.uniqueUsers,
        transactionVolume: response.extractedData.volume
          ? `${response.extractedData.volume.amount} ${response.extractedData.volume.currency}`
          : undefined,
      };
    }
  } catch (error) {
    console.error("Error parsing analytics data:", error);
  }

  return {
    analytics,
    message: response.message,
    rawData: response.rawResponse,
  };
}

/**
 * Helper function to get chain ID from network name
 *
 * @param {string} network - Network name (e.g., 'celo', 'ethereum')
 * @returns {number|string} - Chain ID
 */
function getChainId(network) {
  const chainIds = {
    ethereum: 1,
    goerli: 5,
    sepolia: 11155111,
    polygon: 137,
    mumbai: 80001,
    optimism: 10,
    arbitrum: 42161,
    base: 8453,
    celo: 42220,
    alfajores: 44787,
    avalanche: 43114,
    bsc: 56,
    fantom: 250,
  };

  return chainIds[network.toLowerCase()] || network;
}
