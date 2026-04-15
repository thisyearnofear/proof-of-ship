/**
 * Backer Expedition Marketplace
 * Dedicated discovery page for backers to find and fund projects.
 */

import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useExpeditionData } from '@/hooks/useExpeditionData';
import ExpeditionCard from '@/components/expedition/ExpeditionCard';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { 
  MagnifyingGlassIcon, 
  RocketLaunchIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function ExpeditionPage() {
  const { projects, loading, error, refresh } = useExpeditionData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMultiplier, setFilterMultiplier] = useState('all');

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMultiplier = filterMultiplier === 'all' || 
                               p.activeMultiplier >= parseFloat(filterMultiplier);
      return matchesSearch && matchesMultiplier;
    });
  }, [projects, searchQuery, filterMultiplier]);

  const handleBackProject = (project) => {
    alert(`Initiating backing flow for ${project.name}. ROI Multiplier: ${project.activeMultiplier}x applied.`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Head>
        <title>Backer Expedition | Builder Credit Platform</title>
      </Head>

      {/* Hero Section */}
      <div className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-inner">
              <RocketLaunchIcon className="w-10 h-10 text-blue-100" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">Backer Expedition</h1>
              <p className="text-blue-100 text-lg md:text-xl mt-2 max-w-2xl">
                Scout high-potential builders, analyze their health metrics, and back their journey with tiered ROI multipliers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-blue-800/50 p-6 rounded-2xl border border-blue-600/50">
              <div className="text-blue-300 text-sm font-bold uppercase mb-1">Total Liquidity</div>
              <div className="text-3xl font-black">$1,240,500</div>
              <div className="text-blue-400 text-xs mt-2 flex items-center gap-1">
                <ChartBarIcon className="w-3 h-3" />
                +12% from last week
              </div>
            </div>
            <div className="bg-blue-800/50 p-6 rounded-2xl border border-blue-600/50">
              <div className="text-blue-300 text-sm font-bold uppercase mb-1">Active Expeditions</div>
              <div className="text-3xl font-black">42 Projects</div>
              <div className="text-blue-400 text-xs mt-2">18 closing soon</div>
            </div>
            <div className="bg-blue-800/50 p-6 rounded-2xl border border-blue-600/50">
              <div className="text-blue-300 text-sm font-bold uppercase mb-1">Avg. Multiplier</div>
              <div className="text-3xl font-black">2.4x</div>
              <div className="text-blue-400 text-xs mt-2">Tiered payout waterfall</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between">
          <div className="relative w-full md:max-w-lg">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search projects, builders, or technologies..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 bg-white min-h-touch"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 min-w-max min-h-touch">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Min. Multiplier:</span>
              <select 
                className="border-none focus:ring-0 text-sm font-bold text-blue-600 bg-transparent cursor-pointer min-h-touch"
                value={filterMultiplier}
                onChange={(e) => setFilterMultiplier(e.target.value)}
              >
                <option value="all">Any</option>
                <option value="1.5">1.5x +</option>
                <option value="2.0">2.0x +</option>
                <option value="3.0">3.0x</option>
              </select>
            </div>
            
            <Button variant="outline" className="bg-white min-h-touch min-w-touch" onClick={refresh}>
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500 mt-4 font-medium italic">Scouting the frontier for opportunities...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-8 text-center border-red-200 bg-red-50">
            <p className="text-red-600 font-bold mb-4">Error loading expedition: {error}</p>
            <Button onClick={refresh} variant="primary">Try Again</Button>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProjects.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No projects found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters or search query.</p>
            <Button variant="outline" className="mt-6" onClick={() => {setSearchQuery(''); setFilterMultiplier('all');}}>
              Clear all filters
            </Button>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && !error && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map(project => (
              <ExpeditionCard 
                key={project.id} 
                project={project} 
                onBack={handleBackProject}
              />
            ))}
          </div>
        )}
      </main>

      {/* Sticky Info Footer */}
      <div className="fixed bottom-8 right-8 hidden lg:block">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white max-w-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-gray-500 uppercase">Live Network Data</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Multipliers are dynamically adjusted based on project health scores and available treasury liquidity.
          </p>
        </div>
      </div>
    </div>
  );
}
