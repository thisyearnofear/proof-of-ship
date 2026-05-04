/**
 * Onboarding Banner — first-run experience for new visitors
 * Shows a brief walkthrough of the platform, dismissible via localStorage
 */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BanknotesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const STORAGE_KEY = 'pos_onboarding_dismissed';

export default function OnboardingBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const { userRole } = useUser();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, '1');
  };

  if (!visible) return null;

  const builderSteps = [
    {
      icon: MagnifyingGlassIcon,
      title: '1. Explore Projects',
      desc: 'Browse builder portfolios across 7 ecosystems',
      action: () => router.push('/explore'),
      cta: 'Explore →',
    },
    {
      icon: SparklesIcon,
      title: '2. Try AI Agents',
      desc: 'Get instant project analysis for fractions of a cent',
      action: () => router.push('/back?tab=economy'),
      cta: 'Try Agents →',
    },
    {
      icon: RocketLaunchIcon,
      title: '3. Submit a Project',
      desc: 'Showcase your work and get backed by the community',
      action: () => router.push('/projects/new'),
      cta: 'Submit →',
    },
  ];

  const backerSteps = [
    {
      icon: MagnifyingGlassIcon,
      title: '1. Explore Builders',
      desc: 'Find promising projects and builders to back',
      action: () => router.push('/explore'),
      cta: 'Explore →',
    },
    {
      icon: SparklesIcon,
      title: '2. Analyze with AI',
      desc: 'Use AI agents to evaluate project health and risk',
      action: () => router.push('/back?tab=economy'),
      cta: 'Analyze →',
    },
    {
      icon: BanknotesIcon,
      title: '3. Stake Privately',
      desc: 'Your positions are shielded by default — no copy-staking',
      action: () => router.push('/back?tab=discover'),
      cta: 'Stake →',
    },
  ];

  const steps = userRole === 'backer' ? backerSteps : builderSteps;

  return (
    <div className="bg-gradient-to-r from-blue-50 via-teal-50 to-purple-50 dark:from-blue-900/20 dark:via-teal-900/20 dark:to-purple-900/20 border-b border-blue-100 dark:border-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              👋 {userRole === 'backer' ? "Welcome back — here's how to start backing builders:" : "Welcome to Proof of Ship — here's how to get started:"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {steps.map((step) => (
                <button
                  key={step.title}
                  onClick={step.action}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors text-left"
                >
                  <step.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{step.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.desc}</p>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 inline-block">{step.cta}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={dismiss}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
