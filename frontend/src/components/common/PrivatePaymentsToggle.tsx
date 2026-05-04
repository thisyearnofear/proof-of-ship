/**
 * PrivatePaymentsToggle
 *
 * Toggle for enabling Cloak shielded transfers in backing and payout flows.
 * When enabled, USDC transfers go through Cloak's UTXO shielded pool,
 * hiding amounts and counterparties from the public Solana ledger.
 *
 * Tracks: Superteam Cloak Track
 */

import React, { useState, useEffect } from 'react';
import { cloakPaymentService } from '@/services/CloakPaymentService';

interface PrivatePaymentsToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function PrivatePaymentsToggle({
  enabled,
  onChange,
  disabled = false,
  className = '',
}: PrivatePaymentsToggleProps) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    cloakPaymentService.isAvailable().then((avail) => {
      setAvailable(avail);
      // Show in demo mode when Cloak isn't deployed (devnet)
      if (!avail) setDemoMode(true);
    }).catch(() => {
      setAvailable(false);
      setDemoMode(true);
    });
  }, []);

  // Show demo indicator when Cloak isn't available on this cluster
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet';
  const isMainnet = cluster === 'mainnet' || cluster === 'mainnet-beta';

  return (
    <div className={`p-3 rounded-lg border transition-all ${
      enabled ? 'border-purple-300 bg-purple-50' : 
      demoMode ? 'border-purple-200 bg-purple-50/50' : 
      'border-gray-200 bg-gray-50'
    } ${className}`}>
      <label className="flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 ${enabled ? 'text-purple-600' : demoMode ? 'text-purple-400' : 'text-gray-400'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-medium ${enabled ? 'text-purple-800' : 'text-gray-700'}`}>
                Private Stake
              </span>
              {demoMode && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 uppercase">
                  Demo
                </span>
              )}
              {!demoMode && available && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-600 uppercase">
                  Live
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {enabled
                ? 'Amounts hidden via Cloak shielded pool'
                : demoMode
                  ? 'Simulate Cloak privacy (mainnet only)'
                  : 'Shield your stake from public explorers'}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={disabled || available === null}
          onClick={() => onChange(!enabled)}
          className={`
            relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out focus:outline-none
            ${enabled ? 'bg-purple-600' : 'bg-gray-300'}
            ${disabled || available === null ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span
            className={`
              pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0
              transition duration-200 ease-in-out
              ${enabled ? 'translate-x-4' : 'translate-x-0'}
            `}
          />
        </button>
      </label>
    </div>
  );
}
