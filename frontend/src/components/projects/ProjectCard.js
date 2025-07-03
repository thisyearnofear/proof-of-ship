/**
 * Project Card Components
 * Reusable project display components with different variants
 */

import React from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { getEcosystemConfig, getEcosystemClasses } from '../../config/ecosystems';
import { getGitHubUrl } from '../../utils/projectUtils';
import {
  StarIcon,
  CodeBracketIcon,
  ExclamationCircleIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

/**
 * Base Project Card - Foundation for all variants
 */
export const BaseProjectCard = ({ 
  project, 
  variant = 'default',
  showEcosystem = false,
  onClick,
  className = '',
  children 
}) => {
  const ecosystemConfig = getEcosystemConfig(project.ecosystem);
  const classes = getEcosystemClasses(project.ecosystem);
  
  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </Card>
  );
};

/**
 * Project Preview Card - Minimal info for overview mode
 */
export const ProjectPreviewCard = ({ project, onClick }) => {
  const ecosystemConfig = getEcosystemConfig(project.ecosystem);
  
  return (
    <BaseProjectCard project={project} onClick={onClick} className="p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 truncate flex-1 pr-2">
          {project.name || project.slug}
        </h4>
        {project.stats?.isActive && (
          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
        )}
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{project.stats?.commits || 0} commits</span>
        {ecosystemConfig && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ecosystemConfig.bgColor} ${ecosystemConfig.textColor}`}>
            {ecosystemConfig.shortName}
          </span>
        )}
      </div>
    </BaseProjectCard>
  );
};

/**
 * Project Detail Card - Full information display
 */
export const ProjectDetailCard = ({ project, showEcosystem = true, onClick }) => {
  const ecosystemConfig = getEcosystemConfig(project.ecosystem);
  const githubUrl = getGitHubUrl(project);
  
  const handleLinkClick = (e, url) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <BaseProjectCard project={project} onClick={onClick} className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">
            {project.name || project.slug}
          </h4>
          {showEcosystem && ecosystemConfig && (
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${ecosystemConfig.bgColor} ${ecosystemConfig.textColor}`}>
                <span>{ecosystemConfig.icon}</span>
                <span>{ecosystemConfig.shortName}</span>
              </span>
              {project.season && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  Season {project.season}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {project.stats?.isActive && (
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          )}
          {project.lookingForFunding && (
            <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
              Seeking Funding
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {project.description}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-500">
          <CodeBracketIcon className="w-4 h-4" />
          <span>{project.stats?.commits || 0} commits</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-500">
          <StarIcon className="w-4 h-4" />
          <span>{project.stats?.stars || 0} stars</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-500">
          <ExclamationCircleIcon className="w-4 h-4" />
          <span>{project.stats?.issues || 0} issues</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-500">
          <UserGroupIcon className="w-4 h-4" />
          <span>{project.stats?.forks || 0} forks</span>
        </div>
      </div>

      {/* Health Score */}
      {project.stats?.healthScore && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Health Score</span>
            <span className="font-medium">{project.stats.healthScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                project.stats.healthScore >= 80 ? 'bg-green-500' :
                project.stats.healthScore >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${project.stats.healthScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          {project.stats?.lastCommit && (
            <div className="flex items-center space-x-1">
              <CalendarIcon className="w-3 h-3" />
              <span>
                {new Date(project.stats.lastCommit).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {githubUrl && (
            <Button
              onClick={(e) => handleLinkClick(e, githubUrl)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <ArrowTopRightOnSquareIcon className="w-3 h-3 mr-1" />
              GitHub
            </Button>
          )}
          {project.website && (
            <Button
              onClick={(e) => handleLinkClick(e, project.website)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <ArrowTopRightOnSquareIcon className="w-3 h-3 mr-1" />
              Website
            </Button>
          )}
        </div>
      </div>
    </BaseProjectCard>
  );
};

/**
 * Project List Item - Compact horizontal layout
 */
export const ProjectListItem = ({ project, onClick }) => {
  const ecosystemConfig = getEcosystemConfig(project.ecosystem);
  const githubUrl = getGitHubUrl(project);
  
  return (
    <BaseProjectCard project={project} onClick={onClick} className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Project Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900">
                {project.name || project.slug}
              </h4>
              {ecosystemConfig && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${ecosystemConfig.bgColor} ${ecosystemConfig.textColor}`}>
                  {ecosystemConfig.icon} {ecosystemConfig.shortName}
                </span>
              )}
              {project.stats?.isActive && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </div>
            {project.description && (
              <p className="text-gray-600 text-sm truncate">
                {project.description}
              </p>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="text-center">
              <div className="font-medium text-gray-900">{project.stats?.commits || 0}</div>
              <div className="text-xs">Commits</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{project.stats?.stars || 0}</div>
              <div className="text-xs">Stars</div>
            </div>
            {project.stats?.healthScore && (
              <div className="text-center">
                <div className={`font-medium ${
                  project.stats.healthScore >= 80 ? 'text-green-600' :
                  project.stats.healthScore >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {project.stats.healthScore}%
                </div>
                <div className="text-xs">Health</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-2">
          {githubUrl && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                window.open(githubUrl, '_blank', 'noopener,noreferrer');
              }}
              variant="outline"
              size="sm"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </BaseProjectCard>
  );
};

/**
 * Project Grid Card - Balanced layout for grid displays
 */
export const ProjectGridCard = ({ project, onClick }) => {
  const ecosystemConfig = getEcosystemConfig(project.ecosystem);
  
  return (
    <BaseProjectCard project={project} onClick={onClick} className="p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {project.name || project.slug}
          </h4>
          {ecosystemConfig && (
            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${ecosystemConfig.bgColor} ${ecosystemConfig.textColor}`}>
              <span>{ecosystemConfig.icon}</span>
              <span>{ecosystemConfig.shortName}</span>
            </span>
          )}
        </div>
        {project.stats?.isActive && (
          <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
        )}
      </div>

      {/* Description */}
      <div className="flex-1 mb-4">
        {project.description ? (
          <p className="text-gray-600 text-sm line-clamp-3">
            {project.description}
          </p>
        ) : (
          <p className="text-gray-500 text-sm italic">
            {project.owner}/{project.repo}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
        <div>
          <div className="font-semibold text-gray-900">{project.stats?.commits || 0}</div>
          <div className="text-gray-500 text-xs">Commits</div>
        </div>
        <div>
          <div className="font-semibold text-gray-900">{project.stats?.stars || 0}</div>
          <div className="text-gray-500 text-xs">Stars</div>
        </div>
        <div>
          <div className="font-semibold text-gray-900">{project.stats?.issues || 0}</div>
          <div className="text-gray-500 text-xs">Issues</div>
        </div>
      </div>

      {/* Health Score */}
      {project.stats?.healthScore && (
        <div className="mt-auto">
          <div className={`text-center py-2 rounded-lg text-sm font-medium ${
            project.stats.healthScore >= 80 ? 'bg-green-100 text-green-800' :
            project.stats.healthScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {project.stats.healthScore}% Health Score
          </div>
        </div>
      )}
    </BaseProjectCard>
  );
};

// Export default as ProjectDetailCard for backward compatibility
export default ProjectDetailCard;
