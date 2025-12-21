import { useState, useEffect } from 'react';
import GitHubAnalytics from '@/lib/integrations/GitHubAnalytics';

/**
 * DeveloperCredibilityCard
 * Displays GitHub metrics showing developer commit consistency and code quality
 *
 * Core Principles:
 * - MODULAR: Reusable across portfolio + discovery
 * - PERFORMANT: Lazy loads metrics on demand
 * - CLEAN: No side effects on project data
 */
export default function DeveloperCredibilityCard({ owner, repo }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const data = await GitHubAnalytics.getRepoMetrics(owner, repo);
      setMetrics(data);
      setLoading(false);
    };

    if (owner && repo) {
      fetchMetrics();
    }
  }, [owner, repo]);

  if (!owner || !repo) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const activityLevel = GitHubAnalytics.getActivityLevel(metrics.commitsWeek);
  const qualityLevel = GitHubAnalytics.getQualityLevel(metrics.testCoverage);

  const getActivityColor = (level) => {
    const colors = {
      'very-active': 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
      'active': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
      'moderate': 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
      'low': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
      'inactive': 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20',
    };
    return colors[level] || colors.inactive;
  };

  const getQualityColor = (level) => {
    const colors = {
      'excellent': 'text-green-600 dark:text-green-400',
      'good': 'text-blue-600 dark:text-blue-400',
      'fair': 'text-yellow-600 dark:text-yellow-400',
      'needs-improvement': 'text-red-600 dark:text-red-400',
      'unknown': 'text-gray-600 dark:text-gray-400',
    };
    return colors[level] || colors.unknown;
  };

  const MetricItem = ({ label, value, badge = null }) => (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-lg font-bold text-gray-900 dark:text-white">{value}</span>
        {badge && <span className={`text-xs font-semibold px-2 py-1 rounded ${badge}`}>{badge}</span>}
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
        Developer Credibility
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricItem
          label="Commits (Weekly)"
          value={metrics.commitsWeek}
          badge={activityLevel.toUpperCase()}
        />
        <MetricItem
          label="PRs Merged (Monthly)"
          value={metrics.prsMerged}
        />
        <MetricItem
          label="Test Coverage"
          value={`${metrics.testCoverage}%`}
          badge={qualityLevel.toUpperCase()}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {owner}/{repo}
            </span>
          </div>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            via GitHub
          </span>
        </div>
      </div>

      {/* Activity indicator bar */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className={`p-3 rounded text-sm font-medium ${getActivityColor(activityLevel)}`}>
          {activityLevel === 'very-active' && '🔥 Very Active Development'}
          {activityLevel === 'active' && '✅ Active Development'}
          {activityLevel === 'moderate' && '📌 Moderate Activity'}
          {activityLevel === 'low' && '⚠️ Low Activity'}
          {activityLevel === 'inactive' && '⛔ No Recent Activity'}
        </div>
      </div>
    </div>
  );
}
