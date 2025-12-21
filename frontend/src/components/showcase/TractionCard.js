import { useState, useEffect } from 'react';
import DuneAnalytics from '@/lib/integrations/DuneAnalytics';

/**
 * TractionCard
 * Displays on-chain metrics for a project
 *
 * Core Principles:
 * - MODULAR: Reusable across portfolio + discovery
 * - PERFORMANT: Lazy loads metrics on demand
 * - CLEAN: No side effects on project data
 */
export default function TractionCard({ contractAddress, chain = 'ethereum' }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const data = await DuneAnalytics.getContractMetrics(contractAddress, chain);
      setMetrics(data);
      setLoading(false);
    };

    if (contractAddress) {
      fetchMetrics();
    }
  }, [contractAddress, chain]);

  if (!contractAddress) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const MetricItem = ({ label, value, formatted }) => (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-lg font-bold text-gray-900 dark:text-white mt-1">
        {formatted}
      </span>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
        On-Chain Traction
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricItem
          label="TVL"
          value={metrics.tvl}
          formatted={DuneAnalytics.formatTVL(metrics.tvl)}
        />
        <MetricItem
          label="Users"
          value={metrics.users}
          formatted={DuneAnalytics.formatNumber(metrics.users)}
        />
        <MetricItem
          label="24h Volume"
          value={metrics.volume24h}
          formatted={DuneAnalytics.formatTVL(metrics.volume24h)}
        />
        <MetricItem
          label="Holders"
          value={metrics.holders}
          formatted={DuneAnalytics.formatNumber(metrics.holders)}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Updated {new Date(metrics.lastUpdated).toLocaleDateString()}
        </span>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
          via Dune
        </span>
      </div>
    </div>
  );
}
