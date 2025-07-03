/**
 * Circle API Utilities
 * Shared utilities for Circle API integration
 */

import { Circle, CircleEnvironments } from '@circle-fin/circle-sdk';

/**
 * Initialize Circle SDK with proper configuration
 * 
 * @returns {Circle} Initialized Circle SDK instance
 * @throws {Error} If API key is not configured
 */
export function initializeCircleSDK() {
  const apiKey = process.env.CIRCLE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Circle API key not configured');
  }
  
  const environment = process.env.CIRCLE_ENVIRONMENT || 'sandbox';
  const circleEnvironment = environment.toLowerCase() === 'production'
    ? CircleEnvironments.PRODUCTION
    : CircleEnvironments.SANDBOX;
  
  return new Circle(apiKey, circleEnvironment);
}

/**
 * Format Circle API error for consistent response
 * 
 * @param {Error} error - The error from Circle API
 * @returns {Object} Formatted error object
 */
export function formatCircleError(error) {
  return {
    success: false,
    error: error.message || 'An error occurred with the Circle API',
    details: error.response?.data || {},
    status: error.response?.status || 500
  };
}

/**
 * Format token amount based on token type
 * 
 * @param {string} amount - Raw amount as string
 * @param {string} tokenSymbol - Token symbol (USDC, ETH, etc.)
 * @returns {string} Formatted amount with proper decimal display
 */
export function formatTokenAmount(amount, tokenSymbol = 'USDC') {
  // Default decimals based on token
  const decimals = {
    'USDC': 6,
    'ETH': 18,
    'MATIC': 18,
    'AVAX': 18,
    'ARB': 18
  }[tokenSymbol.toUpperCase()] || 6;
  
  // Convert to number with appropriate decimal places
  const numericAmount = parseFloat(amount) / Math.pow(10, decimals);
  
  // Format with 2 decimal places for stablecoins, 4 for others
  return numericAmount.toFixed(decimals === 6 ? 2 : 4);
}

/**
 * Generate an idempotency key for Circle API requests
 * 
 * @param {string} prefix - Prefix for the key
 * @returns {string} Unique idempotency key
 */
export function generateIdempotencyKey(prefix = 'tx') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get environment configuration for Circle API
 * 
 * @returns {Object} Environment configuration
 */
export function getCircleEnvironment() {
  return {
    environment: process.env.CIRCLE_ENVIRONMENT || 'sandbox',
    walletSetId: process.env.CIRCLE_WALLET_SET_ID,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET,
    isProduction: (process.env.CIRCLE_ENVIRONMENT || 'sandbox').toLowerCase() === 'production'
  };
}