import React, { useState } from 'react';
import { useNebulaData } from '@/hooks/useNebulaData';

/**
 * Test component for Nebula API integration
 * This component allows testing the Nebula API with different contract addresses
 */
export default function NebulaTest() {
  const [contractAddress, setContractAddress] = useState('');
  const [network, setNetwork] = useState('celo');
  const [dataTypes, setDataTypes] = useState(['analytics', 'transactions']);
  const [useMockData, setUseMockData] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // Nebula data hook
  const {
    data: nebulaData,
    loading: nebulaLoading,
    error: nebulaError,
    refresh: refreshNebulaData,
    isLoading,
    hasError
  } = useNebulaData(
    isTestRunning ? contractAddress : null,
    network,
    dataTypes,
    useMockData,
    { refreshOnMount: false } // Don't fetch on mount, only when test is run
  );

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsTestRunning(true);
    refreshNebulaData();
  };

  // Handle data type selection
  const handleDataTypeChange = (type) => {
    if (dataTypes.includes(type)) {
      setDataTypes(dataTypes.filter(t => t !== type));
    } else {
      setDataTypes([...dataTypes, type]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Nebula API Test</h2>
      
      {/* Test Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Address
            </label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Network
            </label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="celo">Celo Mainnet</option>
              <option value="alfajores">Celo Alfajores (Testnet)</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="optimism">Optimism</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="base">Base</option>
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Types
          </label>
          <div className="flex flex-wrap gap-3">
            {['analytics', 'transactions', 'price', 'priceHistory', 'holders'].map(type => (
              <label key={type} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={dataTypes.includes(type)}
                  onChange={() => handleDataTypeChange(type)}
                  className="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50 mr-1"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={useMockData}
              onChange={(e) => setUseMockData(e.target.checked)}
              className="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50 mr-1"
            />
            <span className="text-sm text-gray-700">Use Mock Data</span>
          </label>
        </div>
        
        <button
          type="submit"
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Run Test'}
        </button>
      </form>
      
      {/* Results */}
      {isTestRunning && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Results</h3>
          
          {isLoading && (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          )}
          
          {hasError && (
            <div className="text-red-500 mb-4">
              Error fetching data. Please check the console for details.
            </div>
          )}
          
          {!isLoading && !hasError && (
            <div className="space-y-4">
              {dataTypes.map(type => (
                <div key={type} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 capitalize">{type}</h4>
                  {nebulaData[type] ? (
                    <div>
                      {nebulaData[type].message && (
                        <div className="mb-2 p-2 bg-gray-50 rounded text-sm">
                          <strong>Message:</strong> {nebulaData[type].message}
                        </div>
                      )}
                      <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs">
                        {JSON.stringify(nebulaData[type], null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-gray-500">No data available</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
