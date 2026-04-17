import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import ethosService from '@/services/EthosService';

/**
 * EthosScoreBadge - Displays Ethos credibility score with color-coded visual indicator
 * @param {Object} props
 * @param {number|null} props.score - Ethos credibility score (0-2800)
 * @param {Object} props.ethosUser - Full Ethos user object (optional, for additional info)
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg' (default: 'md')
 * @param {boolean} props.showLabel - Whether to show the tier label (default: true)
 * @param {boolean} props.showTooltip - Whether to show tooltip on hover (default: true)
 * @param {string} props.className - Additional CSS classes
 */
export default function EthosScoreBadge({
  score,
  ethosUser,
  size = 'md',
  showLabel = true,
  showTooltip = true,
  className = '',
}) {
  const tier = ethosService.getScoreTier(score);

  // Size variants
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const scoreDisplay = score !== null && score !== undefined ? Math.round(score) : '—';

  // Tooltip content
  const tooltipContent = () => {
    if (score === null || score === undefined) {
      return 'This user is not yet registered on Ethos Network';
    }

    const stats = ethosUser?.stats || {};
    const reviewStats = stats.review?.received || {};
    const vouchStats = stats.vouch?.received || {};

    return `
      Credibility Score: ${scoreDisplay} (${tier.label})
      
      Score Ranges:
      • 2000-2800: Excellent
      • 1600-1999: Good
      • 1200-1599: Neutral
      • 800-1199: Questionable
      • 0-799: Untrustworthy
      
      ${ethosUser ? `
      Reviews: +${reviewStats.positive || 0} / ±${reviewStats.neutral || 0} / -${reviewStats.negative || 0}
      Vouches: ${vouchStats.count || 0}
      ` : ''}
    `.trim();
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${tier.bgColor} ${tier.textColor} border ${tier.borderColor} rounded-full font-medium ${className}`}
      title={showTooltip ? tooltipContent() : undefined}
    >
      <ShieldCheckIcon className={iconSizes[size]} />
      <span>{scoreDisplay}</span>
      {showLabel && (
        <>
          <span className="text-gray-400">•</span>
          <span>{tier.label}</span>
        </>
      )}
    </div>
  );
}
