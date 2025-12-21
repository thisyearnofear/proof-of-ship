/**
 * Papa Project Highlight
 * Surfaces papa's (thisyearnofear) example projects for new users
 * Creates a discoverable reference point on the platform
 */

import { useMemo } from 'react';
import { useRouter } from 'next/router';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import {
  StarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const PAPA_USERNAME = 'thisyearnofear';
const PAPA_DISPLAY_NAME = 'Papa';
const PAPA_DESCRIPTION = 'Example projects by the platform creator. Check these out to see what\'s possible.';

export default function PapaProjectHighlight({ projects, ecosystem = null, viewMode = 'grid' }) {
  const router = useRouter();

  const papaProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];
    
    // Filter for papa's projects
    let filtered = projects.filter(p => 
      p.owner === PAPA_USERNAME || p.owner?.toLowerCase() === PAPA_USERNAME
    );

    // If ecosystem specified, filter further
    if (ecosystem) {
      filtered = filtered.filter(p => p.ecosystem === ecosystem);
    }

    return filtered.slice(0, 3); // Show max 3 examples
  }, [projects, ecosystem]);

  if (!papaProjects || papaProjects.length === 0) {
    return null;
  }

  const handleProjectClick = (project) => {
    router.push(`/projects/${project.ecosystem || 'base'}/${project.slug}`);
  };

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800 p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 text-white">
              <UserCircleIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
              {PAPA_DISPLAY_NAME}'s Projects
              <StarIcon className="w-5 h-5 text-yellow-500" />
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {PAPA_DESCRIPTION}
            </p>
          </div>
        </div>

        {/* Projects Grid */}
        <div className={`grid gap-4 ${
          viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
        }`}>
          {papaProjects.map(project => (
            <div
              key={project.slug}
              onClick={() => handleProjectClick(project)}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {project.ecosystem ? project.ecosystem.toUpperCase() : 'Multi-chain'}
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex-shrink-0">
                  Example
                </span>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {project.description || 'Check out this reference project'}
              </p>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {project.stats?.lastCommit ? 
                    `Updated ${new Date(project.stats.lastCommit).toLocaleDateString()}` : 
                    'Active project'
                  }
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            See more of papa's work or create your own example projects
          </p>
          <Button
            onClick={() => router.push(`/u/${PAPA_USERNAME}`)}
            className="text-sm bg-purple-600 hover:bg-purple-700 text-white"
          >
            Visit {PAPA_DISPLAY_NAME}'s Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
