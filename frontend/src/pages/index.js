import React, { useState, Suspense, lazy } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";

import Button from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import ScorePreviewCard from "@/components/common/ScorePreviewCard";
import { ECOSYSTEM_CONFIGS } from "@/config/ecosystems";
import {
  ChartBarIcon,
  SparklesIcon as SparklesIconOutline,
  ArrowRightIcon,
  PlusCircleIcon,
  ChatBubbleLeftRightIcon,
  FlagIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  CubeIcon,
  MapIcon,
  EyeIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
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

  const features = [
    {
      icon: ChartBarIcon,
      title: "Reputation-Backed Credit",
      description:
        "Your credit limit isn't just a score—it's backed by reputation. Backer stakes directly scale your available credit line.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Reputation Collateral",
      description:
        "AI agents analyze your shipping history and GitHub activity to form your credit foundation. No traditional collateral needed.",
    },
    {
      icon: BanknotesIcon,
      title: "Multiplier Staking",
      description:
        "Backers stake USDC with 1.5x, 2x, or 3x reward tiers. Higher backer confidence unlocks better credit terms for builders.",
    },
    {
      icon: RocketLaunchIcon,
      title: "Ship to Unlock Credit",
      description:
        "Deliver milestones to verify backer stakes and unlock the next tier of credit. A virtuous cycle of shipping and funding.",
    },
  ];

  const ecosystems = Object.values(ECOSYSTEM_CONFIGS).map((eco) => ({
    id: eco.id,
    name: `${eco.icon} ${eco.shortName}`,
    description: eco.description,
    count: eco.hasSeasons ? `${eco.seasons?.length || 0} Seasons` : eco.category,
    color: `bg-[${eco.color}]`,
    rawColor: eco.color,
    icon: eco.icon,
  }));

  const userJourneys = {
    developers: {
      title: "For Builders",
      subtitle: "Build your portfolio, get feedback, and grow your reputation",
      steps: [
        {
          icon: PlusCircleIcon,
          title: "Showcase Your Portfolio",
          desc: "Create your builder portfolio with subdomain routing to showcase your projects",
        },
        {
          icon: ChatBubbleLeftRightIcon,
          title: "Collect User Feedback",
          desc: "Get valuable feedback with screen recordings to improve your projects",
        },
        {
          icon: FlagIcon,
          title: "Track Hackathons",
          desc: "Follow hackathons, track participation, and showcase your wins",
        },
        {
          icon: UsersIcon,
          title: "Grow Your Community",
          desc: "Connect with other builders and grow your project community",
        },
      ],
    },
    organizers: {
      title: "For Organizers",
      subtitle: "Track builders, manage hackathons, and recognize achievements",
      steps: [
        {
          icon: EyeIcon,
          title: "Track Builder Progress",
          desc: "Monitor builder participation and project progress in real-time",
        },
        {
          icon: MapIcon,
          title: "Manage Hackathons",
          desc: "Organize and track hackathon participation across your ecosystem",
        },
        {
          icon: ChatBubbleLeftRightIcon,
          title: "Collect Feedback",
          desc: "Gather valuable feedback from builders to improve your programs",
        },
        {
          icon: FlagIcon,
          title: "Recognize Achievements",
          desc: "Highlight successful builders and projects in your ecosystem",
        },
      ],
    },
    sponsors: {
      title: "For Backers",
      subtitle: "Scout talent, back builders, and earn from their success",
      steps: [
        {
          icon: MagnifyingGlassIcon,
          title: "Scout Talent",
          desc: "Find promising builders by analyzing their GitHub history and onchain reputation",
        },
        {
          icon: BanknotesIcon,
          title: "Stake on Builders",
          desc: "Back builders you believe in by staking USDC with 1.5x–3x reward multipliers",
        },
        {
          icon: ChartBarIcon,
          title: "Backer Confidence",
          desc: "Your stake increases the builder's credit limit—more confidence, more credit",
        },
        {
          icon: CubeIcon,
          title: "Shared Rewards",
          desc: "Earn a portion of the hackathon prizes when your backed builders win",
        },
      ],
    },
  };

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
    <div className="min-h-screen bg-surface-secondary wave-pattern">
      {/* Hero Section */}
      <div className="relative overflow-hidden">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full text-sm font-medium border border-blue-200 shadow-lg animate-fade-in-up">
                <SparklesIconOutline className="w-4 h-4" />
                <span>AI-Analyzed Builder Credit</span>
              </div>
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-primary mb-4 sm:mb-6 leading-tight tracking-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Builder Credit:
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Backers Stake,
              </span>
              <br />
              <span className="text-secondary">AI Analyzes</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-secondary mb-6 sm:mb-8 max-w-3xl mx-auto px-4 sm:px-0">
              Your on-chain reputation sets your credit limit. AI agents analyze per-query. 
              Backers stake on your success to boost your liquidity. Ship milestones, unlock funding.
            </p>

            <div className="flex flex-col gap-3 sm:gap-4 justify-center px-4 sm:px-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold shadow-lg border border-primary-200 tide-button maritime-depth min-h-touch w-full sm:w-auto"
              >
                <SparklesIconOutline className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                Get Your Credit Score
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

            {/* Score Preview */}
            <ScorePreviewCard
              className="mt-8 sm:mt-10 max-w-md mx-auto px-4 sm:px-0"
              onGetStarted={handleGetStarted}
            />
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
        <FeaturesSection features={features} />
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
            Ready to Start Building?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4 sm:px-0">
            Join builders earning credit from their reputation. AI agents analyze, backers stake, builders ship.
          </p>

          <div className="flex flex-col gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Button
              onClick={handleGetStarted}
              className="bg-surface text-blue-800 hover:bg-gray-100 px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold shadow-lg min-h-touch w-full sm:w-auto"
            >
              ✨ Get Your Credit Score
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
    </div>
  );
}
