/**
 * ChainBadges
 * Displays which blockchain networks a project is deployed on
 *
 * Core Principles:
 * - MODULAR: Reusable across all project displays
 * - CLEAN: Simple, focused component
 */

const CHAIN_CONFIG = {
  ethereum: {
    name: 'Ethereum',
    logo: '⟠',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    shortColor: 'bg-blue-500',
  },
  polygon: {
    name: 'Polygon',
    logo: '◆',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    shortColor: 'bg-purple-500',
  },
  arbitrum: {
    name: 'Arbitrum',
    logo: 'Ⓐ',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    shortColor: 'bg-blue-600',
  },
  optimism: {
    name: 'Optimism',
    logo: 'OP',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    shortColor: 'bg-red-500',
  },
  base: {
    name: 'Base',
    logo: 'Ⓑ',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    shortColor: 'bg-blue-400',
  },
  avalanche: {
    name: 'Avalanche',
    logo: 'Ⓐ',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    shortColor: 'bg-red-600',
  },
  bsc: {
    name: 'BSC',
    logo: 'Ⓑ',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    shortColor: 'bg-yellow-500',
  },
  gnosis: {
    name: 'Gnosis',
    logo: 'Ⓖ',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    shortColor: 'bg-green-500',
  },
  celo: {
    name: 'Celo',
    logo: 'Ⓒ',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    shortColor: 'bg-green-600',
  },
  solana: {
    name: 'Solana',
    logo: '◎',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    shortColor: 'bg-purple-600',
  },
};

/**
 * ChainBadges
 * @param {string[]} chains - Array of chain names
 * @param {boolean} compact - Show as small colored dots (for listings)
 */
export default function ChainBadges({ chains = [], compact = false }) {
  if (!chains || chains.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {chains.map((chain) => {
          const config = CHAIN_CONFIG[chain.toLowerCase()] || CHAIN_CONFIG.ethereum;
          return (
            <div
              key={chain}
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
      {chains.map((chain) => {
        const config = CHAIN_CONFIG[chain.toLowerCase()] || CHAIN_CONFIG.ethereum;
        return (
          <span
            key={chain}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
          >
            <span className="mr-1">{config.logo}</span>
            {config.name}
          </span>
        );
      })}
    </div>
  );
}
