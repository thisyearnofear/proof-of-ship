/**
 * BuilderTrust
 *
 * Shared trust signal component for builders on Solana.
 * Shows FairScale on-chain reputation with score, tier, and key behavioral signals.
 * Single source of truth — used in ProjectCard, BackingPanel, and UserProfile.
 *
 * Tracks: Solana ecosystem reputation infrastructure
 */

import React from 'react';
import { useFairScore } from '@/hooks/useFairScore';

const TIER_STYLES = {
  Excellent: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', ring: '#10b981', glow: 'shadow-emerald-100' },
  Good:      { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', ring: '#3b82f6', glow: 'shadow-blue-100' },
  Neutral:   { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', ring: '#64748b', glow: 'shadow-slate-100' },
  Questionable: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', ring: '#f97316', glow: 'shadow-orange-100' },
  Untrustworthy: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', ring: '#ef4444', glow: 'shadow-red-100' },
  Unknown:   { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', ring: '#9ca3af', glow: 'shadow-gray-100' },
};

function getStyles(tier: string) {
  return (TIER_STYLES as Record<string, typeof TIER_STYLES.Unknown>)[tier] || TIER_STYLES.Unknown;
}

/**
 * Compact score ring — SVG donut chart showing score as arc fill.
 */
function ScoreRing({ score, tier, size = 40 }: { score: number | null; tier: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score !== null ? Math.min(score / 100, 1) : 0;
  const offset = circ * (1 - pct);
  const color = getStyles(tier).ring;

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
      {score !== null && (
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      )}
    </svg>
  );
}

/**
 * Map FairScale features object to human-readable micro-stats.
 * Only surfaces the signals that matter for backing decisions.
 */
function deriveSignals(features: Record<string, any> | null | undefined) {
  if (!features) return [];

  const signals = [];

  // Active days — how many distinct days this wallet has been on-chain
  if (features.active_days != null) {
    const days = Math.round(features.active_days);
    if (days > 180) signals.push({ label: `${days}d active`, icon: 'calendar', quality: 'positive' });
    else if (days > 30) signals.push({ label: `${days}d active`, icon: 'calendar', quality: 'neutral' });
    else signals.push({ label: `${days}d active`, icon: 'calendar', quality: 'negative' });
  }

  // Wallet age — maturity signal
  if (features.wallet_age_days != null) {
    const age = Math.round(features.wallet_age_days);
    if (age > 365) signals.push({ label: `${Math.floor(age/365)}y old`, icon: 'clock', quality: 'positive' });
    else if (age > 90) signals.push({ label: `${Math.floor(age/30)}mo old`, icon: 'clock', quality: 'neutral' });
    else signals.push({ label: `${age}d old`, icon: 'clock', quality: 'negative' });
  }

  // Conviction ratio — holds positions vs dumps
  if (features.conviction_ratio != null) {
    const ratio = features.conviction_ratio;
    if (ratio > 0.7) signals.push({ label: 'Convicted', icon: 'shield', quality: 'positive' });
    else if (ratio > 0.4) signals.push({ label: 'Moderate', icon: 'shield', quality: 'neutral' });
    else signals.push({ label: 'Low conviction', icon: 'shield', quality: 'negative' });
  }

  // No instant dumps — bot/mercenary signal
  if (features.no_instant_dumps != null) {
    const val = features.no_instant_dumps;
    if (val > 0.8) signals.push({ label: 'No dumps', icon: 'check', quality: 'positive' });
    else if (val < 0.4) signals.push({ label: 'Dump history', icon: 'warning', quality: 'negative' });
  }

  // Platform diversity — uses multiple protocols
  if (features.platform_diversity != null) {
    const div = features.platform_diversity;
    if (div > 0.6) signals.push({ label: 'Diverse', icon: 'globe', quality: 'positive' });
  }

  return signals.slice(0, 4); // max 4 signals to avoid crowding
}

const ICONS: Record<string, React.ReactNode> = {
  calendar: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  clock: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
    </svg>
  ),
  shield: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  check: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  ),
  warning: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  globe: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  ),
};

