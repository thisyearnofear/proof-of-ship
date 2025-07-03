import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { isAddress, formatUnits } from 'ethers';
import { getProvider, getContract, getContractInfo, getTransactionCount } from '@/utils/web3';
import { ERC20_ABI, ERC721_ABI, DETECTION_ABI } from '@/constants/abis';

/**
 * Custom hook to fetch basic contract data
 * @param {string} address - Contract address
 * @param {string} network - 'mainnet' or 'testnet'
 * @returns {Object} Contract data and loading state
 */
export function useContractData(address, network = 'mainnet') {
  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate } = useSWR(
    address ? `contract-${address}-${network}` : null,
    () => fetchContractData(address, network),
    { 
      revalidateOnFocus: false,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  return {
    contractData: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate
  };
}

/**
 * Fetch contract data including type detection
 * @param {string} address - Contract address
 * @param {string} network - 'mainnet' or 'testnet'
 * @returns {Promise<Object>} Contract data
 */
async function fetchContractData(address, network) {
  try {
    if (!address || !isAddress(address)) {
      throw new Error('Invalid contract address');
    }

    const provider = getProvider(network);
    
    // Get basic contract info
    const basicInfo = await getContractInfo(address, network);
    
    if (!basicInfo.isContract) {
      return {
        ...basicInfo,
        type: 'EOA', // Externally Owned Account (not a contract)
        txCount: await getTransactionCount(address, network)
      };
    }
    
    // Try to detect contract type
    const detectionContract = getContract(address, DETECTION_ABI, provider);
    
    // Attempt to determine if it's an ERC20 token
    let contractType = 'Unknown';
    let contractDetails = {};
    
    try {
      // Check for ERC20 token
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        detectionContract.name().catch(() => null),
        detectionContract.symbol().catch(() => null),
        detectionContract.decimals().catch(() => null),
        detectionContract.totalSupply().catch(() => null)
      ]);
      
      if (name && symbol && decimals !== null && totalSupply !== null) {
        contractType = 'ERC20';
        contractDetails = {
          name,
          symbol,
          decimals: decimals.toString(),
          totalSupply: formatUnits(totalSupply, decimals)
        };
      } else {
        // Check for ERC721 (NFT)
        const [nftName, nftSymbol, ownerOf1] = await Promise.all([
          detectionContract.name().catch(() => null),
          detectionContract.symbol().catch(() => null),
          detectionContract.ownerOf(1).catch(() => null)
        ]);
        
        if (nftName && nftSymbol) {
          contractType = 'ERC721';
          contractDetails = {
            name: nftName,
            symbol: nftSymbol
          };
        }
      }
    } catch (e) {
      console.log('Contract type detection error:', e);
    }
    
    // Get transaction count
    const txCount = await getTransactionCount(address, network);
    
    return {
      ...basicInfo,
      type: contractType,
      details: contractDetails,
      txCount
    };
  } catch (error) {
    console.error('Error in fetchContractData:', error);
    throw error;
  }
}
