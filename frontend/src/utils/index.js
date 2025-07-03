/**
 * Utilities Index
 * Centralized exports for utility functions
 */

// Project utilities
export {
  filterProjects,
  sortProjects,
  groupProjects,
  calculateProjectStats,
  getTrendingProjects,
  categorizeProjectsByHealth,
  searchProjects,
  paginateProjects,
  validateProject,
  getProjectUrl,
  getGitHubUrl
} from './projectUtils';

// Configuration
export {
  ECOSYSTEM_CONFIGS,
  getEcosystemConfig,
  getAllEcosystems,
  getEcosystemsByDataSource,
  getEcosystemColors,
  getEcosystemClasses,
  isValidEcosystem
} from '../config/ecosystems';
