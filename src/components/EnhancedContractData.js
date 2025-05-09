import React, { useState } from "react";
import { useContractData } from "@/hooks/useContractData";
import { useNebulaData } from "@/hooks/useNebulaData";
import { formatAddress, getExplorerUrl } from "@/utils/web3";
import CompactGithubActivity from "./CompactGithubActivity";
import {
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentChartBarIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

/**
 * Enhanced Contract Data Component
 * Displays detailed contract information with improved UI/UX
 * Will be expanded with Thirdweb Nebula or Alchemy MCP Server integration
 */
export default function EnhancedContractData({ contract, prs, releases }) {
  const [activeTab, setActiveTab] = useState("overview");
  const { contractData, isLoading, isError } = useContractData(
    contract?.address,
    contract?.network || "mainnet"
  );

  // Fetch Nebula data for analytics and transactions
  // Using mock data for now until we have the API properly set up
  const {
    data: nebulaData,
    loading: nebulaLoading,
    error: nebulaError,
  } = useNebulaData(
    contract?.address,
    contract?.network || "celo",
    ["analytics", "transactions"],
    true // Use mock data
  );

  if (!contract?.address) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Contract Analytics</h2>
        <p className="text-gray-500 text-sm">No contract address provided</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Contract Analytics</h2>
        <div className="animate-pulse flex flex-col space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !contractData) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Contract Analytics</h2>
        <p className="text-red-500 text-sm">Error loading contract data</p>
      </div>
    );
  }

  // Mock data for demonstration purposes
  // In the real implementation, this would come from Thirdweb Nebula or Alchemy MCP Server
  const mockData = {
    transactionVolume: "12,345",
    uniqueUsers: "567",
    dailyTransactions: "89",
    priceImpact: "0.05%",
    tokenHolders: "789",
    recentActivity: [
      { date: "2025-05-07", txCount: 12, volume: "1,234" },
      { date: "2025-05-06", txCount: 15, volume: "2,345" },
      { date: "2025-05-05", txCount: 8, volume: "987" },
      { date: "2025-05-04", txCount: 10, volume: "1,456" },
      { date: "2025-05-03", txCount: 14, volume: "2,123" },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header with tabs */}
      <div className="border-b">
        <div className="tabs">
          <button
            className={`tab ${
              activeTab === "overview" ? "tab-active" : "tab-inactive"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Contract
          </button>
          <button
            className={`tab ${
              activeTab === "activity" ? "tab-active" : "tab-inactive"
            }`}
            onClick={() => setActiveTab("activity")}
          >
            Activity
          </button>
          <button
            className={`tab ${
              activeTab === "analytics" ? "tab-active" : "tab-inactive"
            }`}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </button>
          <button
            className={`tab ${
              activeTab === "github" ? "tab-active" : "tab-inactive"
            }`}
            onClick={() => setActiveTab("github")}
          >
            GitHub
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="p-4">
        {activeTab === "overview" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Contract Overview</h2>
              <a
                href={getExplorerUrl(
                  contract.address,
                  contract.network || "mainnet"
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-700 text-sm flex items-center"
              >
                <LinkIcon className="icon-xs mr-1" />
                View on Explorer
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">Contract Address</p>
                <p className="font-mono text-sm">
                  {formatAddress(contractData.address, 10, 8)}
                </p>
              </div>

              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">Contract Type</p>
                <p className="font-medium">
                  {contractData.type === "ERC20"
                    ? "Token (ERC20)"
                    : contractData.type === "ERC721"
                    ? "NFT Collection (ERC721)"
                    : contractData.type === "EOA"
                    ? "Account (Not a contract)"
                    : "Smart Contract"}
                </p>
              </div>
            </div>

            {/* Token-specific information */}
            {contractData.type === "ERC20" && contractData.details && (
              <div className="border rounded-lg p-4 mb-4">
                <h3 className="text-md font-medium mb-3">Token Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      {parseFloat(
                        contractData.details.totalSupply
                      ).toLocaleString()}{" "}
                      {contractData.details.symbol}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Holders</p>
                    <p className="font-medium">{mockData.tokenHolders}</p>
                  </div>
                </div>
              </div>
            )}

            {/* NFT-specific information */}
            {contractData.type === "ERC721" && contractData.details && (
              <div className="border rounded-lg p-4 mb-4">
                <h3 className="text-md font-medium mb-3">
                  NFT Collection Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Collection Name</p>
                    <p className="font-medium">{contractData.details.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Symbol</p>
                    <p className="font-medium">{contractData.details.symbol}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                title="Transactions"
                value={contractData.txCount?.toLocaleString() || "0"}
                icon={<ArrowPathIcon className="w-5 h-5" />}
                trend="+12%"
              />

              <MetricCard
                title="Volume"
                value={mockData.transactionVolume}
                icon={<CurrencyDollarIcon className="w-5 h-5" />}
                trend="+5%"
              />

              <MetricCard
                title="Users"
                value={mockData.uniqueUsers}
                icon={<UserGroupIcon className="w-5 h-5" />}
                trend="+8%"
              />

              <MetricCard
                title="Daily Txs"
                value={mockData.dailyTransactions}
                icon={<ChartBarIcon className="w-5 h-5" />}
                trend="+3%"
              />
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

            {nebulaLoading.transactions ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ) : nebulaError.transactions ? (
              <div className="border rounded-lg p-4 text-center">
                <p className="text-red-500">
                  Error loading transaction data. Please try again later.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {nebulaError.transactions}
                </p>
              </div>
            ) : nebulaData.transactions ? (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction Hash
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Parse and display Nebula transaction data */}
                      {Array.isArray(nebulaData.transactions.transactions)
                        ? nebulaData.transactions.transactions
                            .slice(0, 10)
                            .map((tx, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                  <a
                                    href={`https://celoscan.io/tx/${tx.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                  >
                                    {formatAddress(tx.hash, 6, 4)}
                                  </a>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(
                                    tx.timestamp * 1000
                                  ).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {tx.method || "Transfer"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {tx.value
                                    ? `${parseFloat(tx.value).toFixed(4)} CELO`
                                    : "-"}
                                </td>
                              </tr>
                            ))
                        : // Fallback to mock data if Nebula data format is unexpected
                          mockData.recentActivity.map((activity, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {activity.date}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {activity.txCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {activity.volume}
                              </td>
                              <td></td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-center">
                  <a
                    href={`https://celoscan.io/address/${contract.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    View All Activity
                  </a>
                </div>
              </>
            ) : (
              // Fallback to mock data if no Nebula data is available
              <>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transactions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mockData.recentActivity.map((activity, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {activity.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {activity.txCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {activity.volume}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-center">
                  <button className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                    View All Activity
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Analytics</h2>

            {nebulaLoading.analytics ? (
              <div className="animate-pulse space-y-4">
                <div className="h-40 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : nebulaError.analytics ? (
              <div className="border rounded-lg p-4 text-center">
                <p className="text-red-500">
                  Error loading analytics data. Please try again later.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {nebulaError.analytics}
                </p>
              </div>
            ) : nebulaData.analytics ? (
              <>
                <div className="border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-700 font-medium">
                      Transaction Volume
                    </p>
                    <div className="text-xs text-gray-500">
                      Data from Nebula API
                    </div>
                  </div>

                  {/* Display analytics data from Nebula */}
                  <div className="space-y-4">
                    {/* Parse and display key metrics from Nebula analytics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="border rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Total Transactions
                        </p>
                        <p className="font-medium">
                          {nebulaData.analytics.totalTransactions ||
                            contractData.txCount?.toLocaleString() ||
                            "0"}
                        </p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-xs text-gray-500">Unique Users</p>
                        <p className="font-medium">
                          {nebulaData.analytics.uniqueUsers ||
                            mockData.uniqueUsers}
                        </p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-xs text-gray-500">Avg. Daily Txs</p>
                        <p className="font-medium">
                          {nebulaData.analytics.avgDailyTransactions ||
                            mockData.dailyTransactions}
                        </p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-xs text-gray-500">Contract Age</p>
                        <p className="font-medium">
                          {nebulaData.analytics.contractAge || "3 months"}
                        </p>
                      </div>
                    </div>

                    {/* Transaction volume chart placeholder */}
                    <div className="h-40 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-400">
                        Transaction volume chart will be implemented with
                        chart.js
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-700 font-medium mb-2">
                      User Growth
                    </p>
                    <div className="h-32 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-400">User growth chart</p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-700 font-medium mb-2">
                      Token Distribution
                    </p>
                    <div className="h-32 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-400">Token distribution chart</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Fallback to placeholder UI if no Nebula data is available
              <>
                <div className="border rounded-lg p-4 mb-4 text-center">
                  <p className="text-gray-500 mb-2">Transaction Volume Chart</p>
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-400">
                      Chart will be implemented with Thirdweb Nebula or Alchemy
                      MCP data
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-gray-500 mb-2">User Growth</p>
                    <div className="h-32 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-400">User growth chart</p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-gray-500 mb-2">Token Distribution</p>
                    <div className="h-32 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-400">Token distribution chart</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "github" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">GitHub Activity</h2>

            {/* GitHub Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">All Time Downloads</p>
                <p className="font-medium">0</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">Open Issues</p>
                <p className="font-medium">
                  {prs?.filter((pr) => !pr.pull_request)?.length || 0}
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">Open PRs</p>
                <p className="font-medium">
                  {prs?.filter((pr) => pr.state === "open")?.length || 0}
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">Latest Version</p>
                <p className="font-medium">
                  {releases?.[0]?.tag_name || "v0.0.0"}
                </p>
              </div>
            </div>

            {/* Recent PRs */}
            <div className="border rounded-lg p-4 mb-4">
              <h3 className="text-md font-medium mb-3">Recent Pull Requests</h3>
              {prs && prs.length > 0 ? (
                <div className="space-y-3">
                  {prs.slice(0, 5).map((pr) => (
                    <div
                      key={pr.id}
                      className="flex items-center space-x-3 text-sm border-b pb-2"
                    >
                      <img
                        src={pr.user.avatar_url}
                        alt={pr.user.login}
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 truncate block"
                        >
                          {pr.title}
                        </a>
                        <span className="text-xs text-gray-500">
                          #{pr.number} by {pr.user.login}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          pr.state === "open"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {pr.state}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No pull requests found</p>
              )}
            </div>

            {/* Latest Release */}
            <div className="border rounded-lg p-4">
              <h3 className="text-md font-medium mb-3">Latest Release</h3>
              {releases && releases.length > 0 ? (
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <a
                        href={releases[0].html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {releases[0].name || releases[0].tag_name}
                      </a>
                      <p className="text-xs text-gray-500 mt-1">
                        Released on{" "}
                        {new Date(
                          releases[0].published_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {releases[0].tag_name}
                    </span>
                  </div>

                  {releases[0].assets && releases[0].assets.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Downloads</p>
                      {releases[0].assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="flex justify-between text-sm"
                        >
                          <span>{asset.name}</span>
                          <span className="font-medium">
                            {asset.download_count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No releases found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for metrics
function MetricCard({ title, value, icon, trend }) {
  return (
    <div className="metric-card">
      <div className="flex justify-between items-start mb-2">
        <div className="metric-icon">
          <div className="icon-sm">{icon}</div>
        </div>
        {trend && (
          <div className="flex items-center text-green-600 text-xs">
            <ArrowTrendingUpIcon className="icon-xs mr-0.5" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <p className="metric-title">{title}</p>
      <p className="metric-value">{value}</p>
    </div>
  );
}