const SIGNAL_COLORS: Record<string, string> = {
  positive: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  neutral: 'text-slate-600 bg-slate-50 border-slate-200',
  negative: 'text-orange-700 bg-orange-50 border-orange-200',
};

/**
 * Loading skeleton for trust section.
 */
export function BuilderTrustSkeleton({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <div className="animate-pulse flex items-center gap-2 py-1.5 px-2 rounded-lg bg-gray-50 border border-gray-100">
        <div className="w-6 h-6 rounded-full bg-gray-200" />
        <div className="space-y-1">
          <div className="h-2.5 w-16 bg-gray-200 rounded" />
          <div className="h-2 w-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse rounded-lg border border-gray-100 p-3 bg-gray-50/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-2 w-32 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="flex gap-1.5 mt-2">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Compact trust pill — for ProjectCard badge row.
 * Replaces the old FairScoreBadge compact mode with a richer signal.
 */
export function BuilderTrustCompact({ address, className = '' }: { address: string; className?: string }) {
  const { data, loading } = useFairScore(address);

  if (loading) return <BuilderTrustSkeleton compact className={className} />;
  if (!data || data.score === null) return null;

  const tier = data.tier || 'Unknown';
  const styles = getStyles(tier);
  const signals = deriveSignals(data.features);

  return (
    <div className={`flex items-center gap-1.5 py-1 px-2 rounded-lg border ${styles.bg} ${styles.border} ${className}`}
      title={`FairScore: ${data.score}/100 (${tier})${data.isDemo ? ' — demo' : ''}`}
    >
      <ScoreRing score={data.score} tier={tier} size={18} />
      <span className={`text-[11px] font-semibold ${styles.text}`}>{tier}</span>
      <span className={`text-[10px] ${styles.text} opacity-60`}>{data.score}</span>
      {signals.length > 0 && (
        <span className={`text-[10px] hidden sm:inline ${styles.text} opacity-50`}>
          &middot; {signals[0].label}
        </span>
      )}
    </div>
  );
}

/**
 * Full trust panel — for BackingPanel and project detail pages.
 * Shows score ring, tier, key behavioral signals, and badge count.
 */
export function BuilderTrustFull({ address, className = '' }: { address: string; className?: string }) {
  const { data, loading } = useFairScore(address);

  if (loading) return <BuilderTrustSkeleton className={className} />;
  if (!data || data.score === null) return null;

  const tier = data.tier || 'Unknown';
  const styles = getStyles(tier);
  const signals = deriveSignals(data.features);
  const hasBadges = data.badges && data.badges.length > 0;

  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 p-3">
        <ScoreRing score={data.score} tier={tier} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-base font-bold ${styles.text}`}>{tier}</span>
            <span className={`text-sm ${styles.text} opacity-60`}>{data.score}/100</span>
          </div>
          <span className="text-[11px] text-gray-500">
            On-chain reputation from FairScale
            {data.isDemo && ' (demo)'}
          </span>
        </div>
        {hasBadges && (
          <div className="flex flex-col items-end gap-0.5">
            {(data.badges || []).slice(0, 3).map((badge: any, i: number) => (
              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${
                badge?.tier === 'platinum'
                  ? 'bg-yellow-100 text-yellow-700'
                  : badge?.tier === 'gold'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-white/60 text-gray-600'
              }`}>
                {typeof badge === 'object' ? (badge.label || badge.id || '?') : String(badge)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Behavioral signals strip */}
      {signals.length > 0 && (
        <div className={`px-3 py-2 border-t ${styles.border} flex flex-wrap gap-1.5`}>
          {signals.map((sig, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${SIGNAL_COLORS[sig.quality]}`}
            >
              {ICONS[sig.icon]}
              {sig.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
