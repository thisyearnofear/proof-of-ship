import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

import Button from "@/components/common/Button";
import { Card } from "@/components/common/Card";
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
} from "@heroicons/react/24/outline";

export default function LandingPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("developers");

  const features = [
    {
      icon: RocketLaunchIcon,
      title: "⚓ Pre-Launch Funding",
      description:
        "Borrow against future hackathon prizes. Get $500-$5K USDC upfront to cover development costs, gas fees, and infrastructure.",
    },
    {
      icon: EyeIcon,
      title: "🧭 Real-Time Progress Tracking",
      description:
        "Sponsors and organizers can monitor your journey from first commit to final deployment. No more last-minute surprises.",
    },
    {
      icon: ClockIcon,
      title: "⏰ Workshop Incentives",
      description:
        "Attend key workshops and hit milestones to unlock lower interest rates or even free funding. Build better, learn faster.",
    },
    {
      icon: UserGroupIcon,
      title: "🚢 Fleet Support",
      description:
        "Connect with partner teams and mentors early. Get curated assistance finding your first users before the deadline hits.",
    },
  ];

  const ecosystems = [
    {
      id: "celo",
      name: "⛵ Celo Fleet",
      description:
        "Navigate through three seasons of Celo's Proof of Ship program. Track the voyage of 50+ projects from idea to deployment.",
      count: "3 Seasons Sailed",
      color: "bg-emerald-500",
      icon: "🌊",
    },
    {
      id: "base",
      name: "🏴‍☠️ Base Expeditions",
      description:
        "Chart new territories on Coinbase's Base network. Join the growing armada of builders exploring uncharted waters.",
      count: "Setting Sail",
      color: "bg-blue-600",
      icon: "⚓",
    },
    {
      id: "papa",
      name: "🧭 Navigator's Log",
      description:
        "Daily progress tracking across multiple chains. Your compass for navigating Lens, Optimism, Polygon, Mantle, and Base.",
      count: "Multi-Chain Routes",
      color: "bg-indigo-500",
      icon: "🗺️",
    },
  ];

  const userJourneys = {
    developers: {
      title: "🏴‍☠️ For Builders",
      subtitle: "Chart your course, secure provisions, ship with confidence",
      steps: [
        {
          title: "⚓ Drop Anchor",
          desc: "Connect GitHub, Farcaster, Lens, and wallet to establish your maritime credentials",
        },
        {
          title: "🧭 Get Navigation Rating",
          desc: "AI analyzes your sailing history across platforms to determine creditworthiness",
        },
        {
          title: "💰 Secure Provisions",
          desc: "Borrow $500-$5K USDC against future prize treasure to fund your expedition",
        },
        {
          title: "🚢 Set Sail & Ship",
          desc: "Build with confidence while we track your progress and provide wind in your sails",
        },
      ],
    },
    organizers: {
      title: "🏛️ For Organizers",
      subtitle: "Command your fleet, track all vessels, ensure safe passage",
      steps: [
        {
          title: "📡 Deploy Lighthouse",
          desc: "Set up real-time tracking for all participating builders in your hackathon",
        },
        {
          title: "🗺️ Monitor Fleet Progress",
          desc: "Watch commits, deployments, and workshop attendance across your entire armada",
        },
        {
          title: "⚡ Incentivize Navigation",
          desc: "Reward workshop attendance and milestone completion with better funding terms",
        },
        {
          title: "🏆 Celebrate Arrivals",
          desc: "Automatically distribute prizes and recognize successful voyages",
        },
      ],
    },
    sponsors: {
      title: "💎 For Sponsors",
      subtitle: "Fund proven captains, minimize storms, maximize treasure",
      steps: [
        {
          title: "🔍 Scout the Harbor",
          desc: "Review builder reputation scores and previous successful voyages",
        },
        {
          title: "💸 Fund Expeditions",
          desc: "Smart contracts automatically distribute provisions based on sailing credentials",
        },
        {
          title: "📊 Track the Fleet",
          desc: "Monitor progress and milestone completion across all funded expeditions",
        },
        {
          title: "🎯 Measure Impact",
          desc: "See the successful ships and captains your sponsorship helped launch",
        },
      ],
    },
  };

  const handleGetStarted = () => {
    if (currentUser) {
      router.push("/credit");
    } else {
      router.push("/login");
    }
  };

  const handleExploreFleet = () => {
    router.push("/shippers");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50 wave-pattern">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Nautical background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 text-6xl">⚓</div>
          <div className="absolute top-40 right-20 text-4xl">🧭</div>
          <div className="absolute bottom-20 left-1/4 text-5xl">⛵</div>
          <div className="absolute top-60 left-1/3 text-3xl">🌊</div>
          <div className="absolute bottom-40 right-1/3 text-4xl">🗺️</div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full text-sm font-medium border border-blue-200 shadow-lg">
                <span className="text-lg">⚓</span>
                <span>Hackathon Funding & Progress Tracking</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Anchor your
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {" "}
                Funding
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Borrow against hackathon prizes, based on momentum, participation,
              and real-time progress tracking. Unlock better funding terms by
              hitting milestones and attending workshops.{" "}
              <strong>Ship code. Navigate to Funded Success.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 text-lg font-semibold shadow-lg border border-blue-200 tide-button maritime-depth"
              >
                ⚓ Secure Funding
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>

              <Button
                onClick={handleExploreFleet}
                variant="outline"
                className="px-8 py-4 text-lg font-semibold border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                🗺️ Explore Fleet
              </Button>
            </div>

            <div className="mt-12 flex justify-center items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span className="text-green-500">⚓</span>
                <span>Borrow Against Prizes</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">🧭</span>
                <span>Real-Time Tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">🌊</span>
                <span>Cross-Chain Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Journey Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            🚢 All Hands on Deck
          </h2>
          <p className="text-lg text-gray-600">
            Whether you're sailing solo, commanding a fleet, or funding
            expeditions - every role has a place when you prove you ship.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200">
            {Object.keys(userJourneys).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === key
                    ? "bg-white text-blue-600 shadow-sm border border-blue-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {userJourneys[key].title}
              </button>
            ))}
          </div>
        </div>

        {/* Active Tab Content */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {userJourneys[activeTab].title}
          </h3>
          <p className="text-lg text-gray-600">
            {userJourneys[activeTab].subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {userJourneys[activeTab].steps.map((step, index) => (
            <Card
              key={index}
              className="p-6 text-center border border-slate-200 hover:border-blue-300 transition-colors nautical-card compass-rose"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4 shadow-lg">
                {index + 1}
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
              <p className="text-gray-600 text-sm">{step.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ⚡ Why Hackathons Need This
            </h2>
            <p className="text-lg text-gray-600">
              Solving the three biggest problems that sink great hackathon
              projects
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 text-center hover:shadow-lg transition-all hover:border-blue-300 border border-slate-200 nautical-card lighthouse-beam"
              >
                <feature.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Ecosystems Section */}
      <div className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🗺️ Chart Your Course
            </h2>
            <p className="text-lg text-gray-600">
              Navigate through different blockchain territories and track your
              expedition's progress
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {ecosystems.map((ecosystem) => (
              <Card
                key={ecosystem.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer border border-slate-200 hover:border-blue-300 bg-white nautical-card anchor-accent"
                onClick={() =>
                  router.push(ecosystem.id === "papa" ? "/papa" : "/shippers")
                }
              >
                <div className="flex items-center mb-4">
                  <div
                    className={`w-12 h-12 ${ecosystem.color} rounded-lg flex items-center justify-center text-white text-xl mr-4 shadow-md`}
                  >
                    {ecosystem.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {ecosystem.name}
                    </h3>
                    <p className="text-sm text-gray-500">{ecosystem.count}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  {ecosystem.description}
                </p>
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  🧭 Explore Territory
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 py-16 relative overflow-hidden">
        {/* Nautical background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-4xl">⚓</div>
          <div className="absolute bottom-10 right-10 text-4xl">🌊</div>
          <div className="absolute top-1/2 left-1/4 text-3xl">⛵</div>
          <div className="absolute top-1/3 right-1/4 text-3xl">🧭</div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl font-bold text-white mb-4">
            ⚓ Ready to Set Sail?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the growing fleet of builders who are securing funding,
            tracking progress, and shipping successful projects through
            hackathons.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              className="bg-white text-blue-800 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg"
            >
              🚢 Launch Your Expedition
            </Button>

            <Button
              onClick={() => router.push("/about")}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold"
            >
              📖 Read the Captain's Log
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
