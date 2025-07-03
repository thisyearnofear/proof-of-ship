import { JsonRpcProvider, Contract, formatEther } from 'ethers';

// Default Celo provider URLs
const CELO_MAINNET_RPC = 'https://forno.celo.org';
const CELO_ALFAJORES_RPC = 'https://alfajores-forno.celo-testnet.org';

/**
 * Create an ethers provider for the specified network
 * @param {string} network - 'mainnet' or 'testnet'
 * @returns {JsonRpcProvider} Ethers provider
 */
export function getProvider(network = 'mainnet') {
  const rpcUrl = network === 'testnet' ? CELO_ALFAJORES_RPC : CELO_MAINNET_RPC;
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

/**
 * Get explorer URL for an address
 * @param {string} address - Contract address
 * @param {string} network - 'mainnet' or 'testnet'
 * @returns {string} Explorer URL
 */
export function getExplorerUrl(address, network = 'mainnet') {
  const baseUrl = network === 'testnet' 
    ? 'https://alfajores.celoscan.io/address/' 
    : 'https://celoscan.io/address/';
  
  return `${baseUrl}${address}`;
}
