import React from 'react';
import { useContractData } from '@/hooks/useContractData';
import { formatAddress } from '@/utils/web3';

export default function OnChainStats({ contract }) {
  const { contractData, isLoading, isError } = useContractData(
    contract?.address,
    contract?.network || 'mainnet'
  );

  if (!contract?.address) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">On-Chain Stats</h2>
        <p className="text-gray-500 text-sm">No contract address provided</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">On-Chain Stats</h2>
        <div className="animate-pulse flex flex-col space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (isError || !contractData) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">On-Chain Stats</h2>
        <p className="text-red-500 text-sm">Error loading contract data</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-3">On-Chain Stats</h2>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-500">Contract Address</p>
          <p className="font-mono text-sm">
            {formatAddress(contractData.address, 10, 8)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Contract Type</p>
          <p className="font-medium">
            {contractData.type === 'ERC20' ? 'Token (ERC20)' : 
             contractData.type === 'ERC721' ? 'NFT Collection (ERC721)' : 
             contractData.type === 'EOA' ? 'Account (Not a contract)' : 
             'Smart Contract'}
          </p>
        </div>
        
        {contractData.type === 'ERC20' && contractData.details && (
          <>
            <div>
              <p className="text-sm text-gray-500">Token Name</p>
              <p className="font-medium">{contractData.details.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Symbol</p>
              <p className="font-medium">{contractData.details.symbol}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Total Supply</p>
              <p className="font-medium">
                {parseFloat(contractData.details.totalSupply).toLocaleString()} {contractData.details.symbol}
              </p>
            </div>
          </>
        )}
        
        {contractData.type === 'ERC721' && contractData.details && (
          <>
            <div>
              <p className="text-sm text-gray-500">Collection Name</p>
              <p className="font-medium">{contractData.details.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Symbol</p>
              <p className="font-medium">{contractData.details.symbol}</p>
            </div>
          </>
        )}
        
        <div>
          <p className="text-sm text-gray-500">Transaction Count</p>
          <p className="font-medium">{contractData.txCount?.toLocaleString() || '0'}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Balance</p>
          <p className="font-medium">{parseFloat(contractData.balance).toFixed(4)} CELO</p>
        </div>
      </div>
    </div>
  );
}
