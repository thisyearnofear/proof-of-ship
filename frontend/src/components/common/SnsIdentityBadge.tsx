/**
 * SnsIdentityBadge
 *
 * Displays a .sol domain name for a Solana address with a link to SNS.
 * Falls back to truncated address when no .sol name is registered.
 */

import React from 'react';
import { useSnsName } from '@/hooks/useSnsName';

interface SnsIdentityBadgeProps {
  /** Solana wallet address */
  address: string;
  /** Show the truncated address as fallback when no .sol name is found */
  showFallback?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show a loading skeleton while resolving */
  showLoading?: boolean;
  /** Chain family hint: only resolve SNS for Solana addresses */
  chainFamily?: 'evm' | 'solana';
}

export default function SnsIdentityBadge({
  address,
  showFallback = true,
  className = '',
  showLoading = false,
  chainFamily,
}: SnsIdentityBadgeProps) {
  // Only resolve SNS names for Solana addresses
  const shouldResolve = !chainFamily || chainFamily === 'solana';
  const { snsName, loading, displayName } = useSnsName(
    shouldResolve ? address : null
  );

  if (!address) return null;

  // For EVM addresses, just show truncated
  if (chainFamily === 'evm') {
    const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return <span className={`font-mono ${className}`}>{truncated}</span>;
  }

  if (loading && showLoading) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
      </span>
    );
  }

  const hasSolName = !!snsName;

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      title={hasSolName ? address : undefined}
    >
      {hasSolName && (
        <svg
          className="w-3.5 h-3.5 text-purple-500 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-label="Verified .sol domain"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      )}
      <span className={hasSolName ? 'font-medium text-purple-700' : 'font-mono text-sm'}>
        {showFallback ? displayName : (snsName || null)}
      </span>
    </span>
  );
}
