import React, { useState, useEffect, Suspense, lazy } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";

import Button from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import ScorePreviewCard from "@/components/common/ScorePreviewCard";
import LiveActivityFeed from "@/components/common/LiveActivityFeed";
import LiveAgentTicker from "@/components/common/LiveAgentTicker";
import UnifiedOnboarding from "@/components/onboarding/UnifiedOnboarding";
import { ECOSYSTEM_CONFIGS } from "@/config/ecosystems";
import { LANDING_FEATURES, USER_JOURNEYS } from "@/config/landingContent";
import {
  ArrowRightIcon,
  MagnifyingGlassIcon,
  SparklesIcon as SparklesIconOutline,
} from "@heroicons/react/24/outline";

// Lazy-loaded component sections - code-split for better performance
const FeaturesSection = lazy(() => 
  import('@/components/sections/FeatureSection').then(mod => ({
    default: mod.FeatureSection
  })).catch(() => ({ default: () => null }))
);

const PaymentFlowSection = lazy(() =>
  import('@/components/sections/PaymentFlow').then(mod => ({
    default: mod.PaymentFlow
  })).catch(() => ({ default: () => null }))
);

const UserJourneySection = lazy(() =>
  import('@/components/sections/UserJourney').then(mod => ({
    default: mod.UserJourney
  })).catch(() => ({ default: () => null }))
);

