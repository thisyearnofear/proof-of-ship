/**
 * Ecosystem Configuration
 * Single source of truth for all ecosystem-related data
 */

export const ECOSYSTEM_CONFIGS = {
  celo: {
    id: 'celo',
    name: 'Celo Ecosystem',
    shortName: 'Celo',
    description: 'Mobile-first blockchain projects focused on financial inclusion',
    longDescription: 'Projects built during Celo\'s Proof of Ship program across three seasons, focusing on mobile-first blockchain solutions and financial inclusion.',
    
    // Visual identity
    icon: '🌱',
    color: '#35D07F',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    bgColor: 'bg-green-50',
    
    // Routing
    route: '/ecosystems/celo',
    apiEndpoint: '/api/projects/celo',
    
    // Features & metadata
    features: ['Multi-season tracking', 'GitHub analytics', 'Community metrics'],
    submissionRequirements: [
      'Project must be deployed on Celo',
      'Include clear onchain contract references (address or explorer)',
      'Provide a GitHub repo for reviewers and users'
    ],
    category: 'Proof of Ship Program',
    
    // Data source configuration
    dataSource: 'static', // static (repos.json) or dynamic (firestore)
    hasSeasons: true,
    seasons: [1, 2, 3],
    tradeWinds: [
      { category: 'mobile', boost: 1.2, label: 'Mobile-First Boost', description: '20% boost for mobile focus' }
    ],
    
    // Display preferences
    defaultSort: 'season',
    showHealthScore: true,
    showActivity: true,
    previewLimit: 4
  },

  base: {
    id: 'base',
    name: 'Base Ecosystem',
    shortName: 'Base',
    description: 'Coinbase\'s L2 network enabling fast, low-cost applications',
    longDescription: 'Projects building on Coinbase\'s Base network, leveraging low fees and fast transactions for innovative decentralized applications.',
    
    // Visual identity
    icon: '🔵',
    color: '#0052FF',
    bgGradient: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    bgColor: 'bg-blue-50',
    
    // Routing
    route: '/ecosystems/base',
    apiEndpoint: '/api/projects/base',
    
    // Features & metadata
    features: ['Developer funding', 'L2 benefits', 'Coinbase integration'],
    submissionRequirements: [
      'Project must be deployed on Base',
      'Provide a GitHub repo for reviewers and users',
      'Add at least one contract address for your onchain surface area'
    ],
    category: 'L2 Innovation',
    
    // Data source configuration
    dataSource: 'dynamic', // firestore
    hasSeasons: false,
    hasCategories: true,
    categories: ['defi', 'nft', 'gaming', 'social', 'infrastructure', 'dao', 'other'],
    tradeWinds: [
      { category: 'defi', boost: 1.5, label: 'DeFi Summer', description: '50% credit boost for DeFi projects' }
    ],
    
    // Display preferences
    defaultSort: 'recent',
    showHealthScore: true,
    showActivity: true,
    showFunding: true,
    previewLimit: 4
  }
};

// Utility functions
export const getEcosystemConfig = (ecosystemId) => {
  return ECOSYSTEM_CONFIGS[ecosystemId] || null;
};

export const getAllEcosystems = () => {
  return Object.values(ECOSYSTEM_CONFIGS).filter(e => e.dataSource !== 'special');
};

export const getEcosystemsByDataSource = (dataSource) => {
  return Object.values(ECOSYSTEM_CONFIGS).filter(config => config.dataSource === dataSource);
};

export const getEcosystemColors = () => {
  return Object.fromEntries(
    Object.entries(ECOSYSTEM_CONFIGS).map(([key, config]) => [key, config.color])
  );
};

// CSS class generators
export const getEcosystemClasses = (ecosystemId) => {
  const config = getEcosystemConfig(ecosystemId);
  if (!config) return {};
  
  return {
    gradient: `bg-gradient-to-r ${config.bgGradient}`,
    border: config.borderColor,
    text: config.textColor,
    bg: config.bgColor
  };
};

// Validation
export const isValidEcosystem = (ecosystemId) => {
  return ecosystemId in ECOSYSTEM_CONFIGS;
};
