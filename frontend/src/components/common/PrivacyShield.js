/**
 * PrivacyShield
 *
 * Platform-level privacy messaging. Privacy is a feature of Proof of Ship,
 * not a user toggle. Shows at key moments:
 * - First time on /back page (onboarding)
 * - Before first stake (in BackingPanel)
 * - In the discover tab empty state
 *
 * The actual Cloak integration is always-on for Solana wallets.
 * This component explains what that means for users.
 *
 * Tracks: Superteam Cloak Track ($5K)
 */

import React, { useState } from 'react';
import Button from '@/components/common/Button';

/**
 * Compact inline privacy callout for the BackingPanel.
 * Shows right before the stake button, explaining that their position is protected.
 */
export function PrivacyInline({ isPrivate = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
      isPrivate 
        ? 'bg-purple-50 border border-purple-200 text-purple-800 dark:text-purple-300' 
        : 'bg-gray-50 border border-gray-200 text-gray-600 dark:text-gray-400'
    } ${className}`}>
      <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <span className="font-medium">
        {isPrivate
          ? 'Your stake amount is shielded — other users won\'t see your position'
          : 'Connect a Solana wallet for shielded positions'
        }
      </span>
    </div>
  );
}

/**
 * Full privacy explainer for the /back page.
 * Shown to first-time backers as a hero-style explanation.
 */
export function PrivacyOnboarding({ onDismiss, className = '' }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: '👁️',
      title: 'The Problem',
      body: 'On public blockchains, everyone can see how much you stake on which project. This enables copy-staking — others copy your moves without doing the research.',
      visual: (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs font-mono text-red-700 dark:text-red-300">
          <div className="text-[10px] text-red-500 dark:text-red-400 uppercase mb-1">Solana Explorer — Public</div>
          <div>alice.sol staked <span className="font-bold">$500 USDC</span> on ProjectX</div>
          <div>bob.sol staked <span className="font-bold">$2,000 USDC</span> on ProjectY</div>
          <div className="text-[10px] text-red-400 mt-1">Anyone can see this ↑</div>
        </div>
      ),
    },
    {
      icon: '🛡️',
      title: 'How We Protect You',
      body: 'When you stake on Proof of Ship, your position goes through Cloak\'s shielded pool using Groth16 zero-knowledge proofs. The blockchain records a valid transaction — but the amount, sender, and recipient are encrypted.',
      visual: (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs font-mono text-green-700 dark:text-green-300">
          <div className="text-[10px] text-green-500 dark:text-green-400 uppercase mb-1">Solana Explorer — Shielded</div>
          <div>Cloak Program: shielded transfer ✅</div>
          <div>Amount: <span className="font-bold">██████</span></div>
          <div>From: <span className="font-bold">██████</span></div>
          <div className="text-[10px] text-green-600 dark:text-green-400 mt-1">Valid proof verified — details hidden 🔒</div>
        </div>
      ),
    },
    {
      icon: '⚡',
      title: 'It\'s Automatic',
      body: 'You don\'t need to do anything. When you connect a Solana wallet and stake, your positions are shielded by default. On mainnet, the Cloak program processes real Groth16 proofs on Solana. On devnet, we demonstrate the exact same flow.',
      visual: (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-200">Privacy-First Platform</p>
              <p className="text-xs text-purple-700 dark:text-purple-300">Your data. Your positions. Protected by zero-knowledge proofs.</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 overflow-hidden ${className}`}>
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{current.icon}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{current.title}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{current.body}</p>
          </div>
        </div>

        {current.visual}

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-purple-600 w-4' : 'bg-purple-300 hover:bg-purple-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-purple-100/50 border-t border-purple-200 flex items-center justify-between">
        <button
          onClick={onDismiss}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
        >
          Skip
        </button>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:text-purple-300 font-medium"
            >
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep(step + 1)}
              className="text-xs bg-purple-600 hover:bg-purple-700"
            >
              Next
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onDismiss}
              className="text-xs bg-purple-600 hover:bg-purple-700"
            >
              Start Exploring
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Privacy badge for cards — small inline indicator.
 */
export function PrivacyBadge({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 ${className}`}>
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      Positions Shielded
    </span>
  );
}
