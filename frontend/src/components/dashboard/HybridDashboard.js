/**
 * Hybrid Dashboard Component
 * Main dashboard that combines overview, detailed, and ecosystem-specific views
 * Now with smart defaults and user behavior tracking
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useUserBehavior } from '../../contexts/AppContext';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { LoadingSpinner } from '../common/LoadingStates';
import EcosystemSection from './EcosystemSection';
import { getAllEcosystems } from '../../config/ecosystems';
import { 
  filterProjects, 
  sortProjects, 
  calculateProjectStats,
  searchProjects 
} from '../../utils/projectUtils';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  ChartBarIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const VIEW_MODES = {
  overview: { name: 'Overview', description: 'Quick preview of all ecosystems' },
  detailed: { name: 'Detailed', description: 'Full project information' },
  ecosystem: { name: 'By Ecosystem', description: 'Organized by blockchain network' }
};

export default function HybridDashboard({ 
  projects = {}, 
  loading = false, 
  userProfile = null,
  onProjectClick,
  className = ''
}) {
  const router = useRouter();
  const {
    preferences,
    smartDefaults,
    adaptiveSettings,
    personalizedRecommendations,
    trackViewModeChange,
    trackFilterUsage,
    trackEcosystemInteraction,
    getPreference
  } = useUserBehavior();
  
  // Initialize state with smart defaults
  const [viewMode, setViewMode] = useState(() => 
    getPreference('defaultViewMode', smartDefaults.defaultViewMode || 'overview')
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState(() => {
    const favoriteEcosystems = getPreference('favoriteEcosystems', ['arc', 'celo', 'base']);
    const initial = {};
    getAllEcosystems().forEach((eco) => {
      initial[eco.id] = favoriteEcosystems.includes(eco.id);
    });
    return initial;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [filters, setFilters] = useState(() => ({
    activeOnly: getPreference('showInactiveProjects', false) ? false : true,
    minHealthScore: getPreference('minHealthScore', 0),
    sortBy: getPreference('defaultSort', 'recent'),
    sortOrder: getPreference('defaultSortOrder', 'desc')
  }));

  // Apply smart defaults when user behavior data loads
  useEffect(() => {
    if (smartDefaults.defaultViewMode && smartDefaults.defaultViewMode !== viewMode) {
      setViewMode(smartDefaults.defaultViewMode);
    }
    if (userProfile?.preferences?.defaultFilters) {
      setFilters(prev => ({ ...prev, ...userProfile.preferences.defaultFilters }));
    }
  }, [userProfile]);

  // Memoized filtered and sorted projects
  const processedProjects = useMemo(() => {
    const result = {};
    
    Object.entries(projects).forEach(([ecosystem, projectList]) => {
      if (!Array.isArray(projectList)) return;
      
      let processed = projectList;
      
      // Apply search
      if (searchTerm) {
        processed = searchProjects(processed, searchTerm);
      }
      
      // Apply filters
      processed = filterProjects(processed, {
        activeOnly: filters.activeOnly,
        minHealthScore: filters.minHealthScore
      });
      
      // Apply sorting
      processed = sortProjects(processed, filters.sortBy, filters.sortOrder);
      
      result[ecosystem] = processed;
    });
    
    return result;
  }, [projects, searchTerm, filters]);

  // Get preview projects (limited for overview mode)
  const getPreviewProjects = (ecosystem, projectList) => {
    if (viewMode !== 'overview') return projectList;
    return projectList.slice(0, 4); // Show only 4 projects in overview
  };

  // Calculate total stats
  const totalStats = useMemo(() => {
    const allProjects = Object.values(processedProjects).flat();
    return calculateProjectStats(allProjects);
  }, [processedProjects]);

  // Handle section toggle
  const handleSectionToggle = (ecosystem) => {
    setExpandedSections(prev => ({
      ...prev,
      [ecosystem]: !prev[ecosystem]
    }));
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    
    // Auto-expand sections in detailed view
    if (mode === 'detailed') {
      const allExpanded = {};
      getAllEcosystems().forEach((eco) => { allExpanded[eco.id] = true; });
      setExpandedSections(allExpanded);
    }
  };

      if (loading) {
    return (
      <div className="space-y-6">
        {/* Quick Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="h-5 w-20 rounded mb-2 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="h-8 w-32 mb-2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-10 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="h-12 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />

        {/* Project Grid Skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="h-4 w-3/4 mb-2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="h-3 w-1/2 mb-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 4 }).map((_, k) => (
                        <div key={k} className="text-center">
                          <div className="h-4 w-full mx-auto mb-1 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                          <div className="h-3 w-full mx-auto rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <DashboardHeader
        totalStats={totalStats}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Quick Stats */}
      <QuickStats stats={totalStats} />

      {/* Main Content */}
      <div className="space-y-6">
        {Object.entries(processedProjects).map(([ecosystem, projectList]) => {
          const originalList = projects[ecosystem] || [];
          const previewList = getPreviewProjects(ecosystem, projectList);
          
          return (
            <EcosystemSection
              key={ecosystem}
              ecosystem={ecosystem}
              projects={previewList}
              totalProjects={originalList.length}
              isExpanded={expandedSections[ecosystem]}
              onToggle={() => handleSectionToggle(ecosystem)}
              viewMode={viewMode === 'overview' ? 'preview' : 'detail'}
              showControls={viewMode !== 'overview'}
              onProjectClick={onProjectClick}
            />
          );
        })}
      </div>

      {/* Call to Action */}
      {userProfile && !userProfile.onboardingComplete && (
        <CallToAction userProfile={userProfile} />
      )}
    </div>
  );
}

