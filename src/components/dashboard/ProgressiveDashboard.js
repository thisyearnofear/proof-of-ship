import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const COMPLEXITY_LEVELS = {
  simple: {
    name: 'Simple View',
    description: 'Essential information only',
    features: ['Project names', 'Basic stats', 'Ecosystem badges']
  },
  detailed: {
    name: 'Detailed View', 
    description: 'More project information',
    features: ['Descriptions', 'Health scores', 'Activity status', 'Filtering']
  },
  advanced: {
    name: 'Advanced View',
    description: 'Full analytics and controls',
    features: ['All metrics', 'Advanced filters', 'Sorting options', 'Bulk actions']
  }
};

export default function ProgressiveDashboard({ projects, loading }) {
  const [complexityLevel, setComplexityLevel] = useState('simple');
  const [expandedSections, setExpandedSections] = useState({
    celo: true,
    base: true,
    papa: false
  });
  const [userPreferences, setUserPreferences] = useState({
    showInactive: false,
    sortBy: 'name',
    groupBy: 'ecosystem'
  });

  // Auto-upgrade complexity based on user behavior
  useEffect(() => {
    const userInteractions = localStorage.getItem('dashboard_interactions') || '0';
    const interactionCount = parseInt(userInteractions);
    
    if (interactionCount > 10 && complexityLevel === 'simple') {
      setComplexityLevel('detailed');
    } else if (interactionCount > 25 && complexityLevel === 'detailed') {
      setComplexityLevel('advanced');
    }
  }, []);

  const toggleSection = (ecosystem) => {
    setExpandedSections(prev => ({
      ...prev,
      [ecosystem]: !prev[ecosystem]
    }));
    
    // Track user interaction
    const currentCount = parseInt(localStorage.getItem('dashboard_interactions') || '0');
    localStorage.setItem('dashboard_interactions', (currentCount + 1).toString());
  };

  const getVisibleProjects = (ecosystem, projectList) => {
    if (!projectList) return [];
    
    let filtered = projectList;
    
    // Apply user preferences
    if (!userPreferences.showInactive) {
      filtered = filtered.filter(p => p.stats?.isActive !== false);
    }
    
    // Limit based on complexity level
    const limits = { simple: 6, detailed: 12, advanced: Infinity };
    const limit = limits[complexityLevel];
    
    return filtered.slice(0, limit);
  };

  return (
    <div className="space-y-6">
      {/* Smart Header */}
      <DashboardHeader 
        complexityLevel={complexityLevel}
        onComplexityChange={setComplexityLevel}
        projects={projects}
        userPreferences={userPreferences}
        onPreferencesChange={setUserPreferences}
      />

      {/* Ecosystem Sections */}
      <div className="space-y-4">
        {Object.entries(projects || {}).map(([ecosystem, projectList]) => (
          <EcosystemSection
            key={ecosystem}
            ecosystem={ecosystem}
            projects={getVisibleProjects(ecosystem, projectList)}
            totalProjects={projectList?.length || 0}
            isExpanded={expandedSections[ecosystem]}
            onToggle={() => toggleSection(ecosystem)}
            complexityLevel={complexityLevel}
            showControls={complexityLevel !== 'simple'}
          />
        ))}
      </div>

      {/* Progressive Enhancement Hints */}
      {complexityLevel === 'simple' && (
        <UpgradeHint onUpgrade={() => setComplexityLevel('detailed')} />
      )}
    </div>
  );
}

