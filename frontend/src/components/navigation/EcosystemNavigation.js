import React from 'react';
import { useRouter } from 'next/router';
import { Card } from '../common/Card';
import Button from '../common/Button';
import {
  ChartBarIcon,
  CubeIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const ECOSYSTEMS = {
  celo: {
    name: 'Celo Ecosystem',
    shortName: 'Celo',
    description: 'Mobile-first blockchain projects focused on financial inclusion',
    color: '#35D07F',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    icon: '🌱',
    stats: { projects: 50, seasons: 3, category: 'Proof of Ship Program' },
    features: ['Multi-season tracking', 'GitHub analytics', 'Community metrics'],
    path: '/ecosystems/celo'
  },
  base: {
    name: 'Base Ecosystem',
    shortName: 'Base',
    description: 'Coinbase\'s L2 network enabling fast, low-cost applications',
    color: '#0052FF',
    bgGradient: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    icon: '🔵',
    stats: { projects: 12, growth: '+150%', category: 'L2 Innovation' },
    features: ['Low-fee transactions', 'Coinbase integration', 'Developer funding'],
    path: '/ecosystems/base'
  },
  papa: {
    name: 'Papa Dashboard',
    shortName: 'Papa',
    description: 'Multi-chain progress tracking across various networks',
    color: '#8B5CF6',
    bgGradient: 'from-purple-50 to-violet-50',
    borderColor: 'border-purple-200',
    icon: '📊',
    stats: { chains: 5, goals: 'Daily', category: 'Progress Tracking' },
    features: ['Multi-chain support', 'Goal tracking', 'Progress analytics'],
    path: '/papa'
  }
};

export default function EcosystemNavigation({ currentEcosystem = null }) {
  const router = useRouter();

  const handleEcosystemSelect = (ecosystem) => {
    router.push(ECOSYSTEMS[ecosystem].path);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Ecosystem
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore projects across different blockchain ecosystems. Each has its unique 
          characteristics, community, and opportunities.
        </p>
      </div>

      {/* Ecosystem Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(ECOSYSTEMS).map(([key, ecosystem]) => (
          <EcosystemCard
            key={key}
            ecosystem={ecosystem}
            isActive={currentEcosystem === key}
            onClick={() => handleEcosystemSelect(key)}
          />
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Platform Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">62+</div>
            <div className="text-sm text-gray-600">Total Projects</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">3</div>
            <div className="text-sm text-gray-600">Ecosystems</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">5</div>
            <div className="text-sm text-gray-600">Blockchain Networks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">$5K</div>
            <div className="text-sm text-gray-600">Max Funding</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EcosystemCard({ ecosystem, isActive, onClick }) {
  return (
    <Card 
      className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isActive 
          ? `bg-gradient-to-br ${ecosystem.bgGradient} border-2 ${ecosystem.borderColor} shadow-md` 
          : 'hover:shadow-md border-gray-200'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: ecosystem.color }}
          >
            {ecosystem.icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{ecosystem.name}</h3>
            <p className="text-sm text-gray-500">{ecosystem.stats.category}</p>
          </div>
        </div>
        {isActive && (
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
        {ecosystem.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        {Object.entries(ecosystem.stats).map(([key, value]) => (
          <div key={key} className="bg-white bg-opacity-50 rounded-lg p-2 text-center">
            <div className="font-semibold text-gray-900">{value}</div>
            <div className="text-gray-600 capitalize text-xs">{key}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-700 mb-2">Key Features:</div>
        <div className="flex flex-wrap gap-1">
          {ecosystem.features.map((feature, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-white bg-opacity-70 text-xs text-gray-700 rounded-full"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Button
        className={`w-full text-white ${
          isActive 
            ? 'bg-gray-800 hover:bg-gray-900' 
            : 'hover:opacity-90'
        }`}
        style={{ backgroundColor: isActive ? undefined : ecosystem.color }}
      >
        {isActive ? 'Currently Viewing' : 'Explore Projects'}
        {!isActive && <ArrowRightIcon className="w-4 h-4 ml-2" />}
      </Button>
    </Card>
  );
}
