/**
 * Hybrid Dashboard Component
 * Main dashboard that combines overview, detailed, and ecosystem-specific views
 * Now with smart defaults and user behavior tracking
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useUserBehavior } from '../../contexts/UserBehaviorContext';
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
    const favoriteEcosystems = getPreference('favoriteEcosystems', ['celo', 'base']);
    return {
      celo: favoriteEcosystems.includes('celo'),
      base: favoriteEcosystems.includes('base'),
      papa: favoriteEcosystems.includes('papa')
    };
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
      setExpandedSections({
        celo: true,
        base: true,
        papa: true
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-lg text-gray-600">Loading projects...</span>
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
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Multi-Chain Project Explorer
        </h1>
        <p className="text-lg text-gray-600 mt-1">
          {totalStats.total} projects across {totalStats.ecosystems} blockchain ecosystems
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
          />
        </div>

        {/* View Mode */}
        <select
          value={viewMode}
          onChange={(e) => onViewModeChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {Object.entries(VIEW_MODES).map(([mode, config]) => (
            <option key={mode} value={mode}>
              {config.name}
            </option>
          ))}
        </select>

        {/* Settings */}
        <Button
          onClick={onToggleSettings}
          variant="outline"
          className={`flex items-center space-x-2 ${showSettings ? 'bg-blue-50 border-blue-300' : ''}`}
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4" />
          <span>Filters</span>
        </Button>
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
      title: 'Max Funding',
      value: '$5K',
      icon: CurrencyDollarIcon,
      color: 'yellow',
      subtitle: 'Per developer'
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
