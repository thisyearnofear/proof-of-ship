/**
 * Project Utilities
 * Reusable functions for project data manipulation and analysis
 */

/**
 * Filter projects based on various criteria
 */
export const filterProjects = (projects, filters = {}) => {
  if (!Array.isArray(projects)) return [];
  
  return projects.filter(project => {
    // Ecosystem filter
    if (filters.ecosystem && project.ecosystem !== filters.ecosystem) {
      return false;
    }
    
    // Season filter (for Celo projects)
    if (filters.season && project.season !== filters.season) {
      return false;
    }
    
    // Category filter (for Base projects)
    if (filters.category && project.category !== filters.category) {
      return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [
        project.name,
        project.slug,
        project.description,
        project.owner,
        ...(project.tags || [])
      ].filter(Boolean);
      
      const matches = searchableFields.some(field => 
        field.toLowerCase().includes(searchTerm)
      );
      
      if (!matches) return false;
    }
    
    // Activity filter
    if (filters.activeOnly && !project.stats?.isActive) {
      return false;
    }
    
    // Health score filter
    if (filters.minHealthScore && (project.stats?.healthScore || 0) < filters.minHealthScore) {
      return false;
    }
    
    // Funding status filter
    if (filters.fundingStatus) {
      if (filters.fundingStatus === 'eligible' && !project.lookingForFunding) {
        return false;
      }
      if (filters.fundingStatus === 'funded' && !project.fundingReceived) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Sort projects based on different criteria
 */
export const sortProjects = (projects, sortBy = 'name', order = 'asc') => {
  if (!Array.isArray(projects)) return [];
  
  const sorted = [...projects].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'name':
        valueA = (a.name || a.slug || '').toLowerCase();
        valueB = (b.name || b.slug || '').toLowerCase();
        return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        
      case 'commits':
        valueA = a.stats?.commits || 0;
        valueB = b.stats?.commits || 0;
        break;
        
      case 'stars':
        valueA = a.stats?.stars || 0;
        valueB = b.stats?.stars || 0;
        break;
        
      case 'health':
        valueA = a.stats?.healthScore || 0;
        valueB = b.stats?.healthScore || 0;
        break;
        
      case 'recent':
      case 'lastCommit':
        valueA = new Date(a.stats?.lastCommit || 0);
        valueB = new Date(b.stats?.lastCommit || 0);
        break;
        
      case 'created':
        valueA = new Date(a.createdAt || a.submittedAt || 0);
        valueB = new Date(b.createdAt || b.submittedAt || 0);
        break;
        
      case 'season':
        valueA = a.season || 0;
        valueB = b.season || 0;
        break;
        
      default:
        return 0;
    }
    
    if (order === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });
  
  return sorted;
};

/**
 * Group projects by a specific field
 */
export const groupProjects = (projects, groupBy = 'ecosystem') => {
  if (!Array.isArray(projects)) return {};
  
  return projects.reduce((groups, project) => {
    const key = project[groupBy] || 'other';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(project);
    return groups;
  }, {});
};

/**
 * Calculate aggregate statistics for a set of projects
 */
export const calculateProjectStats = (projects) => {
  if (!Array.isArray(projects) || projects.length === 0) {
    return {
      total: 0,
      active: 0,
      totalCommits: 0,
      totalStars: 0,
      averageHealth: 0,
      ecosystems: 0,
      lastUpdated: null
    };
  }
  
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.stats?.isActive).length,
    totalCommits: projects.reduce((sum, p) => sum + (p.stats?.commits || 0), 0),
    totalStars: projects.reduce((sum, p) => sum + (p.stats?.stars || 0), 0),
    totalIssues: projects.reduce((sum, p) => sum + (p.stats?.issues || 0), 0),
    totalPulls: projects.reduce((sum, p) => sum + (p.stats?.pulls || 0), 0),
    averageHealth: 0,
    ecosystems: new Set(projects.map(p => p.ecosystem).filter(Boolean)).size,
    lastUpdated: new Date().toISOString()
  };
  
  // Calculate average health score
  const projectsWithHealth = projects.filter(p => p.stats?.healthScore);
  if (projectsWithHealth.length > 0) {
    stats.averageHealth = Math.round(
      projectsWithHealth.reduce((sum, p) => sum + p.stats.healthScore, 0) / projectsWithHealth.length
    );
  }
  
  return stats;
};

/**
 * Get trending projects based on recent activity and health
 */
