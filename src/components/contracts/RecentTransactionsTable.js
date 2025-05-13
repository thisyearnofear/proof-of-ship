import React from "react";

export default function RecentTransactionsTable({ transactions, loading }) {
  if (loading) return <div className="py-6 text-center text-gray-400">Loading transactions…</div>;
  if (!transactions || transactions.length === 0)
    return <div className="py-6 text-center text-gray-400">No recent transactions.</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
      <div className="text-md font-semibold mb-2">Recent Transactions</div>
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-2 py-1 text-left">Hash</th>
            <th className="px-2 py-1 text-left">Method</th>
            <th className="px-2 py-1 text-right">Value</th>
            <th className="px-2 py-1 text-right">Time</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.hash} className="border-b last:border-0">
              <td className="px-2 py-1 truncate max-w-[120px]">
                <a
                  href={`https://celoscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {tx.hash.slice(0, 8)}…
                </a>
              </td>
              <td className="px-2 py-1">{tx.method || "-"}</td>
              <td className="px-2 py-1 text-right">{tx.value || "-"}</td>
              <td className="px-2 py-1 text-right">
                {tx.timestamp
                  ? new Date(tx.timestamp * 1000).toLocaleString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
