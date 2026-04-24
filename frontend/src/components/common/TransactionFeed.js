import React from "react";
import { useNanopayment } from "@/contexts/NanopaymentContext";

const AGENT_LABELS = {
  underwrite: { icon: "🤖", name: "AI Underwriter", color: "text-blue-600" },
  scout: { icon: "🔍", name: "AI Scout", color: "text-teal-600" },
  verify: { icon: "✅", name: "Verifier", color: "text-purple-600" },
  rebalance: { icon: "🔄", name: "Rebalance", color: "text-orange-600" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function TransactionFeed({ maxItems = 8, compact = false }) {
  const { transactions, isInitialized } = useNanopayment();

  if (!isInitialized || transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          ⚡ Live Transaction Feed
        </h3>
        <div className="text-center py-6">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            No transactions yet. Try an AI agent on the{" "}
            <a href="/back" className="text-teal-600 hover:underline">
              Back
            </a>{" "}
            page to see payments here.
          </p>
        </div>
      </div>
    );
  }

  const items = transactions.slice(0, maxItems);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          ⚡ Live Transaction Feed
        </h3>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {transactions.length} total
        </span>
      </div>
      <div className="space-y-2">
        {items.map((tx, i) => {
          const agent = AGENT_LABELS[tx.type] || {
            icon: "💸",
            name: tx.type,
            color: "text-gray-600",
          };
          return (
            <div
              key={tx.id || i}
              className={`flex items-center gap-3 py-2 ${
                i < items.length - 1
                  ? "border-b border-gray-100 dark:border-gray-700"
                  : ""
              } ${i === 0 ? "animate-pulse" : ""}`}
            >
              <span className="text-lg flex-shrink-0">{agent.icon}</span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-medium ${agent.color} truncate`}
                >
                  {agent.name}
                </p>
                {!compact && tx.description && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                    {tx.description}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  -${parseFloat(tx.amount || 0).toFixed(3)}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {tx.timestamp ? timeAgo(tx.timestamp) : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {transactions.length > maxItems && (
        <a
          href="/back"
          className="block text-center text-xs text-teal-600 hover:underline mt-3 pt-2 border-t border-gray-100 dark:border-gray-700"
        >
          View all {transactions.length} transactions →
        </a>
      )}
    </div>
  );
}