export const getTrendingProjects = (projects, limit = 10) => {
  if (!Array.isArray(projects)) return [];
  
  return projects
    .filter(project => project.stats?.isActive)
    .map(project => ({
      ...project,
      trendingScore: calculateTrendingScore(project)
    }))
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);
};

/**
 * Calculate trending score for a project
 */
const calculateTrendingScore = (project) => {
  const stats = project.stats || {};
  
  let score = 0;
  
  // Health score weight (40%)
  score += (stats.healthScore || 0) * 0.4;
  
  // Recent activity weight (30%)
  const recentCommits = getRecentActivityScore(stats.lastCommit);
  score += recentCommits * 0.3;
  
  // Community engagement weight (20%)
  const engagement = Math.min((stats.stars || 0) + (stats.forks || 0), 100);
  score += engagement * 0.2;
  
  // Development activity weight (10%)
  const activity = Math.min((stats.commits || 0) * 0.1, 10);
  score += activity * 0.1;
  
  return Math.round(score);
};

/**
 * Get recent activity score based on last commit date
 */
const getRecentActivityScore = (lastCommitDate) => {
  if (!lastCommitDate) return 0;
  
  const now = new Date();
  const lastCommit = new Date(lastCommitDate);
  const daysDiff = (now - lastCommit) / (1000 * 60 * 60 * 24);
  
  if (daysDiff <= 7) return 100;
  if (daysDiff <= 30) return 80;
  if (daysDiff <= 90) return 60;
  if (daysDiff <= 180) return 40;
  return 20;
};

/**
 * Categorize projects by health score
 */
export const categorizeProjectsByHealth = (projects) => {
  if (!Array.isArray(projects)) return { excellent: [], good: [], fair: [], poor: [] };
  
  return {
    excellent: projects.filter(p => (p.stats?.healthScore || 0) >= 80),
    good: projects.filter(p => (p.stats?.healthScore || 0) >= 60 && (p.stats?.healthScore || 0) < 80),
    fair: projects.filter(p => (p.stats?.healthScore || 0) >= 40 && (p.stats?.healthScore || 0) < 60),
    poor: projects.filter(p => (p.stats?.healthScore || 0) < 40)
  };
};

/**
 * Search projects with advanced matching
 */
export const searchProjects = (projects, query, options = {}) => {
  if (!query || !Array.isArray(projects)) return projects;
  
  const {
    fuzzy = false,
    fields = ['name', 'slug', 'description', 'owner'],
    caseSensitive = false
  } = options;
  
  const searchTerm = caseSensitive ? query : query.toLowerCase();
  
  return projects.filter(project => {
    return fields.some(field => {
      const value = project[field];
      if (!value) return false;
      
      const fieldValue = caseSensitive ? value : value.toLowerCase();
      
      if (fuzzy) {
        return fuzzyMatch(fieldValue, searchTerm);
      } else {
        return fieldValue.includes(searchTerm);
      }
    });
  });
};

/**
 * Simple fuzzy matching algorithm
 */
const fuzzyMatch = (text, pattern) => {
  const textLen = text.length;
  const patternLen = pattern.length;
  
  if (patternLen === 0) return true;
  if (textLen === 0) return false;
  
  let textIndex = 0;
  let patternIndex = 0;
  
  while (textIndex < textLen && patternIndex < patternLen) {
    if (text[textIndex] === pattern[patternIndex]) {
      patternIndex++;
    }
    textIndex++;
  }
  
  return patternIndex === patternLen;
};

/**
 * Paginate projects
 */
export const paginateProjects = (projects, page = 1, limit = 12) => {
  if (!Array.isArray(projects)) return { projects: [], pagination: {} };
  
  const total = projects.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginatedProjects = projects.slice(offset, offset + limit);
  
  return {
    projects: paginatedProjects,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    }
  };
};

/**
 * Validate project data structure
 */
export const validateProject = (project) => {
  const errors = [];
  
  if (!project.slug) errors.push('Missing slug');
  if (!project.name && !project.slug) errors.push('Missing name or slug');
  if (!project.owner) errors.push('Missing owner');
  if (!project.repo) errors.push('Missing repo');
  if (!project.ecosystem) errors.push('Missing ecosystem');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate project URL
 */
export const getProjectUrl = (project, baseUrl = '') => {
  if (!project.slug || !project.ecosystem) return '#';
  return `${baseUrl}/projects/${project.ecosystem}/${project.slug}`;
};

/**
 * Generate GitHub URL for project
 */
export const getGitHubUrl = (project) => {
  if (!project.owner || !project.repo) return null;
  return `https://github.com/${project.owner}/${project.repo}`;
};
