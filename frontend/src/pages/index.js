import React, { useState, Suspense, lazy } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/stores/authStore";

import LiveAgentTicker from "@/components/common/LiveAgentTicker";
import Hero from "@/components/sections/Hero";
import CapitalStack from "@/components/sections/CapitalStack";
import EcosystemsGrid from "@/components/sections/EcosystemsGrid";
import CTASection from "@/components/sections/CTASection";
import { ECOSYSTEM_CONFIGS } from "@/config/ecosystems";
import { LANDING_FEATURES, USER_JOURNEYS } from "@/config/landingContent";

const FeaturesSection = lazy(() =>
  import("@/components/sections/FeatureSection").then((mod) => ({
    default: mod.FeatureSection,
  })).catch(() => ({ default: () => null }))
);
const PaymentFlowSection = lazy(() =>
  import("@/components/sections/PaymentFlow").then((mod) => ({
    default: mod.PaymentFlow,
  })).catch(() => ({ default: () => null }))
);
const UserJourneySection = lazy(() =>
  import("@/components/sections/UserJourney").then((mod) => ({
    default: mod.UserJourney,
  })).catch(() => ({ default: () => null }))
);

LandingPage.fullWidth = true;

export default function LandingPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState("developers");

  const ecosystems = Object.values(ECOSYSTEM_CONFIGS).map((eco) => ({
    id: eco.id,
    name: `${eco.icon} ${eco.shortName}`,
    description: eco.description,
    count: eco.hasSeasons ? `${eco.seasons?.length || 0} Seasons` : eco.category,
    color: `bg-[${eco.color}]`,
    rawColor: eco.color,
    icon: eco.icon,
  }));

  const handleGetStarted = () => {
    if (currentUser) {
      router.push("/projects/new");
    } else {
      router.push("/login?mode=signup");
    }
  };

  const handleExploreFleet = () => router.push("/explore");
  const handleEcosystemClick = (id) => router.push(`/explore?ecosystem=${id}`);

  return (
    <div className="min-h-screen bg-surface-secondary wave-pattern overflow-x-hidden">
      <LiveAgentTicker />
      <Hero
        currentUser={currentUser}
        onGetStarted={handleGetStarted}
        onExploreFleet={handleExploreFleet}
      />
      <CapitalStack />

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

      <div className="py-12 sm:py-16 bg-gradient-to-b from-teal-50 to-white border-t border-teal-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>}>
            <PaymentFlowSection />
          </Suspense>
        </div>
      </div>

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
        <UserJourneySection
          userJourneys={USER_JOURNEYS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </Suspense>

      <EcosystemsGrid ecosystems={ecosystems} onEcosystemClick={handleEcosystemClick} />
      <CTASection onGetStarted={handleGetStarted} onExplore={handleExploreFleet} />
    </div>
  );
}
