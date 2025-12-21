/**
 * Campaign Card Component
 * Displays campaign summary for discovery/listing pages
 * Minimal, reusable, no duplication with existing patterns
 */

import { useState } from 'react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ClockIcon, CurrencyDollarIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * @param {Object} campaign - Campaign data
 * @param {Function} onJoin - Callback when user clicks Join button
 * @param {boolean} showApplied - Show if user already applied (optional)
 */
export default function CampaignCard({ campaign, onJoin, showApplied = false }) {
  const [hovering, setHovering] = useState(false);

  const daysUntilDeadline = Math.ceil(
    (new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const isDeadlineSoon = daysUntilDeadline <= 3;
  const isExpired = daysUntilDeadline < 0;

  const submissionProgress = campaign.stats?.totalSubmissions || 0;
  const maxSubmissions = campaign.maxSubmissions || 50;
  const progressPercent = Math.min((submissionProgress / maxSubmissions) * 100, 100);

  return (
    <Card
      className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-2">
          {campaign.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {campaign.description}
        </p>
      </div>

      {/* Project + Difficulty Badge */}
      <div className="px-4 flex items-center gap-2 mb-3">
        {campaign.projectName && (
          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
            {campaign.projectName}
          </span>
        )}
        {campaign.eligibility?.minLevel && (
          <span className={`text-xs px-2 py-1 rounded font-medium ${
            campaign.eligibility.minLevel === 'expert'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : campaign.eligibility.minLevel === 'intermediate'
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          }`}>
            {campaign.eligibility.minLevel.charAt(0).toUpperCase() + campaign.eligibility.minLevel.slice(1)}
          </span>
        )}
      </div>

      {/* Submission Progress Bar */}
      <div className="px-4 mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">Submissions</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {submissionProgress}/{maxSubmissions}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 my-3 h-px bg-gray-200 dark:bg-gray-700" />

      {/* Reward + Timeline */}
      <div className="px-4 space-y-2 mb-4">
        {campaign.budget?.perSubmission > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <CurrencyDollarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              ${campaign.budget.perSubmission.toLocaleString()} per submission
            </span>
            {campaign.budget.tokenAllocation > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (+{campaign.budget.tokenAllocation}% token)
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <ClockIcon className={`w-4 h-4 flex-shrink-0 ${
            isExpired
              ? 'text-red-500'
              : isDeadlineSoon
              ? 'text-orange-500'
              : 'text-gray-500 dark:text-gray-400'
          }`} />
          <span className={`${
            isExpired
              ? 'text-red-600 dark:text-red-400 font-medium'
              : isDeadlineSoon
              ? 'text-orange-600 dark:text-orange-400 font-medium'
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {isExpired
              ? 'Deadline passed'
              : daysUntilDeadline === 0
              ? 'Due today'
              : `${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} left`
            }
          </span>
        </div>
      </div>

      {/* Status Badge */}
      {showApplied && (
        <div className="px-4 mb-3">
          <div className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-center">
            ✓ You applied
          </div>
        </div>
      )}

      {/* Test Scenarios Count */}
      <div className="px-4 mb-4">
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {campaign.testScenarios?.length || 0} test scenario{campaign.testScenarios?.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-4 h-px bg-gray-200 dark:bg-gray-700" />

      {/* Action Button */}
      <div className="px-4 pb-4 mt-auto">
        <Button
          onClick={() => onJoin && onJoin(campaign)}
          variant={isExpired ? 'disabled' : 'primary'}
          disabled={isExpired}
          className="w-full flex items-center justify-center gap-2"
        >
          {isExpired ? 'Campaign Closed' : showApplied ? 'View Details' : 'Join Campaign'}
          {!isExpired && hovering && <ChevronRightIcon className="w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
}