/**
 * Dashboard Header Component
 */
function DashboardHeader({
  totalStats,
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchChange,
  showSettings,
  onToggleSettings
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Projects
        </h1>
        <p className="text-sm text-gray-500">
          {totalStats.total} across {totalStats.ecosystems} ecosystems
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
          />
        </div>

        <select
          value={viewMode}
          onChange={(e) => onViewModeChange(e.target.value)}
          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
        >
          {Object.entries(VIEW_MODES).map(([mode, config]) => (
            <option key={mode} value={mode}>{config.name}</option>
          ))}
        </select>

        <button
          onClick={onToggleSettings}
          className={`p-1.5 rounded-lg border transition-colors ${showSettings ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'}`}
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

/**
 * Settings Panel Component
 */
function SettingsPanel({ filters, onFilterChange, onClose }) {
  return (
    <Card className="p-6 bg-gray-50 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter & Sort Options</h3>
        <Button onClick={onClose} variant="ghost" size="sm">
          ✕
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {/* Active Only */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.activeOnly}
              onChange={(e) => onFilterChange('activeOnly', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Active projects only</span>
          </label>
        </div>

        {/* Min Health Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Health Score: {filters.minHealthScore}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={filters.minHealthScore}
            onChange={(e) => onFilterChange('minHealthScore', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort by
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="name">Name</option>
            <option value="commits">Commits</option>
            <option value="stars">Stars</option>
            <option value="health">Health Score</option>
            <option value="recent">Recent Activity</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order
          </label>
          <select
            value={filters.sortOrder}
            onChange={(e) => onFilterChange('sortOrder', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
    </Card>
  );
}

/**
 * Quick Stats Component
 */
function QuickStats({ stats }) {
  const statItems = [
    {
      title: 'Total Projects',
      value: stats.total,
      icon: ChartBarIcon,
      color: 'blue'
    },
    {
      title: 'Active Projects',
      value: stats.active,
      icon: GlobeAltIcon,
      color: 'green'
    },
    {
      title: 'Ecosystems',
      value: stats.ecosystems,
      icon: SparklesIcon,
      color: 'purple'
    },
    {
      title: 'Market Capital',
      value: '—',
      icon: CurrencyDollarIcon,
      color: 'yellow',
      subtitle: 'Connect wallet to view'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600'
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[item.color]}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{item.value}</div>
              <div className="text-sm text-gray-600">{item.title}</div>
              {item.subtitle && (
                <div className="text-xs text-gray-500">{item.subtitle}</div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Call to Action Component
 */
function CallToAction({ userProfile }) {
  const router = useRouter();

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-blue-600" />
            Ready to get funded?
          </h3>
          <p className="text-gray-600">
            Complete your developer profile to unlock funding opportunities up to $5,000 USDC.
          </p>
        </div>
        <Button
          onClick={() => router.push('/credit')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white whitespace-nowrap"
        >
          Get Credit Score
        </Button>
      </div>
    </Card>
  );
}
