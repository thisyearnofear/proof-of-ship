import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar, Footer } from '@/components/common/layout';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { 
  ChartBarIcon, 
  CreditCardIcon, 
  GlobeAltIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('developers');

  const features = [
    {
      icon: ChartBarIcon,
      title: 'AI-Powered Credit Scoring',
      description: 'Advanced algorithms analyze your GitHub activity, social reputation, and on-chain behavior to create a comprehensive creditworthiness score.'
    },
    {
      icon: CreditCardIcon,
      title: 'Instant USDC Funding',
      description: 'Get $500-$5,000 USDC funding instantly based on your credit score. No lengthy applications or waiting periods.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Cross-Chain Distribution',
      description: 'Receive funding across multiple chains including Ethereum, Base, Celo, and Linea using LI.FI infrastructure.'
    },
    {
      icon: UserGroupIcon,
      title: 'Multi-Protocol Reputation',
      description: 'Leverage your reputation from GitHub, Farcaster, Lens Protocol, and on-chain activity for maximum funding potential.'
    }
  ];

  const ecosystems = [
    {
      id: 'celo',
      name: 'Celo Projects',
      description: 'Track and showcase projects built during Celo\'s Proof of Ship program across three seasons.',
      count: '50+ Projects',
      color: 'bg-green-500',
      icon: '🌱'
    },
    {
      id: 'base',
      name: 'Base Projects',
      description: 'Discover innovative projects building on Coinbase\'s Base network.',
      count: 'Growing Fast',
      color: 'bg-blue-500',
      icon: '🔵'
    },
    {
      id: 'papa',
      name: 'Papa Dashboard',
      description: 'Daily goals and progress tracking across Lens, Optimism, Polygon, Mantle, and Base.',
      count: 'Multi-Chain',
      color: 'bg-purple-500',
      icon: '📊'
    }
  ];

  const userJourneys = {
    developers: {
      title: 'For Developers',
      subtitle: 'Build your reputation, get funded, ship faster',
      steps: [
        { title: 'Connect Your Profiles', desc: 'Link GitHub, Farcaster, Lens, and MetaMask wallet' },
        { title: 'Get Credit Scored', desc: 'AI analyzes your activity and reputation across platforms' },
        { title: 'Receive Instant Funding', desc: 'Get $500-$5K USDC distributed across multiple chains' },
        { title: 'Build & Ship', desc: 'Focus on building while we track your milestones' }
      ]
    },
    projects: {
      title: 'For Projects',
      subtitle: 'Showcase your work, track progress, build community',
      steps: [
        { title: 'Submit Your Project', desc: 'Add your project to Celo or Base ecosystem dashboards' },
        { title: 'Track Metrics', desc: 'Monitor commits, issues, PRs, and community engagement' },
        { title: 'Build Reputation', desc: 'Showcase your progress and attract contributors' },
        { title: 'Get Discovered', desc: 'Connect with other builders and potential funders' }
      ]
    },
    sponsors: {
      title: 'For Sponsors',
      subtitle: 'Fund proven builders, minimize risk, maximize impact',
      steps: [
        { title: 'Browse Builder Profiles', desc: 'See comprehensive reputation scores and project history' },
        { title: 'Fund Automatically', desc: 'Smart contracts distribute funds based on creditworthiness' },
        { title: 'Track Milestones', desc: 'Monitor progress and milestone completion in real-time' },
        { title: 'Measure Impact', desc: 'See the projects and builders you\'ve helped succeed' }
      ]
    }
  };

  const handleGetStarted = () => {
    if (currentUser) {
      router.push('/credit');
    } else {
      router.push('/login');
    }
  };

  const handleExploreProjects = () => {
    router.push('/shippers');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                <SparklesIcon className="w-4 h-4" />
                <span>AI-Powered Developer Funding Platform</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Reputation
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {' '}Unlocks Funding
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The first platform to provide instant USDC funding to developers based on their 
              GitHub activity, social reputation, and on-chain behavior. Build your credit score, 
              get funded, and ship faster.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold"
              >
                Get Instant Funding
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
              
              <Button
                onClick={handleExploreProjects}
                variant="outline"
                className="px-8 py-4 text-lg font-semibold border-2"
              >
                Explore Projects
              </Button>
            </div>
            
            <div className="mt-12 flex justify-center items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span>MetaMask Integration</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span>Circle USDC</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span>LI.FI Cross-Chain</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Journey Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Built for Everyone in Web3
          </h2>
          <p className="text-lg text-gray-600">
            Whether you're building, funding, or showcasing - we've got you covered
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 p-1 rounded-lg">
            {Object.keys(userJourneys).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
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
            <Card key={index} className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                {index + 1}
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
              <p className="text-gray-600 text-sm">{step.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powered by Advanced Technology
            </h2>
            <p className="text-lg text-gray-600">
              Cutting-edge AI and blockchain infrastructure working together
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <feature.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Ecosystems Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Multi-Chain Ecosystem Support
            </h2>
            <p className="text-lg text-gray-600">
              Track and fund projects across multiple blockchain ecosystems
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {ecosystems.map((ecosystem) => (
              <Card key={ecosystem.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(ecosystem.id === 'papa' ? '/papa' : '/shippers')}>
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 ${ecosystem.color} rounded-lg flex items-center justify-center text-white text-xl mr-4`}>
                    {ecosystem.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{ecosystem.name}</h3>
                    <p className="text-sm text-gray-500">{ecosystem.count}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">{ecosystem.description}</p>
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  Explore Projects
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Funded?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of developers who are already building their reputation 
            and accessing instant funding through our platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              Start Building Credit
            </Button>
            
            <Button
              onClick={() => router.push('/about')}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
