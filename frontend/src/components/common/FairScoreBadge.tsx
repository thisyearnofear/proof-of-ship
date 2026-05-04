/**
 * FairScoreBadge
 *
 * Displays a FairScale reputation score for a Solana wallet address.
 * Shows trust tier, score value, and earned badges.
 * Mirrors SnsIdentityBadge patterns for visual consistency.
 */

import React from 'react';

interface FairScoreBadgeProps {
  /** Solana wallet address */
  address: string;
  /** Pre-fetched FairScore result to skip loading state */
  scoreData?: {
    score: number | null;
    tier: string;
    tierColor: string;
    fairscoreBase?: number | null;
    socialScore?: number | null;
    badges?: Array<{ id?: string; label?: string; tier?: string } | string>;
    isDemo?: boolean;
  } | null;
  /** Show the numeric score alongside the tier label */
  showScore?: boolean;
  /** Show earned badges below the score */
  showBadges?: boolean;
  /** Compact mode for inline use (e.g., card headers) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Excellent: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  Good: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Neutral: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  Questionable: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Untrustworthy: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  New: { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-200' },
  Unknown: { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-200' },
};

const TIER_ICONS: Record<string, string> = {
  Excellent: '\u2727',
  Good: '\u25C6',
  Neutral: '\u25CB',
  Questionable: '\u25B3',
  Untrustworthy: '\u2716',
  New: '\u2014',
  Unknown: '?',
};

function ScoreRing({ score, tier, size = 28 }: { score: number | null; tier: string; size?: number }) {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score !== null ? Math.min(score / 100, 1) : 0;
  const offset = circumference * (1 - pct);
  const styles = TIER_STYLES[tier] || TIER_STYLES.Unknown;

  const strokeColor =
    tier === 'Excellent' ? '#16a34a' :
    tier === 'Good' ? '#2563eb' :
    tier === 'Neutral' ? '#6b7280' :
    tier === 'Questionable' ? '#ea580c' :
    tier === 'Untrustworthy' ? '#dc2626' :
    '#d1d5db';

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="2.5"
      />
      {score !== null && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
    </svg>
  );
}

export default function FairScoreBadge({
  address,
  scoreData,
  showScore = true,
  showBadges = false,
  compact = false,
  className = '',
}: FairScoreBadgeProps) {
  if (!address) return null;

  const tier = scoreData?.tier || 'Unknown';
  const score = scoreData?.score ?? null;
  const styles = TIER_STYLES[tier] || TIER_STYLES.Unknown;
  const icon = TIER_ICONS[tier] || '?';
  const isDemo = scoreData?.isDemo;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${className}`}
        title={`FairScore: ${score !== null ? score : 'N/A'} (${tier})${isDemo ? ' — demo' : ''}`}
      >
        <span className="text-[10px]">{icon}</span>
        <span className="font-medium">{tier}</span>
        {showScore && score !== null && (
          <span className="opacity-70">{score}</span>
        )}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <ScoreRing score={score} tier={tier} />
      <div className="flex flex-col">
        <span className={`text-xs font-semibold ${styles.text}`}>
          {icon} {tier}
          {showScore && score !== null && (
            <span className="ml-1 font-normal opacity-70">{score}/100</span>
          )}
        </span>
        {isDemo && (
          <span className="text-[10px] text-gray-400 italic">Demo</span>
        )}
        {showBadges && scoreData?.badges && scoreData.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {scoreData.badges.map((badge, i) => (
              <span key={i} className={`text-[10px] px-1 py-0.5 rounded ${
                typeof badge === 'object' && badge.tier === 'platinum'
                  ? 'bg-yellow-100 text-yellow-700'
                  : typeof badge === 'object' && badge.tier === 'gold'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {typeof badge === 'object' ? (badge.label || badge.id || '?') : badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
