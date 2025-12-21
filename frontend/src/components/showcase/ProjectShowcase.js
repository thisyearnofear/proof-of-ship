import TractionCard from './TractionCard';
import DeveloperCredibilityCard from './DeveloperCredibilityCard';
import ChainBadges from './ChainBadges';
import SectorBadges from './SectorBadges';

/**
 * ProjectShowcase
 * Complete showcase of a project with traction, credibility, and metadata
 * 
 * Core Principles:
 * - MODULAR: Composes reusable cards and badges
 * - CLEAN: Clear data flow from project → components
 * - PERFORMANT: Lazy loads metrics
 */
export default function ProjectShowcase({ project }) {
  if (!project) {
    return null;
  }

  const mainContractAddress = project.contractAddresses?.[project.chains?.[0]] || 
                              project.contracts?.[0]?.address;
  const mainChain = project.chains?.[0] || 'ethereum';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {project.name}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {project.description}
        </p>

        {/* Badges */}
        <div className="mt-4 space-y-3">
          {project.chains && project.chains.length > 0 && (
            <div>
              <h3 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Networks
              </h3>
              <ChainBadges chains={project.chains} />
            </div>
          )}

          {project.sectors && project.sectors.length > 0 && (
            <div>
              <h3 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Sectors
              </h3>
              <SectorBadges sectors={project.sectors} />
            </div>
          )}
        </div>
      </div>

      {/* Traction Metrics */}
      {mainContractAddress && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            On-Chain Performance
          </h2>
          <TractionCard 
            contractAddress={mainContractAddress} 
            chain={mainChain}
          />
        </div>
      )}

      {/* Developer Credibility */}
      {project.github?.owner && project.github?.repo && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Developer Track Record
          </h2>
          <DeveloperCredibilityCard
            owner={project.github.owner}
            repo={project.github.repo}
          />
        </div>
      )}

      {/* Quick Stats */}
      {(project.traction || project.github) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          {project.traction && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Latest On-Chain Data
              </h3>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <p>Updated: {new Date(project.traction.lastUpdated).toLocaleDateString()}</p>
                <p>Source: {project.traction.source}</p>
              </div>
            </div>
          )}

          {project.github && (
            <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Latest GitHub Data
              </h3>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p>Repo: {project.github.owner}/{project.github.repo}</p>
                <p>Updated: {new Date(project.github.lastUpdated).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project Links */}
      {(project.website || project.github?.repo) && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Resources
          </h3>
          <div className="flex flex-wrap gap-2">
            {project.website && (
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Visit App
              </a>
            )}
            {project.github?.repo && (
              <a
                href={`https://github.com/${project.github.owner}/${project.github.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition"
              >
                View GitHub
              </a>
            )}
            {project.twitter && (
              <a
                href={`https://twitter.com/${project.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-400 text-white hover:bg-blue-500 transition"
              >
                Follow Twitter
              </a>
            )}
            {project.discord && (
              <a
                href={project.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Join Discord
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