function DashboardHeader({ complexityLevel, onComplexityChange, projects, userPreferences, onPreferencesChange }) {
  const [showSettings, setShowSettings] = useState(false);
  
  const totalProjects = Object.values(projects || {}).reduce((sum, list) => sum + (list?.length || 0), 0);
  const activeProjects = Object.values(projects || {}).reduce((sum, list) => 
    sum + (list?.filter(p => p.stats?.isActive).length || 0), 0
  );

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Project Dashboard</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
          <span>{totalProjects} total projects</span>
          {complexityLevel !== 'simple' && (
            <>
              <span>•</span>
              <span>{activeProjects} active</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Complexity Level Selector */}
        {complexityLevel !== 'simple' && (
          <select
            value={complexityLevel}
            onChange={(e) => onComplexityChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(COMPLEXITY_LEVELS).map(([level, config]) => (
              <option key={level} value={level}>{config.name}</option>
            ))}
          </select>
        )}

        {/* Settings Toggle */}
        {complexityLevel === 'advanced' && (
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span>Settings</span>
          </Button>
        )}
      </div>

      {/* Advanced Settings Panel */}
      {showSettings && complexityLevel === 'advanced' && (
        <Card className="absolute top-full right-0 mt-2 p-4 w-64 shadow-lg z-10">
          <h3 className="font-semibold text-gray-900 mb-3">Dashboard Settings</h3>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={userPreferences.showInactive}
                onChange={(e) => onPreferencesChange(prev => ({
                  ...prev,
                  showInactive: e.target.checked
                }))}
                className="rounded border-gray-300"
              />
              <span>Show inactive projects</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <select
                value={userPreferences.sortBy}
                onChange={(e) => onPreferencesChange(prev => ({
                  ...prev,
                  sortBy: e.target.value
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="name">Name</option>
                <option value="activity">Recent Activity</option>
                <option value="health">Health Score</option>
                <option value="commits">Commit Count</option>
              </select>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function EcosystemSection({ 
  ecosystem, 
  projects, 
  totalProjects, 
  isExpanded, 
  onToggle, 
  complexityLevel,
  showControls 
}) {
  const ecosystemConfig = {
    celo: { name: 'Celo Projects', icon: '🌱', color: 'green', description: 'Mobile-first blockchain projects' },
    base: { name: 'Base Projects', icon: '🔵', color: 'blue', description: 'Coinbase L2 applications' },
    papa: { name: 'Papa Dashboard', icon: '📊', color: 'purple', description: 'Multi-chain progress tracking' }
  };

  const config = ecosystemConfig[ecosystem];
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800', 
    purple: 'bg-purple-50 border-purple-200 text-purple-800'
  };

  return (
    <Card className="overflow-hidden">
      {/* Section Header */}
      <div 
        className={`p-4 cursor-pointer ${colorClasses[config.color]} border-l-4`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl">{config.icon}</span>
            <div>
              <h3 className="font-semibold text-lg">{config.name}</h3>
              {complexityLevel !== 'simple' && (
                <p className="text-sm opacity-75">{config.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="font-semibold">
                {isExpanded ? projects.length : totalProjects}
                {!isExpanded && totalProjects > projects.length && ` of ${totalProjects}`}
              </div>
              <div className="text-sm opacity-75">projects</div>
            </div>
            
            {isExpanded ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {isExpanded && (
        <div className="p-4">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No projects to display
            </div>
          ) : (
            <>
              <div className={`grid gap-4 ${
                complexityLevel === 'simple' ? 'md:grid-cols-2 lg:grid-cols-3' :
                complexityLevel === 'detailed' ? 'md:grid-cols-2' :
                'md:grid-cols-1 lg:grid-cols-2'
              }`}>
                {projects.map(project => (
                  <ProjectCard
                    key={project.slug}
                    project={project}
                    complexityLevel={complexityLevel}
                  />
                ))}
              </div>
              
              {/* Show More Button */}
              {totalProjects > projects.length && (
                <div className="text-center mt-4">
                  <Button variant="outline" className="text-sm">
                    Show {Math.min(6, totalProjects - projects.length)} more projects
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function ProjectCard({ project, complexityLevel }) {
  const isSimple = complexityLevel === 'simple';
  const isDetailed = complexityLevel === 'detailed';
  
  return (
    <Card className={`p-4 hover:shadow-md transition-shadow ${isSimple ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 flex-1">
          {project.name || project.slug}
        </h4>
        {!isSimple && project.stats?.isActive && (
          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
        )}
      </div>

      {!isSimple && project.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-3 text-gray-500">
          {isSimple ? (
            <span>{project.stats?.commits || 0} commits</span>
          ) : (
            <>
              <span>{project.stats?.commits || 0} commits</span>
              <span>{project.stats?.stars || 0} stars</span>
              {complexityLevel === 'advanced' && (
                <span>{project.stats?.issues || 0} issues</span>
              )}
            </>
          )}
        </div>

        {isDetailed && project.stats?.healthScore && (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            project.stats.healthScore >= 80 ? 'bg-green-100 text-green-800' :
            project.stats.healthScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {project.stats.healthScore}%
          </div>
        )}
      </div>
    </Card>
  );
}

function UpgradeHint({ onUpgrade }) {
  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-blue-900">Want to see more details?</h3>
          <p className="text-blue-700 text-sm">
            Upgrade to detailed view for project descriptions, health scores, and filtering options.
          </p>
        </div>
        <Button
          onClick={onUpgrade}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Upgrade View
        </Button>
      </div>
    </Card>
  );
}
