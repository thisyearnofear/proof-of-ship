import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

import Button from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import ScoreBar from "@/components/common/ScoreBar";
import { ECOSYSTEM_CONFIGS } from "@/config/ecosystems";
import {
  ChartBarIcon,
  CreditCardIcon,
  GlobeAltIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  RocketLaunchIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

export default function LandingPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("developers");
  const [previewUsername, setPreviewUsername] = useState('');
  const [previewResult, setPreviewResult] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const features = [
    {
      icon: RocketLaunchIcon,
      title: "🚀 Market-Backed Credit",
      description:
        "Your credit limit isn't just a score—it's a market. Backer confidence directly scales your available liquidity.",
    },
    {
      icon: EyeIcon,
      title: "🎯 Prize Collateral",
      description:
        "Collateralize your potential hackathon winnings to get USDC upfront. We bridge the gap between building and winning.",
    },
    {
      icon: ClockIcon,
      title: "🎲 Simple Multiplier Betting",
      description:
        "Backers place 1.5x, 2x, or 3x bets on your project milestones. Higher stakes from the community lead to better credit terms for you.",
    },
    {
      icon: UserGroupIcon,
      title: "🚢 Proven Delivery",
      description:
        "Ship milestones to validate backer bets and unlock the next tier of credit. A virtuous cycle of shipping and funding.",
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
          title: "🎨 Showcase Your Portfolio",
          desc: "Create your builder portfolio with subdomain routing to showcase your Farcaster mini apps",
        },
        {
          title: "💬 Collect User Feedback",
          desc: "Get valuable feedback with screen recordings to improve your projects",
        },
        {
          title: "🏆 Track Hackathons",
          desc: "Follow hackathons, track participation, and showcase your wins",
        },
        {
          title: "🚢 Grow Your Community",
          desc: "Connect with other builders and grow your project community",
        },
      ],
    },
    organizers: {
      title: "For Organizers",
      subtitle: "Track builders, manage hackathons, and recognize achievements",
      steps: [
        {
          title: "📡 Track Builder Progress",
          desc: "Monitor builder participation and project progress in real-time",
        },
        {
          title: "🗺️ Manage Hackathons",
          desc: "Organize and track hackathon participation across your ecosystem",
        },
        {
          title: "⚡ Collect Feedback",
          desc: "Gather valuable feedback from builders to improve your programs",
        },
        {
          title: "🏆 Recognize Achievements",
          desc: "Highlight successful builders and projects in your ecosystem",
        },
      ],
    },
    sponsors: {
      title: "For Backers",
      subtitle: "Scout talent, back builders, and earn from their success",
      steps: [
        {
          title: "🔍 Scout Talent",
          desc: "Find promising builders by analyzing their GitHub history and onchain reputation",
        },
        {
          title: "🎲 Place Your Bets",
          desc: "Back builders you believe in by staking capital with 1.5x-3x reward multipliers on their milestone completion",
        },
        {
          title: "📈 Market Confidence",
          desc: "Your backing increases the builder's credit limit through market confidence",
        },
        {
          title: "💰 Shared Rewards",
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

  const handlePreviewScore = async (e) => {
    e.preventDefault();
    const username = previewUsername.trim();
    if (!username) return;

    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewResult(null);

    try {
      const res = await fetch(`/api/score/preview?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!data.success) {
        setPreviewError(data.error || 'Could not fetch score');
        return;
      }
      setPreviewResult(data.data);
    } catch (err) {
      setPreviewError('Failed to connect. Please try again.');
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary wave-pattern">
      {/* Hero Section */}
      <div className="relative overflow-hidden">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full text-sm font-medium border border-blue-200 shadow-lg">
                <span className="text-lg">🌐</span>
                <span>Onchain Project Portfolios</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-primary mb-4 sm:mb-6 leading-tight">
              Predictive Credit:
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {" "}
                Backer-Funded,
              </span>
              <br /> Prize-Collateralized
            </h1>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-secondary mb-6 sm:mb-8 max-w-3xl mx-auto px-4 sm:px-0">
              The first liquidity loop where market confidence in your ability to ship 
              directly determines your credit limit. Borrow against your future prizes.
            </p>

            <div className="flex flex-col gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold shadow-lg border border-primary-200 tide-button maritime-depth min-h-touch w-full sm:w-auto"
              >
                ✨ Create your portfolio
                <ArrowRightIcon className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
              </Button>

              <Button
                onClick={handleExploreFleet}
                variant="outline"
                className="px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold min-h-touch w-full sm:w-auto"
              >
                🔎 Explore projects
              </Button>
            </div>

            {/* Score Preview */}
            <div className="mt-8 sm:mt-10 max-w-md mx-auto px-4 sm:px-0">
              <form onSubmit={handlePreviewScore} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter GitHub username"
                  value={previewUsername}
                  onChange={(e) => setPreviewUsername(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg border border-default bg-surface text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  disabled={previewLoading}
                />
                <Button
                  type="submit"
                  disabled={!previewUsername.trim() || previewLoading}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-5 py-3 text-sm font-semibold whitespace-nowrap"
                >
                  {previewLoading ? '...' : '🔍 Preview'}
                </Button>
              </form>

              {/* Score Result */}
              {previewResult && (
                <Card className="mt-4 p-4 text-left border border-default bg-surface/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-secondary">Estimated Credit Score</p>
                      <p className="text-2xl font-bold text-primary">{previewResult.estimatedScore}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      previewResult.estimatedScore >= 700 ? 'bg-success-50 text-success-700' :
                      previewResult.estimatedScore >= 550 ? 'bg-warning-50 text-warning-700' :
                      'bg-surface-secondary text-secondary'
                    }`}>
                      {previewResult.tier}
                    </span>
                  </div>
                  <ScoreBar score={previewResult.estimatedScore} />
                  <div className="flex justify-between text-xs text-secondary mt-1 mb-3">
                    <span>400</span><span>550</span><span>700</span><span>850</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-secondary">
                    <span>📦 {previewResult.stats.publicRepos} repos</span>
                    <span>⭐ {previewResult.stats.totalStars} stars</span>
                  </div>
                  <button
                    onClick={handleGetStarted}
                    className="mt-3 w-full text-center text-sm font-semibold text-primary hover:text-primary-600"
                  >
                    Connect to unlock your full credit profile →
                  </button>
                </Card>
              )}

              {previewError && (
                <p className="mt-2 text-sm text-red-600">{previewError}</p>
              )}
            </div>

            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-secondary px-4 sm:px-0">
              <div className="flex items-center gap-2">
                <span className="text-green-500">🌐</span>
                <span>Subdomain portfolio</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">🧪</span>
                <span>Human verification</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">🏁</span>
                <span>Hackathon tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Journey Tabs */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3 sm:mb-4">
            How It Works
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-secondary px-4 sm:px-0">
            Whether you&apos;re building, organizing, or backing &mdash; every role
            contributes to the proof-of-ship ecosystem.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8 sm:mb-12 overflow-x-auto">
          <div className="bg-surface-secondary p-1 rounded-lg border border-default inline-flex gap-1">
            {Object.keys(userJourneys).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 sm:px-6 py-2 sm:py-3 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-touch ${
                  activeTab === key
                    ? "bg-surface text-primary shadow-sm border border-default"
                    : "text-secondary hover:text-primary"
                }`}
              >
                {userJourneys[key].title}
              </button>
            ))}
          </div>
        </div>

        {/* Active Tab Content */}
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-primary mb-2 px-4 sm:px-0">
            {userJourneys[activeTab].title}
          </h3>
          <p className="text-sm sm:text-base md:text-lg text-secondary px-4 sm:px-0">
            {userJourneys[activeTab].subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {userJourneys[activeTab].steps.map((step, index) => (
            <Card
              key={index}
              className="p-4 sm:p-6 text-center border border-default hover:border-primary-300 transition-colors"
            >
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full flex items-center justify-center font-bold text-base sm:text-lg mx-auto mb-3 sm:mb-4 shadow-lg">
                {index + 1}
              </div>
              <h4 className="font-semibold text-primary mb-2 text-sm sm:text-base">{step.title}</h4>
              <p className="text-secondary text-xs sm:text-sm">{step.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-surface py-12 sm:py-16 border-t border-default">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3 sm:mb-4">
              ⚡ Why Hackathons Need This
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-secondary px-4 sm:px-0">
              Solving the three biggest problems that sink great hackathon
              projects
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
              className="p-4 sm:p-6 text-center hover:shadow-lg transition-all hover:border-primary-300 border border-default"
              >
                <feature.icon className="w-10 sm:w-12 h-10 sm:h-12 text-primary-500 mx-auto mb-3 sm:mb-4" />
                <h3 className="font-semibold text-primary mb-2 text-sm sm:text-base">
                  {feature.title}
                </h3>
                <p className="text-secondary text-xs sm:text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* How x402 Nanopayments Work — Visual Flow Diagram */}
      <div className="py-12 sm:py-16 bg-gradient-to-b from-teal-50 to-white border-t border-teal-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold mb-4">
              <BoltIcon className="w-3.5 h-3.5" /> Powered by Arc & x402
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              AI Agents, Paid Per Query
            </h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
              Each AI call costs fractions of a cent, settled instantly on Circle&apos;s Arc L2 via the x402 nanopayment protocol.
            </p>
          </div>

          {/* Visual Flow Diagram */}
          <div className="relative max-w-4xl mx-auto mb-10">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              {/* Step 1: User */}
              <div className="bg-white rounded-xl border-2 border-blue-200 shadow-sm p-4 text-center">
                <div className="text-3xl mb-2">👤</div>
                <p className="text-xs font-semibold text-gray-900">You</p>
                <p className="text-[10px] text-gray-500">Click &ldquo;Analyze&rdquo;</p>
              </div>
              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-400 mb-1">402</span>
                  <div className="w-full h-0.5 bg-gradient-to-r from-blue-300 to-teal-300 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-teal-400" />
                  </div>
                  <span className="text-xs text-gray-400 mt-1">USDC</span>
                </div>
              </div>
              <div className="md:hidden flex justify-center"><span className="text-gray-300 text-xl">↓</span></div>
              {/* Step 2: Gateway */}
              <div className="bg-white rounded-xl border-2 border-teal-200 shadow-sm p-4 text-center">
                <div className="text-3xl mb-2">🔐</div>
                <p className="text-xs font-semibold text-gray-900">Circle Gateway</p>
                <p className="text-[10px] text-gray-500">Signs USDC on Arc</p>
              </div>
              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-400 mb-1">settle</span>
                  <div className="w-full h-0.5 bg-gradient-to-r from-teal-300 to-purple-300 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-purple-400" />
                  </div>
                  <span className="text-xs text-gray-400 mt-1">result</span>
                </div>
              </div>
              <div className="md:hidden flex justify-center"><span className="text-gray-300 text-xl">↓</span></div>
              {/* Step 3: AI Agent */}
              <div className="bg-white rounded-xl border-2 border-purple-200 shadow-sm p-4 text-center">
                <div className="text-3xl mb-2">🤖</div>
                <p className="text-xs font-semibold text-gray-900">AI Agent</p>
                <p className="text-[10px] text-gray-500">Returns analysis</p>
              </div>
            </div>
            {/* Secondary payment: Agent → AIsa */}
            <div className="mt-4 flex justify-center">
              <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2 inline-flex items-center gap-3 text-xs text-gray-500">
                <span>🤖 Our Agent</span>
                <span className="text-gray-300">→ pays →</span>
                <span>🧠 AIsa (LLM)</span>
                <span className="text-gray-300">→ settled on</span>
                <span className="font-semibold text-teal-600">Arc L2</span>
              </div>
            </div>
          </div>

          {/* Agent Pricing + CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 bg-white border border-teal-200 rounded-lg text-xs font-medium text-teal-700">🤖 Underwriter — $0.05</span>
              <span className="px-3 py-1.5 bg-white border border-teal-200 rounded-lg text-xs font-medium text-teal-700">🔍 Scout — $0.01</span>
              <span className="px-3 py-1.5 bg-white border border-teal-200 rounded-lg text-xs font-medium text-teal-700">✅ Verifier — $0.001</span>
            </div>
            <Button
              onClick={() => router.push('/back')}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 text-sm font-semibold"
            >
              ⚡ Try AI Agents
            </Button>
          </div>
        </div>
      </div>

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
                onClick={() => router.push(`/explore?ecosystem=${ecosystem.id}`) }
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
            Join builders who are securing funding, tracking progress, and
            shipping successful projects through hackathons.
          </p>

          <div className="flex flex-col gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Button
              onClick={handleGetStarted}
              className="bg-surface text-blue-800 hover:bg-gray-100 px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold shadow-lg min-h-touch w-full sm:w-auto"
            >
              ✨ Create Your Portfolio
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
