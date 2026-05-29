/**
 * StructuredUpdateCard — type-specific renderer for project updates
 *
 * Renders each update type with a specific visual treatment based on
 * signal weight. High-signal updates (milestone, revenue, users, launch)
 * get prominent display. Low-signal (bugfix, development) is compact.
 */

import React from 'react';
import { Card } from '@/components/common/Card';
import {
  TrophyIcon,
  ChartBarIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  HandRaisedIcon,
  CurrencyDollarIcon,
  CubeIcon,
  ChatBubbleLeftRightIcon,
  WrenchIcon,
  BugAntIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

// Update type configuration
const UPDATE_TYPES = {
  milestone: {
    icon: TrophyIcon,
    label: 'Milestone',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    weight: 'high',
  },
  revenue: {
    icon: ChartBarIcon,
    label: 'Revenue',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50',
    border: 'border-green-200',
    weight: 'high',
  },
  users: {
    icon: UserGroupIcon,
    label: 'Users',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    weight: 'high',
  },
  launch: {
    icon: RocketLaunchIcon,
    label: 'Launch',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    weight: 'high',
  },
  partnership: {
    icon: HandRaisedIcon,
    label: 'Partnership',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    weight: 'high',
  },
  funding: {
    icon: CurrencyDollarIcon,
    label: 'Funding',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    weight: 'high',
  },
  product: {
    icon: CubeIcon,
    label: 'Product',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    weight: 'medium',
  },
  community: {
    icon: ChatBubbleLeftRightIcon,
    label: 'Community',
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    weight: 'medium',
  },
  development: {
    icon: WrenchIcon,
    label: 'Development',
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    weight: 'low',
  },
  bugfix: {
    icon: BugAntIcon,
    label: 'Bug Fix',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50',
    border: 'border-red-200',
    weight: 'low',
  },
};

export { UPDATE_TYPES };

export default function StructuredUpdateCard({ update, isCompact }) {
  const config = UPDATE_TYPES[update.type] || UPDATE_TYPES.development;
  const Icon = config.icon;
  const metrics = update.metrics || {};

  if (isCompact && config.weight === 'low') {
    // Compact mode for low-signal updates
    return (
      <div className="flex items-start gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
        <Icon className={`w-4 h-4 ${config.color} mt-0.5 flex-shrink-0`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-700 dark:text-gray-300">{update.message}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {update.userHandle} · {formatTime(update.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative pl-10 ${isCompact ? 'mb-2' : 'mb-6'}`}>
      {/* Timeline dot */}
      <div className={`absolute left-0 top-1 w-8 h-8 ${config.bg} rounded-full border-2 ${config.border} flex items-center justify-center z-10`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>

      <div>
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>
            {config.label}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {update.userHandle} · {formatTime(update.timestamp)}
          </span>
          {config.weight === 'high' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
              High signal
            </span>
          )}
        </div>

        {/* Metric badges */}
        {Object.keys(metrics).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {Object.entries(metrics).map(([key, val]) => {
              if (val == null || val === '') return null;
              const formatted = typeof val === 'number'
                ? (key === 'revenue' || key === 'mrr' || key === 'arr'
                  ? `$${val.toLocaleString()}`
                  : val.toLocaleString())
                : val;
              return (
                <span key={key} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:text-gray-300">
                  {formatMetricKey(key)}: {formatted}
                </span>
              );
            })}
          </div>
        )}

        {/* Message */}
        <div className={`bg-white p-3 rounded-lg border border-gray-100 shadow-sm ${config.border}`}>
          <p className="text-sm text-gray-700 dark:text-gray-300">{update.message}</p>
        </div>
      </div>
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function formatMetricKey(key) {
  const map = {
    mrr: 'MRR',
    arr: 'ARR',
    users: 'Users',
    dau: 'DAU',
    wau: 'WAU',
    mau: 'MAU',
    revenue: 'Revenue',
    transactions: 'Txs',
    tvl: 'TVL',
    customers: 'Customers',
    retention: 'Retention',
    nps: 'NPS',
    growth: 'Growth',
  };
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
}
