/**
 * Trending Projects
 * Data-driven component showing highest-scoring projects across metrics
 * Scoring: recent activity, health, cross-chain presence, consistency
 */

import { useMemo } from 'react';
import { useRouter } from 'next/router';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import {
  SparklesIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

/**
 * Score a project based on multiple signals
 * Normalized to 0-100
 */
function scoreProject(project) {
  let score = 0;

  // 1. Recent Activity (40 points max)
  const daysSinceLastCommit = project.stats?.lastCommit
    ? Math.floor((Date.now() - new Date(project.stats.lastCommit).getTime()) / (1000 * 60 * 60 * 24))
    : 365;
  
  if (daysSinceLastCommit <= 7) score += 40;
  else if (daysSinceLastCommit <= 30) score += 30;
  else if (daysSinceLastCommit <= 90) score += 20;
  else if (daysSinceLastCommit <= 180) score += 10;

  // 2. Health Score (30 points max)
  const healthScore = project.stats?.healthScore || 0;
  score += (healthScore / 100) * 30;

  // 3. Commit Consistency (20 points max)
  const commits = project.stats?.commits || 0;
  if (commits >= 100) score += 20;
  else if (commits >= 50) score += 15;
  else if (commits >= 20) score += 10;
  else if (commits >= 5) score += 5;

  // 4. Cross-Chain Presence (10 bonus points)
  if (project.chains && project.chains.length > 1) {
    score += 10;
  } else if (project.ecosystem) {
    score += 3; // Single chain still counts
  }

  return Math.min(100, score);
}

export default function TrendingProjects({ 
  projects, 
  ecosystem = null,
  limit = 3,
  viewMode = 'grid',
  showWhenFiltered = false
}) {
  const router = useRouter();

  const trendingProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];

    // Filter by ecosystem if specified
    let filtered = ecosystem
      ? projects.filter(p => p.ecosystem === ecosystem)
      : projects;

    // Score all projects
    const scored = filtered.map(project => ({
      ...project,
      trendingScore: scoreProject(project),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.trendingScore - a.trendingScore);

    return scored.slice(0, limit);
  }, [projects, ecosystem, limit]);

  if (!trendingProjects || trendingProjects.length === 0) {
    return null;
  }

  const handleProjectClick = (project) => {
    router.push(`/projects/${project.ecosystem || 'base'}/${project.slug}`);
  };

  // Calculate average score
  const avgScore = Math.round(
    trendingProjects.reduce((sum, p) => sum + p.trendingScore, 0) / trendingProjects.length
  );

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800 p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-600 text-white">
              <ArrowTrendingUpIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
              Trending Projects
              <SparklesIcon className="w-5 h-5 text-orange-500" />
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Top projects by activity, health, and ecosystem diversity. Quality work gets visibility.
            </p>
          </div>
        </div>

        {/* Projects Grid */}
        <div className={`grid gap-4 ${
          viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
        }`}>
          {trendingProjects.map((project) => (
            <div
              key={project.slug}
              onClick={() => handleProjectClick(project)}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
            >
              {/* Score Badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {project.ecosystem ? project.ecosystem.toUpperCase() : 'Multi-chain'}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                    {Math.round(project.trendingScore)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {project.description || 'Active project'}
              </p>

              {/* Metrics */}
              <div className="space-y-2 text-xs mb-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Activity</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {project.stats?.lastCommit
                      ? `${Math.floor((Date.now() - new Date(project.stats.lastCommit).getTime()) / (1000 * 60 * 60 * 24))}d ago`
                      : 'Unknown'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Health</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {project.stats?.healthScore || 0}%
                  </span>
                </div>
                {project.stats?.commits !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Commits</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {project.stats.commits}
                    </span>
                  </div>
                )}
              </div>

              {/* Chains */}
              {project.chains && project.chains.length > 1 && (
                <div className="flex items-center gap-1 text-xs text-orange-700 dark:text-orange-300 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <GlobeAltIcon className="w-3 h-3" />
                  <span>{project.chains.length} chains</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Scoring: Recent activity (40) • Health (30) • Consistency (20) • Multi-chain (10) = {avgScore} avg
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="text-sm bg-orange-600 hover:bg-orange-700 text-white"
          >
            View All Projects
          </Button>
        </div>
      </div>
    </div>
  );
}
