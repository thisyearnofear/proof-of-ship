/**
 * Base Ecosystem Page
 * Dedicated page for exploring Base projects with submission capabilities
 */

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useEnhancedGithub } from '@/providers/Github/EnhancedGithubProvider';
import { useDecentralizedAuth } from '@/contexts/DecentralizedAuthContext';
import { Navbar, Footer } from '@/components/common/layout';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import { ProjectDetailCard, ProjectGridCard, ProjectListItem } from '@/components/projects/ProjectCard';
import { getEcosystemConfig } from '@/config/ecosystems';
import { filterProjects, sortProjects, calculateProjectStats } from '@/utils/projectUtils';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PlusIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const VIEW_MODES = {
  grid: { name: 'Grid', icon: Squares2X2Icon, component: ProjectGridCard, cols: 'md:grid-cols-2 lg:grid-cols-3' },
  detail: { name: 'Detail', icon: ViewColumnsIcon, component: ProjectDetailCard, cols: 'md:grid-cols-2' },
  list: { name: 'List', icon: ListBulletIcon, component: ProjectListItem, cols: 'grid-cols-1' }
};

const PROJECT_CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'defi', name: 'DeFi' },
  { id: 'nft', name: 'NFTs' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'social', name: 'Social' },
  { id: 'infrastructure', name: 'Infrastructure' },
  { id: 'dao', name: 'DAO' },
  { id: 'other', name: 'Other' }
];

export default function BaseEcosystemPage() {
  const router = useRouter();
  const { projectData, loading, submitProject } = useEnhancedGithub();
  const { userProfile, isAuthenticated } = useDecentralizedAuth();
  
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    fundingStatus: 'all',
    activeOnly: false,
    minHealthScore: 0,
    sortBy: 'recent',
    sortOrder: 'desc'
  });

  const ecosystemConfig = getEcosystemConfig('base');
  const baseProjects = projectData.base || [];

  // Process projects based on filters
  const processedProjects = useMemo(() => {
    let filtered = baseProjects;

    // Apply search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(project =>
        project.name?.toLowerCase().includes(searchTerm) ||
        project.slug?.toLowerCase().includes(searchTerm) ||
        project.description?.toLowerCase().includes(searchTerm) ||
        project.owner?.toLowerCase().includes(searchTerm) ||
        project.category?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(project => project.category === filters.category);
    }

    // Apply funding status filter
    if (filters.fundingStatus !== 'all') {
      if (filters.fundingStatus === 'seeking') {
        filtered = filtered.filter(project => project.lookingForFunding);
      } else if (filters.fundingStatus === 'funded') {
        filtered = filtered.filter(project => project.fundingReceived);
      }
    }

    // Apply other filters
    filtered = filterProjects(filtered, {
      activeOnly: filters.activeOnly,
      minHealthScore: filters.minHealthScore
    });

    // Apply sorting
    return sortProjects(filtered, filters.sortBy, filters.sortOrder);
  }, [baseProjects, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const baseStats = calculateProjectStats(processedProjects);
    return {
      ...baseStats,
      seekingFunding: processedProjects.filter(p => p.lookingForFunding).length,
      funded: processedProjects.filter(p => p.fundingReceived).length
    };
  }, [processedProjects]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleProjectClick = (project) => {
    router.push(`/projects/base/${project.slug}`);
  };

  const handleSubmitProject = () => {
    if (isAuthenticated) {
      router.push('/projects/new?ecosystem=base');
    } else {
      router.push('/signup?redirect=/projects/new');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-lg text-gray-600">Loading Base projects...</span>
        </div>
        <Footer />
      </div>
    );
  }

  const ViewComponent = VIEW_MODES[viewMode].component;
  const gridCols = VIEW_MODES[viewMode].cols;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back</span>
              </Button>
              
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: ecosystemConfig.color }}
                >
                  {ecosystemConfig.icon}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{ecosystemConfig.name}</h1>
                  <p className="text-lg text-gray-600">{ecosystemConfig.longDescription}</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmitProject}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Submit Project</span>
            </Button>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-6">
            {ecosystemConfig.features.map((feature, index) => (
              <span 
                key={index}
                className={`px-3 py-1 rounded-full text-sm font-medium ${ecosystemConfig.bgColor} ${ecosystemConfig.textColor}`}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Projects</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active Projects</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCommits}</div>
            <div className="text-sm text-gray-600">Total Commits</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.averageHealth}%</div>
            <div className="text-sm text-gray-600">Avg Health</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.seekingFunding}</div>
            <div className="text-sm text-gray-600">Seeking Funding</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.funded}</div>
            <div className="text-sm text-gray-600">Funded</div>
          </Card>
        </div>

        {/* Controls */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Base projects..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {PROJECT_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Funding Status Filter */}
              <select
                value={filters.fundingStatus}
                onChange={(e) => handleFilterChange('fundingStatus', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Projects</option>
                <option value="seeking">Seeking Funding</option>
                <option value="funded">Already Funded</option>
              </select>

              {/* Sort */}
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Recent</option>
                <option value="name">Name</option>
                <option value="commits">Commits</option>
                <option value="stars">Stars</option>
                <option value="health">Health Score</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                {Object.entries(VIEW_MODES).map(([mode, config]) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === mode
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title={config.name}
                  >
                    <config.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.activeOnly}
                  onChange={(e) => handleFilterChange('activeOnly', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Active projects only</span>
              </label>

              <div className="flex items-center space-x-2">
                <span className="text-sm">Min Health Score:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={filters.minHealthScore}
                  onChange={(e) => handleFilterChange('minHealthScore', parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm font-medium">{filters.minHealthScore}%</span>
              </div>

              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Projects */}
        {processedProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">{ecosystemConfig.icon}</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {baseProjects.length === 0 ? 'No Base projects yet' : 'No projects found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {baseProjects.length === 0 
                ? 'Be the first to submit a project to the Base ecosystem!'
                : 'Try adjusting your filters to see more projects.'
              }
            </p>
            {baseProjects.length === 0 && (
              <Button
                onClick={handleSubmitProject}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Submit First Project
              </Button>
            )}
          </Card>
        ) : (
          <div className={`grid gap-6 ${gridCols}`}>
            {processedProjects.map(project => (
              <ViewComponent
                key={project.slug}
                project={project}
                onClick={() => handleProjectClick(project)}
                showEcosystem={false}
              />
            ))}
          </div>
        )}

        {/* Funding CTA */}
        {userProfile && !userProfile.onboardingComplete && (
          <Card className="p-6 mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <CurrencyDollarIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Ready to build on Base?
                </h3>
                <p className="text-gray-600">
                  Get up to $5,000 USDC funding to build your Base project. Complete your developer profile to get started.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push('/credit')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white whitespace-nowrap"
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Get Funded
                </Button>
                <Button
                  onClick={handleSubmitProject}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Submit Project
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
