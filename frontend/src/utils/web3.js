import { JsonRpcProvider, Contract, formatEther } from 'ethers';
import { NETWORK_CONFIGS } from '../config/networks';

/**
 * Get explorer URL for an address or transaction
 * @param {string} identifier - Address or transaction hash
 * @param {string|number} chainId - Chain ID or network identifier
 * @param {string} type - 'address' or 'tx'
 * @returns {string} Explorer URL
 */
export function getExplorerUrl(identifier, chainId = 44787, type = 'address') {
  const config = NETWORK_CONFIGS[chainId];
  let baseUrl = config?.explorer || 'https://celoscan.io';
  
  // Clean trailing slash if present
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  // Special handling for Solana since it uses query parameters for clusters
  if (chainId === 'sol-devnet' || chainId === 'sol') {
    const cluster = chainId === 'sol-devnet' ? '?cluster=devnet' : '';
    if (type === 'tx') {
      return `https://explorer.solana.com/tx/${identifier}${cluster}`;
    }
    return `https://explorer.solana.com/address/${identifier}${cluster}`;
  }
  
  const path = type === 'tx' ? 'tx' : 'address';
  return `${baseUrl}/${path}/${identifier}`;
}

/**
 * Create an ethers provider for the specified network
 * @param {string} network - 'mainnet' or 'testnet'
 * @returns {JsonRpcProvider} Ethers provider
 */
export function getProvider(network = 'mainnet') {
  // 42220 is Celo Mainnet, 44787 is Celo Alfajores
  const chainId = network === 'testnet' ? 44787 : 42220;
  const config = NETWORK_CONFIGS[chainId];
  const rpcUrl = config?.rpcUrl || (network === 'testnet' ? 'https://alfajores-forno.celo-testnet.org' : 'https://forno.celo.org');
  return new JsonRpcProvider(rpcUrl);
}

/**
 * Create a contract instance
 * @param {string} address - Contract address
 * @param {Array|string} abi - Contract ABI
 * @param {JsonRpcProvider} provider - Ethers provider
 * @returns {Contract} Contract instance
 */
export function getContract(address, abi, provider) {
  return new Contract(address, abi, provider);
}

/**
 * Get basic contract information
 * @param {string} address - Contract address
 * @param {string} network - 'mainnet' or 'testnet'
 * @returns {Promise<Object>} Contract information
 */
export async function getContractInfo(address, network = 'mainnet') {
  try {
    const provider = getProvider(network);
    
    // Get basic contract info
    const [code, balance] = await Promise.all([
      provider.getCode(address),
      provider.getBalance(address)
    ]);
    
    const isContract = code !== '0x';
    
    return {
      address,
      balance: formatEther(balance),
      isContract,
    };
  } catch (error) {
    console.error('Error fetching contract info:', error);
    return {
      address,
      error: error.message,
    };
  }
}

/**
 * Get transaction count for a contract
 * @param {string} address - Contract address
 * @param {string} network - 'mainnet' or 'testnet'
 * @returns {Promise<number>} Transaction count
 */
export async function getTransactionCount(address, network = 'mainnet') {
  try {
    const provider = getProvider(network);
    const count = await provider.getTransactionCount(address);
    return count;
  } catch (error) {
    console.error('Error fetching transaction count:', error);
    return 0;
  }
}

/**
 * Format an address for display (0x1234...5678)
 * @param {string} address - Full address
 * @param {number} startChars - Number of starting characters to show
 * @param {number} endChars - Number of ending characters to show
 * @returns {string} Formatted address
 */
export function formatAddress(address, startChars = 6, endChars = 4) {
  if (!address || address.length < (startChars + endChars + 3)) {
    return address;
  }
  
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

