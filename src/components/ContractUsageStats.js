import React from "react";
import StatCard from "@/components/StatCard";
import { ArrowTrendingUpIcon, UserIcon, ChartBarIcon } from "@heroicons/react/24/outline";

export default function ContractUsageStats({ analytics, loading, error }) {
  
  if (error) return <div className="py-6 text-center text-red-500">{error}</div>;
  if (!analytics) return <div className="py-6 text-center text-gray-400">No analytics available.</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <StatCard loading={loading} title="Total Transactions"
        value={analytics.totalTransactions ?? "-"}
        icon={<ChartBarIcon className="w-6 h-6" />}
      />
      <StatCard loading={loading} title="Unique Users"
        value={analytics.uniqueUsers ?? "-"}
        icon={<UserIcon className="w-6 h-6" />}
      />
      <StatCard loading={loading} title="Volume"
        value={analytics.transactionVolume ?? "-"}
        icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
      />
      <StatCard loading={loading} title="Contract Age"
        value={analytics.contractAge ?? "-"}
        icon={<ChartBarIcon className="w-6 h-6" />}
      />
    </div>
  );
}

