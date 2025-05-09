import React, { useState } from "react";
import { useContractData } from "@/hooks/useContractData";
import { formatAddress, getExplorerUrl } from "@/utils/web3";
import CompactGithubActivity from "./CompactGithubActivity";
import { LinkIcon, ChartBarIcon } from "@heroicons/react/24/outline";

export default function OnChainStats({ contract, prs, releases }) {
  const { contractData, isLoading, isError } = useContractData(
    contract?.address,
    contract?.network || "mainnet"
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

  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="card">
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
          {prs && releases && (
            <button
              className={`tab ${
                activeTab === "github" ? "tab-active" : "tab-inactive"
              }`}
              onClick={() => setActiveTab("github")}
            >
              GitHub
            </button>
          )}
        </div>
      </div>

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
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">Transaction Count</p>
                <p className="font-medium">
                  {contractData.txCount?.toLocaleString() || "0"}
                </p>
              </div>

              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">Balance</p>
                <p className="font-medium">
                  {parseFloat(contractData.balance).toFixed(4)} CELO
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "github" && prs && releases && (
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