export default function LandingPage() {
  const router = useRouter();
  const { currentUser, onboardingComplete } = useUser();
  const [activeTab, setActiveTab] = useState("developers");
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the onboarding/tour
    const hasSeenOnboarding = localStorage.getItem('hasSeenUnifiedOnboarding');
    if (!hasSeenOnboarding && !onboardingComplete) {
      const timer = setTimeout(() => {
        setIsOnboardingOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [onboardingComplete]);

  const handleCloseOnboarding = () => {
    setIsOnboardingOpen(false);
    localStorage.setItem('hasSeenUnifiedOnboarding', 'true');
  };

  const ecosystems = Object.values(ECOSYSTEM_CONFIGS).map((eco) => ({
    id: eco.id,
    name: `${eco.icon} ${eco.shortName}`,
    description: eco.description,
    count: eco.hasSeasons ? `${eco.seasons?.length || 0} Seasons` : eco.category,
    color: `bg-[${eco.color}]`,
    rawColor: eco.color,
    icon: eco.icon,
  }));

  const userJourneys = USER_JOURNEYS;

  const handleGetStarted = () => {
    if (currentUser) {
      if (!onboardingComplete) {
        setIsOnboardingOpen(true);
      } else {
        router.push("/projects/new");
      }
    } else {
      setIsOnboardingOpen(true);
    }
  };

  const handleExploreFleet = () => {
    router.push("/explore");
  };

  return (
    <div className="min-h-screen bg-surface-secondary wave-pattern overflow-x-hidden">
      <LiveAgentTicker />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-20 left-[10%] w-64 h-64 bg-blue-400 rounded-full blur-[100px] animate-wave"></div>
          <div className="absolute bottom-20 right-[10%] w-80 h-80 bg-cyan-400 rounded-full blur-[120px] animate-wave" style={{ animationDelay: '-5s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
          <div className="text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in-up">
              <span className="animate-ping w-2 h-2 bg-blue-500 rounded-full"></span>
              Mainnet Live on Arc & Solana
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-primary mb-4 sm:mb-6 leading-tight tracking-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Ship Code,
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm">
                Unlock Credit
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-secondary mb-6 sm:mb-8 max-w-2xl mx-auto px-4 sm:px-0 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              Your on-chain reputation becomes collateral. Ship milestones, AI agents
              verify, backers stake USDC — no traditional collateral needed.
            </p>

            <div className="flex flex-col gap-3 sm:gap-4 justify-center px-4 sm:px-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold shadow-lg border border-primary-200 tide-button maritime-depth min-h-touch w-full sm:w-auto"
                >
                  <SparklesIconOutline className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                  {currentUser ? "Get Funded" : "Start Shipping"}
                  <ArrowRightIcon className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
                </Button>

                <Button
                  onClick={handleExploreFleet}
                  variant="outline"
                  className="px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold min-h-touch w-full sm:w-auto"
                >
                  <MagnifyingGlassIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                  Explore projects
                </Button>
              </div>
            </div>

            {/* Score Preview & Live Feed */}
            <div className="mt-8 sm:mt-12 flex flex-col lg:flex-row gap-8 items-center justify-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <ScorePreviewCard
                className="max-w-md w-full"
                onGetStarted={handleGetStarted}
              />
              <LiveActivityFeed />
            </div>
          </div>
        </div>
      </div>

      {/* The Capital Stack — Three Rails Visual */}
      <div className="py-12 sm:py-16 bg-surface border-t border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3">
              Capital That Grows With You
            </h2>
            <p className="text-sm sm:text-base text-secondary max-w-2xl mx-auto">
              Three capital instruments, one progression. Start where you are, level up as you ship.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-4 sm:gap-6">
            {/* Rail 1 — Bags Token */}
            <Card className="relative p-6 border-t-4 border-t-purple-500 bg-surface shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Rail 1</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-full">Pre-prize</span>
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Bags Token</h3>
              <p className="text-sm text-secondary mb-4">
                No prize pipeline yet? Launch a project token on Solana. Community buys in, you earn fee-share yield.
              </p>
              <ul className="space-y-2 text-sm text-secondary">
                <li className="flex items-start gap-2">• Community capital from token buyers</li>
                <li className="flex items-start gap-2">• Fee-share yield from trading volume</li>
                <li className="flex items-start gap-2">• No verification required</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-default">
                <div className="flex items-center justify-between text-xs text-tertiary">
                  <span>Backer yield: Fee-share %</span>
                  <span>Risk: Market-driven</span>
                </div>
              </div>
            </Card>

            {/* Rail 1 → Rail 2 Arrow */}
            <div className="hidden md:flex items-center self-center">
              <svg className="w-6 h-6 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Rail 2 — x402 Credit Line */}
            <Card className="relative p-6 border-t-4 border-t-blue-500 bg-surface shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Rail 2</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full">Mid-stage</span>
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">x402 Credit Line</h3>
              <p className="text-sm text-secondary mb-4">
                Have milestones to ship? Get a USDC credit line backed by your future hackathon prizes.
              </p>
              <ul className="space-y-2 text-sm text-secondary">
                <li className="flex items-start gap-2">• Up to $5,000 USDC credit</li>
                <li className="flex items-start gap-2">• Collateralized by prize pipeline</li>
                <li className="flex items-start gap-2">• AI agents verify milestones</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-default">
                <div className="flex items-center justify-between text-xs text-tertiary">
                  <span>Backer yield: Principal + multiplier</span>
                  <span>Risk: Milestone-driven</span>
                </div>
              </div>
            </Card>

            {/* Rail 2 → Rail 3 Arrow */}
            <div className="hidden md:flex items-center self-center">
              <svg className="w-6 h-6 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Rail 3 — Prize Routing */}
            <Card className="relative p-6 border-t-4 border-t-green-500 bg-surface shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-green-600">Rail 3</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-full">Settlement</span>
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Prize Routing</h3>
              <p className="text-sm text-secondary mb-4">
                Won a hackathon? Route the prize through the platform to auto-repay backers and keep the rest.
              </p>
              <ul className="space-y-2 text-sm text-secondary">
                <li className="flex items-start gap-2">• Auto-repay backers from prize</li>
                <li className="flex items-start gap-2">• Payout verification on 3 chains</li>
                <li className="flex items-start gap-2">• Leaderboard ranks fastest payouts</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-default">
                <div className="flex items-center justify-between text-xs text-tertiary">
                  <span>Backer yield: Principal + multiplier</span>
                  <span>Risk: Prize-dependent</span>
                </div>
              </div>
            </Card>
          </div>

          <p className="text-center text-xs sm:text-sm text-tertiary mt-8">
            The rails are composable — use one or all three. The agent layer recommends which fits your stage.
          </p>
        </div>
      </div>

      {/* Features Section - Lazily loaded */}
      <Suspense fallback={
        <div className="bg-surface py-12 sm:py-16 border-t border-default">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 sm:p-6 text-center border border-default rounded-xl">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-3 animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      }>
        <FeaturesSection features={LANDING_FEATURES} />
      </Suspense>

      {/* How x402 Nanopayments Work */}
      <div className="py-12 sm:py-16 bg-gradient-to-b from-teal-50 to-white border-t border-teal-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <Suspense fallback={<div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>}>
            <PaymentFlowSection />
          </Suspense>
        </div>
      </div>

      {/* User Journey Tabs - Lazily loaded */}
      <Suspense fallback={
        <div className="bg-surface-secondary py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-8 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6 border border-default rounded-xl">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mx-auto mb-3 animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      }>
        <UserJourneySection userJourneys={userJourneys} activeTab={activeTab} onTabChange={setActiveTab} />
      </Suspense>

      {/* Ecosystems Section */}
      <div className="py-12 sm:py-16 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3 sm:mb-4">
              🗺️ Explore Ecosystems
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-secondary px-4 sm:px-0">
              Track builder activity across {Object.keys(ECOSYSTEM_CONFIGS).length} blockchain ecosystems
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {ecosystems.map((ecosystem) => (
              <Card
                key={ecosystem.id}
                className="p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer border border-default hover:border-primary-300 bg-surface"
                onClick={() => router.push(`/explore?ecosystem=${ecosystem.id}`)}
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-4">
                  <div
                    className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg flex items-center justify-center text-white text-lg sm:text-xl flex-shrink-0 shadow-md"
                    style={{ backgroundColor: ecosystem.rawColor || ecosystem.color }}
                  >
                    {ecosystem.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary text-sm sm:text-base break-words">
                      {ecosystem.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-secondary">{ecosystem.count}</p>
                  </div>
                </div>
                <p className="text-secondary text-xs sm:text-sm mb-4">
                  {ecosystem.description}
                </p>
                <div className="flex items-center text-blue-600 text-xs sm:text-sm font-medium min-h-touch">
                  Explore →
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 py-12 sm:py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center relative">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
            Ready to Ship?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4 sm:px-0">
            Join builders earning credit from their reputation. Backers stake, AI agents analyze, builders ship.
          </p>

          <div className="flex flex-col gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Button
              onClick={handleGetStarted}
              className="bg-surface text-blue-800 hover:bg-gray-100 px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold shadow-lg min-h-touch w-full sm:w-auto"
            >
              ✨ Start Shipping
            </Button>

            <Button
              onClick={() => router.push("/explore")}
              variant="outline"
              className="border-white text-white hover:bg-surface hover:text-blue-600 px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold min-h-touch w-full sm:w-auto"
            >
              📖 Explore Projects
            </Button>
          </div>
        </div>
      </div>
      
      <UnifiedOnboarding isOpen={isOnboardingOpen} onClose={handleCloseOnboarding} />
    </div>
  );
}
