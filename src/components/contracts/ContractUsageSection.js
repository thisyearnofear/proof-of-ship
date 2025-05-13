import React from "react";
import { useContractNebulaAnalytics } from "@/hooks/useContractNebulaAnalytics";
import ContractUsageStats from "./ContractUsageStats";
import ContractUsageChart from "./ContractUsageChart";
import RecentTransactionsTable from "./RecentTransactionsTable";

export default function ContractUsageSection({ contract }) {
  const contractAddress = contract?.address;
  const network = contract?.network || "celo";
  const {
    analytics,
    transactions,
    loading,
    error,
    fetchAnalytics,
    hasFetched,
  } = useContractNebulaAnalytics(contractAddress, network);

  if (!contractAddress) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Contract Usage</h2>
      {!hasFetched ? (
        <div className="flex flex-col items-center justify-center py-8">
          <button
            onClick={fetchAnalytics}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-lg font-semibold"
            disabled={loading}
          >
            {loading ? "Loading Analytics..." : "Load Analytics"}
          </button>
          {error && (
            <div className="mt-4 text-red-500 text-sm">{error}</div>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-2">
            <button
              onClick={fetchAnalytics}
              className="px-4 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh Analytics"}
            </button>
          </div>
          <ContractUsageStats analytics={analytics} loading={loading} error={error} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <ContractUsageChart transactions={transactions} loading={loading} />
            <RecentTransactionsTable transactions={transactions} loading={loading} />
          </div>
        </>
      )}
    </div>
  );
}
