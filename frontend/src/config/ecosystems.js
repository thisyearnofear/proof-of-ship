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
    category: 'Proof of Ship Program',
    
    // Data source configuration
    dataSource: 'static', // static (repos.json) or dynamic (firestore)
    hasSeasons: true,
    seasons: [1, 2, 3],
    
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
    category: 'L2 Innovation',
    
    // Data source configuration
    dataSource: 'dynamic', // firestore
    hasSeasons: false,
    hasCategories: true,
    categories: ['defi', 'nft', 'gaming', 'social', 'infrastructure', 'dao', 'other'],
    
    // Display preferences
    defaultSort: 'recent',
    showHealthScore: true,
    showActivity: true,
    showFunding: true,
    previewLimit: 4
  },

  papa: {
    id: 'papa',
    name: 'Papa Dashboard',
    shortName: 'Papa',
    description: 'Multi-chain progress tracking across various networks',
    longDescription: 'Daily goals and progress tracking across Lens, Optimism, Polygon, Mantle, and Base chains.',
    
    // Visual identity
    icon: '📊',
    color: '#8B5CF6',
    bgGradient: 'from-purple-50 to-violet-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800',
    bgColor: 'bg-purple-50',
    
    // Routing
    route: '/papa',
    apiEndpoint: '/api/papa',
    
    // Features & metadata
    features: ['Multi-chain support', 'Goal tracking', 'Progress analytics'],
    category: 'Progress Tracking',
    
    // Data source configuration
    dataSource: 'special', // custom papa logic
    hasGoals: true,
    supportedChains: ['lens', 'optimism', 'polygon', 'mantle', 'base'],
    
    // Display preferences
    defaultSort: 'progress',
    showProgress: true,
    showGoals: true,
    previewLimit: 3
  }
};

// Utility functions
export const getEcosystemConfig = (ecosystemId) => {
  return ECOSYSTEM_CONFIGS[ecosystemId] || null;
};

export const getAllEcosystems = () => {
  return Object.values(ECOSYSTEM_CONFIGS);
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
