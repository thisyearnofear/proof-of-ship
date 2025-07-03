import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { enhancedDataService } from "@/services/EnhancedDataService";

const EnhancedGithubContext = createContext({});

export function EnhancedGithubProvider({ children }) {
  // Multi-ecosystem state management
  const [projectData, setProjectData] = useState({
    celo: [],
    base: []
  });
  const [dataMap, setDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [selectedSlug, setSelectedSlug] = useState("stablestation");
  const [activeEcosystem, setActiveEcosystem] = useState('celo');
  const [ecosystemStats, setEcosystemStats] = useState({});

  const mountedRef = useRef(true);

  // Load essential project data on mount (meta + commits only)
  useEffect(() => {
    loadEssentialProjectData();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load ecosystem stats when active ecosystem changes
  useEffect(() => {
    loadEcosystemStats();
  }, [activeEcosystem]);

  // Load only essential data on initial mount (meta + commits)
  const loadEssentialProjectData = async () => {
    try {
      setLoading(true);
      setErrors({});

      // Load projects with essential data only (meta + commits)
      const allProjects = await enhancedDataService.loadAllProjects('all', {
        celoDataTypes: ["meta", "commits"],
        baseDataTypes: ["meta", "commits"]
      });
      
      if (mountedRef.current) {
        setProjectData(allProjects);
        
        // Create unified data map for backward compatibility
        const unifiedDataMap = {};
        
        Object.entries(allProjects).forEach(([ecosystem, projects]) => {
          projects.forEach(project => {
            unifiedDataMap[project.slug] = {
              ...project.githubData,
              stats: project.stats,
              ecosystem,
              meta: {
                ...project.githubData?.meta,
                ecosystem,
                healthScore: project.stats?.healthScore,
                isActive: project.stats?.isActive
              }
            };
          });
        });
        
        setDataMap(unifiedDataMap);
      }
    } catch (error) {
      console.error('Failed to load essential project data:', error);
      if (mountedRef.current) {
        setErrors({ general: error.message });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Load all project data including issues and PRs (for manual refresh)
  const loadAllProjectData = async () => {
    try {
      setLoading(true);
      setErrors({});

      // Load projects with all data types
      const allProjects = await enhancedDataService.loadAllProjects('all', {
        celoDataTypes: ["meta", "commits", "issues", "prs"],
        baseDataTypes: ["meta", "commits", "issues", "prs"],
        forceRefresh: true
      });
      
      if (mountedRef.current) {
        setProjectData(allProjects);
        
        // Create unified data map for backward compatibility
        const unifiedDataMap = {};
        
        Object.entries(allProjects).forEach(([ecosystem, projects]) => {
          projects.forEach(project => {
            unifiedDataMap[project.slug] = {
              ...project.githubData,
              stats: project.stats,
              ecosystem,
              meta: {
                ...project.githubData?.meta,
                ecosystem,
                healthScore: project.stats?.healthScore,
                isActive: project.stats?.isActive
              }
            };
          });
        });
        
        setDataMap(unifiedDataMap);
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
      if (mountedRef.current) {
        setErrors({ general: error.message });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loadEcosystemStats = async () => {
    try {
      const stats = await enhancedDataService.getEcosystemStats();
      setEcosystemStats(stats);
    } catch (error) {
      console.error('Failed to load ecosystem stats:', error);
    }
  };

  const refreshProjectData = async (ecosystem = 'all') => {
    try {
      setLoading(true);
      
      // Clear cache to force fresh data
      enhancedDataService.clearAllCaches();
      
      // Reload ALL data (including issues and PRs) for manual refresh
      await loadAllProjectData();
      await loadEcosystemStats();
      
    } catch (error) {
      console.error('Failed to refresh project data:', error);
      setErrors({ refresh: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Load detailed data for a specific project (issues + PRs)
  const loadProjectDetails = async (slug, ecosystem = null) => {
    try {
      // Load full data for this specific project
      const project = await enhancedDataService.getProject(slug, ecosystem);
      if (project && mountedRef.current) {
        // Update the specific project in our data
        setProjectData(prev => {
          const updated = { ...prev };
          const projectEcosystem = project.ecosystem || ecosystem || 'celo';
          
          if (updated[projectEcosystem]) {
            const projectIndex = updated[projectEcosystem].findIndex(p => p.slug === slug);
            if (projectIndex >= 0) {
              updated[projectEcosystem][projectIndex] = project;
            }
          }
          
          return updated;
        });
        
        // Update data map
        setDataMap(prev => ({
          ...prev,
          [slug]: {
            ...project.githubData,
            stats: project.stats,
            ecosystem: projectEcosystem,
            meta: {
              ...project.githubData?.meta,
              ecosystem: projectEcosystem,
              healthScore: project.stats?.healthScore,
              isActive: project.stats?.isActive
            }
          }
        }));
      }
      
      return project;
    } catch (error) {
      console.error(`Failed to load details for project ${slug}:`, error);
      return null;
    }
  };

  const submitProject = async (projectData) => {
    try {
      const result = await enhancedDataService.submitBaseProject(projectData);
      
      // Refresh data to include new project
      await refreshProjectData('base');
      
      return result;
    } catch (error) {
      console.error('Failed to submit project:', error);
      throw error;
    }
  };

  const searchProjects = async (query, ecosystem = 'all') => {
    try {
      return await enhancedDataService.searchProjects(query, ecosystem);
    } catch (error) {
      console.error('Failed to search projects:', error);
      return [];
    }
  };

  const getProject = async (slug, ecosystem = null) => {
    try {
      return await enhancedDataService.getProject(slug, ecosystem);
    } catch (error) {
      console.error('Failed to get project:', error);
      return null;
    }
  };

  // Backward compatibility - get repos for current ecosystem
  const getCurrentRepos = () => {
    return projectData[activeEcosystem] || [];
  };

  // Get all repos across ecosystems
  const getAllRepos = () => {
    return Object.values(projectData).flat();
  };

  // Filter projects by various criteria
  const filterProjects = (criteria) => {
    const allProjects = getAllRepos();
    
    return allProjects.filter(project => {
      // Ecosystem filter
      if (criteria.ecosystem && project.ecosystem !== criteria.ecosystem) {
        return false;
      }
      
      // Season filter (for Celo projects)
      if (criteria.season && project.season !== criteria.season) {
        return false;
      }
      
      // Category filter (for Base projects)
      if (criteria.category && project.category !== criteria.category) {
        return false;
      }
      
      // Activity filter
      if (criteria.activeOnly && !project.stats?.isActive) {
        return false;
      }
      
      // Health score filter
      if (criteria.minHealthScore && (project.stats?.healthScore || 0) < criteria.minHealthScore) {
        return false;
      }
      
      return true;
    });
  };

  // Get trending projects (high activity, good health score)
  const getTrendingProjects = (limit = 10) => {
    const allProjects = getAllRepos();
    
    return allProjects
      .filter(project => project.stats?.isActive)
      .sort((a, b) => {
        // Sort by health score and recent activity
        const scoreA = (a.stats?.healthScore || 0) + (a.stats?.commits || 0) * 0.1;
        const scoreB = (b.stats?.healthScore || 0) + (b.stats?.commits || 0) * 0.1;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  };

  // Get projects by health score ranges
  const getProjectsByHealth = () => {
    const allProjects = getAllRepos();
    
    return {
      excellent: allProjects.filter(p => (p.stats?.healthScore || 0) >= 80),
      good: allProjects.filter(p => (p.stats?.healthScore || 0) >= 60 && (p.stats?.healthScore || 0) < 80),
      fair: allProjects.filter(p => (p.stats?.healthScore || 0) >= 40 && (p.stats?.healthScore || 0) < 60),
      poor: allProjects.filter(p => (p.stats?.healthScore || 0) < 40)
    };
  };

  const contextValue = {
    // Data
    projectData,
    dataMap,
    ecosystemStats,
    
    // State
    loading,
    errors,
    selectedSlug,
    activeEcosystem,
    
    // Backward compatibility
    repos: getCurrentRepos(),
    
    // Enhanced functionality
    allRepos: getAllRepos(),
    currentRepos: getCurrentRepos(),
    
    // Actions
    setSelectedSlug,
    setActiveEcosystem,
    refreshProjectData,
    loadProjectDetails,
    submitProject,
    searchProjects,
    getProject,
    
    // Filtering and analysis
    filterProjects,
    getTrendingProjects,
    getProjectsByHealth,
    
    // Utilities
    clearCache: () => enhancedDataService.clearAllCaches(),
    hasDetailedData: (slug) => {
      const project = dataMap[slug];
      return project && (project.issues || project.pulls);
    },
    
    // Ecosystem management
    switchEcosystem: (ecosystem) => {
      setActiveEcosystem(ecosystem);
      // Update selected slug to first project in new ecosystem if current doesn't exist
      const newEcosystemProjects = projectData[ecosystem] || [];
      if (newEcosystemProjects.length > 0 && !newEcosystemProjects.find(p => p.slug === selectedSlug)) {
        setSelectedSlug(newEcosystemProjects[0].slug);
      }
    },
    
    // Statistics
    getEcosystemStats: (ecosystem) => ecosystemStats[ecosystem] || {},
    getTotalStats: () => {
      const allProjects = getAllRepos();
      return {
        totalProjects: allProjects.length,
        totalCommits: allProjects.reduce((sum, p) => sum + (p.stats?.commits || 0), 0),
        totalStars: allProjects.reduce((sum, p) => sum + (p.stats?.stars || 0), 0),
        activeProjects: allProjects.filter(p => p.stats?.isActive).length,
        ecosystems: Object.keys(projectData).length
      };
    }
  };

  return (
    <EnhancedGithubContext.Provider value={contextValue}>
      {children}
    </EnhancedGithubContext.Provider>
  );
}

export const useEnhancedGithub = () => {
  const context = useContext(EnhancedGithubContext);
  if (!context) {
    throw new Error('useEnhancedGithub must be used within an EnhancedGithubProvider');
  }
  return context;
};

// Backward compatibility hook
export const useGithub = () => {
  return useEnhancedGithub();
};
