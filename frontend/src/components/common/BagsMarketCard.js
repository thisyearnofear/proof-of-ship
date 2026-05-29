/**
 * BagsMarketCard
 *
 * Displays live Bags token market data for a project — lifetime fees,
 * creator distribution, and recent claim activity.
 *
 * Uses the useBagsTokenData hook which fetches from the server-side proxy.
 * Falls back gracefully if the token has no data or Bags isn't configured.
 */

import React from 'react';
import { Card } from './Card';
import { LoadingSpinner } from './LoadingStates';
import useBagsTokenData from '@/hooks/useBagsTokenData';
import {
  CurrencyDollarIcon,
  UsersIcon,
  ReceiptPercentIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

export default function BagsMarketCard({ mint }) {
  const { lifetimeFees, creators, claimEvents, loading, error } = useBagsTokenData(mint);

  if (!mint) return null;

  if (loading) {
    return (
      <Card className="p-4">
        <LoadingSpinner size="sm" />
      </Card>
    );
  }

  // No data — Bags SDK not configured or token has no activity
  if (lifetimeFees === null && creators.length === 0 && claimEvents.length === 0) {
    if (error) {
      return (
        <Card className="p-4 bg-gray-50 border-dashed border-gray-200">
          <p className="text-xs text-gray-500 dark:text-gray-400">Token market data unavailable</p>
        </Card>
      );
    }
    return null;
  }

  const totalClaimed = creators.reduce((sum, c) => sum + (parseInt(c.totalClaimed || '0') || 0), 0);
  const totalCreators = creators.length;
  const recentClaims = claimEvents.length;

  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-1.5">
          <ReceiptPercentIcon className="w-4 h-4" />
          Bags Token Stats
        </h4>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 px-1.5 py-0.5 rounded">LIVE</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-0.5">Lifetime Fees</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {lifetimeFees != null ? `${(lifetimeFees / 1_000_000).toFixed(2)} SOL` : '—'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-0.5">Creators</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-1">
            <UsersIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            {totalCreators}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-0.5">Claims</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{recentClaims}</p>
        </div>
      </div>

      {creators.length > 0 && (
        <div className="border-t border-emerald-100 pt-2 mt-1">
          <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1.5">Creator Distribution</p>
          <div className="space-y-1">
            {creators.slice(0, 5).map((creator, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                  {creator.username || creator.providerUsername || `Creator ${i + 1}`}
                </span>
                <span className="text-gray-500 dark:text-gray-400 font-mono">
                  {creator.royaltyBps ? `${(creator.royaltyBps / 100).toFixed(1)}%` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalClaimed > 0 && (
        <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between">
          <p className="text-[9px] text-gray-500 dark:text-gray-400">
            Total claimed: {(totalClaimed / 1_000_000).toFixed(2)} SOL
          </p>
          <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
      )}
    </Card>
  );
}
