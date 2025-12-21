/**
 * SectorBadges
 * Displays project sectors/verticals (DeFi, Gaming, RWA, Health, etc.)
 *
 * Core Principles:
 * - MODULAR: Reusable across all project displays
 * - CLEAN: Simple, focused component
 */

const SECTOR_CONFIG = {
  defi: {
    name: 'DeFi',
    emoji: '💰',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    shortColor: 'bg-green-500',
  },
  gaming: {
    name: 'Gaming',
    emoji: '🎮',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    shortColor: 'bg-purple-500',
  },
  rwa: {
    name: 'RWA',
    emoji: '🏠',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    shortColor: 'bg-orange-500',
  },
  health: {
    name: 'Health',
    emoji: '⚕️',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    shortColor: 'bg-red-500',
  },
  infrastructure: {
    name: 'Infrastructure',
    emoji: '🏗️',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    shortColor: 'bg-gray-500',
  },
  social: {
    name: 'Social',
    emoji: '👥',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    shortColor: 'bg-blue-500',
  },
  nft: {
    name: 'NFT',
    emoji: '🖼️',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    shortColor: 'bg-pink-500',
  },
  dao: {
    name: 'DAO',
    emoji: '🤝',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    shortColor: 'bg-indigo-500',
  },
  marketplace: {
    name: 'Marketplace',
    emoji: '🛒',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    shortColor: 'bg-cyan-500',
  },
  bridge: {
    name: 'Bridge',
    emoji: '🌉',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    shortColor: 'bg-teal-500',
  },
};

/**
 * SectorBadges
 * @param {string[]} sectors - Array of sector names
 * @param {boolean} compact - Show as small colored dots (for listings)
 */
export default function SectorBadges({ sectors = [], compact = false }) {
  if (!sectors || sectors.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {sectors.map((sector) => {
          const config = SECTOR_CONFIG[sector.toLowerCase()] || SECTOR_CONFIG.defi;
          return (
            <div
              key={sector}
              className={`w-2 h-2 rounded-full ${config.shortColor}`}
              title={config.name}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sectors.map((sector) => {
        const config = SECTOR_CONFIG[sector.toLowerCase()] || SECTOR_CONFIG.defi;
        return (
          <span
            key={sector}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
          >
            <span className="mr-1">{config.emoji}</span>
            {config.name}
          </span>
        );
      })}
    </div>
  );
}
