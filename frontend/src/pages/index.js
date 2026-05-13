import React, { useState, useEffect, Suspense, lazy } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";

import Button from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import ScorePreviewCard from "@/components/common/ScorePreviewCard";
import LiveActivityFeed from "@/components/common/LiveActivityFeed";
import LiveAgentTicker from "@/components/common/LiveAgentTicker";
import NauticalTour from "@/components/onboarding/NauticalTour";
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
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState("developers");
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('hasSeenNauticalTour');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseTour = () => {
    setIsTourOpen(false);
    localStorage.setItem('hasSeenNauticalTour', 'true');
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
      router.push("/projects/new");
    } else {
      router.push("/login?redirect=/projects/new");
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
              onClick={() => router.push("/about")}
              variant="outline"
              className="border-white text-white hover:bg-surface hover:text-blue-600 px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold min-h-touch w-full sm:w-auto"
            >
              📖 Learn More
            </Button>
          </div>
        </div>
      </div>
      
      <NauticalTour isOpen={isTourOpen} onClose={handleCloseTour} />
    </div>
  );
}
