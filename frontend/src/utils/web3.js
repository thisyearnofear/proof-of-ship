import { createPublicClient, http, formatEther, getContract as viemGetContract, parseAbi } from 'viem';
import { celo, celoAlfajores } from 'viem/chains';
import { NETWORK_CONFIGS } from '../config/networks';

/**
 * Get explorer URL for an address or transaction
 */
export function getExplorerUrl(identifier, chainId = 44787, type = 'address') {
  const config = NETWORK_CONFIGS[chainId];
  let baseUrl = config?.explorer || 'https://celoscan.io';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

  if (chainId === 'sol-devnet' || chainId === 'sol') {
    const cluster = chainId === 'sol-devnet' ? '?cluster=devnet' : '';
    if (type === 'tx') return `https://explorer.solana.com/tx/${identifier}${cluster}`;
    return `https://explorer.solana.com/address/${identifier}${cluster}`;
  }

  const path = type === 'tx' ? 'tx' : 'address';
  return `${baseUrl}/${path}/${identifier}`;
}

/**
 * Create a viem public client for the specified network
 */
export function getProvider(network = 'mainnet') {
  const chain = network === 'testnet' ? celoAlfajores : celo;
  const chainId = network === 'testnet' ? 44787 : 42220;
  const config = NETWORK_CONFIGS[chainId];
  const rpcUrl = config?.rpcUrl || (network === 'testnet' ? 'https://alfajores-forno.celo-testnet.org' : 'https://forno.celo.org');
  return createPublicClient({ chain, transport: http(rpcUrl) });
}

/**
 * Create a contract instance (viem getContract wrapper)
 */
export function getContract(address, abi, client) {
  const parsedAbi = Array.isArray(abi) && typeof abi[0] === 'string' ? parseAbi(abi) : abi;
  return viemGetContract({ address, abi: parsedAbi, client });
}

/**
 * Get basic contract information
 */
export async function getContractInfo(address, network = 'mainnet') {
  try {
    const client = getProvider(network);
    const [code, balance] = await Promise.all([
      client.getCode({ address }),
      client.getBalance({ address }),
    ]);
    const isContract = code !== '0x' && code !== undefined;
    return { address, balance: formatEther(balance), isContract };
  } catch (error) {
    console.error('Error fetching contract info:', error);
    return { address, error: error.message };
  }
}
