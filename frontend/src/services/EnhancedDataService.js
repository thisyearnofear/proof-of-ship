/**
 * Enhanced Data Service - Unified data management for all project types
 * Handles both static (Celo) and dynamic (Base) project data cohesively
 */

import DataService from './DataService';
import { db } from '../lib/firebase/clientApp';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';

class EnhancedDataService extends DataService {
  constructor() {
    super();
    this.projectCache = new Map();
    this.ecosystemData = {
      celo: { projects: [], source: 'dynamic' },
      arc: { projects: [], source: 'dynamic' },
      base: { projects: [], source: 'dynamic' },
      linea: { projects: [], source: 'dynamic' },
      arbitrum: { projects: [], source: 'dynamic' },
      ethereum: { projects: [], source: 'dynamic' },
      optimism: { projects: [], source: 'dynamic' }
    };
  }

  /**
   * Unified project loading - handles both Celo and Base projects with smart data loading
   */
  async loadAllProjects(ecosystem = 'all', options = {}) {
    const { 
      celoDataTypes = ["meta", "commits"], // Default to essential data only
      baseDataTypes = ["meta", "commits"],
      forceRefresh = false 
    } = options;
    
    const cacheKey = `projects_${ecosystem}_${celoDataTypes.join(',')}_${baseDataTypes.join(',')}`;
    
    try {
      // Check cache first (unless forcing refresh)
      if (!forceRefresh && this.projectCache.has(cacheKey)) {
        const { data, timestamp } = this.projectCache.get(cacheKey);
        if (Date.now() - timestamp < this.cacheTTL.projects) {
          return data;
        }
      }

      let projects = {};

      if (ecosystem === 'all' || ecosystem === 'celo') {
        // Load Celo projects from Firestore
        const celoProjects = await this.loadCeloProjects(celoDataTypes);
        projects.celo = celoProjects;
      }

      if (ecosystem === 'all' || ecosystem === 'base') {
        const baseProjects = await this.loadBaseProjects(baseDataTypes);
        projects.base = baseProjects;
      }

      if (ecosystem === 'all' || ecosystem === 'linea') {
        const lineaProjects = await this.loadLineaProjects(baseDataTypes);
        projects.linea = lineaProjects;
      }

      if (ecosystem === 'all' || ecosystem === 'arc') {
        projects.arc = await this.loadEcosystemProjects('arc', baseDataTypes);
      }

      if (ecosystem === 'all' || ecosystem === 'arbitrum') {
        projects.arbitrum = await this.loadEcosystemProjects('arbitrum', baseDataTypes);
      }

      if (ecosystem === 'all' || ecosystem === 'ethereum') {
        projects.ethereum = await this.loadEcosystemProjects('ethereum', baseDataTypes);
      }

      if (ecosystem === 'all' || ecosystem === 'optimism') {
        projects.optimism = await this.loadEcosystemProjects('optimism', baseDataTypes);
      }

      // Cache the results
      this.projectCache.set(cacheKey, {
        data: projects,
        timestamp: Date.now()
      });

      return projects;
    } catch (error) {
      // Firebase permissions may block unauthenticated reads
      throw error;
    }
  }

  /**
   * Load Celo projects from Firestore (projects_celo)
   */
  async loadCeloProjects(dataTypes = ["meta", "commits"]) {
    try {
      const celoRef = collection(db, "projects_celo");
      // Load all projects from Firestore (not just approved ones, or filter by status if preferred)
      const q = query(celoRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const projects = [];
      for (const docSnap of snapshot.docs) {
        const projectData = { id: docSnap.id, ...docSnap.data() };
        
        if (projectData.owner && projectData.repo) {
          try {
            const gh = await this.fetchGitHubDataForProject(
              projectData.owner,
              projectData.repo,
              dataTypes
            );
            projectData.githubData = gh;
            projectData.stats = this.calculateProjectStats(gh);
          } catch (error) {
            projectData.githubData = {};
            projectData.stats = this.getDefaultStats();
          }
        }

        projects.push({
          ...projectData,
          ecosystem: "celo",
          source: "dynamic",
          dataTypes,
        });
      }

      return projects;
    } catch (error) {
      console.error("Failed to load Celo projects from Firestore:", error);
      return [];
    }
  }

  /**
   * Load Base projects from Firestore with configurable data types
   */
  async loadBaseProjects(dataTypes = ["meta", "commits"]) {
    try {
      const baseProjectsRef = collection(db, 'projects_base');
      const q = query(
        baseProjectsRef, 
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const projects = [];

      for (const docSnap of snapshot.docs) {
        const projectData = { id: docSnap.id, ...docSnap.data() };
        
        // Fetch GitHub data for Base projects with specified data types
        if (projectData.owner && projectData.repo) {
          try {
            const githubData = await this.fetchGitHubDataForProject(
              projectData.owner, 
              projectData.repo,
              dataTypes
            );
            projectData.githubData = githubData;
            projectData.stats = this.calculateProjectStats(githubData);
          } catch (error) {
            console.warn(`Failed to fetch GitHub data for ${projectData.slug}:`, error);
            projectData.githubData = {};
            projectData.stats = this.getDefaultStats();
          }
        }

        projects.push({
          ...projectData,
          ecosystem: 'base',
          source: 'dynamic',
          dataTypes: dataTypes // Track what data was loaded
        });
      }

      return projects;
    } catch (error) {
      // Firebase permissions may block unauthenticated reads
      return [];
    }
  }

  /**
   * Load Linea projects from Firestore with configurable data types
   */
  async loadLineaProjects(dataTypes = ["meta", "commits"]) {
    try {
      const lineaProjectsRef = collection(db, 'projects_linea');
      const q = query(
        lineaProjectsRef, 
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const projects = [];

      for (const docSnap of snapshot.docs) {
        const projectData = { id: docSnap.id, ...docSnap.data() };
        
        if (projectData.owner && projectData.repo) {
          try {
            const githubData = await this.fetchGitHubDataForProject(
              projectData.owner, 
              projectData.repo,
              dataTypes
            );
            projectData.githubData = githubData;
            projectData.stats = this.calculateProjectStats(githubData);
          } catch (error) {
            console.warn(`Failed to fetch GitHub data for ${projectData.slug}:`, error);
            projectData.githubData = {};
            projectData.stats = this.getDefaultStats();
          }
        }

        projects.push({
          ...projectData,
          ecosystem: 'linea',
          source: 'dynamic',
          dataTypes: dataTypes
        });
      }

      return projects;
    } catch (error) {
      // Firebase permissions may block unauthenticated reads
      return [];
    }
  }

  /**
   * Generic loader for any ecosystem from Firestore (projects_{ecosystem})
   */
  async loadEcosystemProjects(ecosystemId, dataTypes = ["meta", "commits"]) {
    try {
      const ref = collection(db, `projects_${ecosystemId}`);
      const q = query(ref, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const projects = [];

      for (const docSnap of snapshot.docs) {
        const projectData = { id: docSnap.id, ...docSnap.data() };

        if (projectData.owner && projectData.repo) {
          try {
            const githubData = await this.fetchGitHubDataForProject(
              projectData.owner,
              projectData.repo,
              dataTypes
            );
            projectData.githubData = githubData;
            projectData.stats = this.calculateProjectStats(githubData);
          } catch (error) {
            projectData.githubData = {};
            projectData.stats = this.getDefaultStats();
          }
        }

        projects.push({
          ...projectData,
          ecosystem: ecosystemId,
          source: 'dynamic',
          dataTypes
        });
      }

      return projects;
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch GitHub data for a single project with configurable endpoints
   */
  async fetchGitHubDataForProject(owner, repo, dataTypes = ["meta", "commits"]) {
    const cacheKey = `github_${owner}_${repo}_${dataTypes.join(',')}`;
    
    return await this.fetchWithCache(cacheKey, async () => {
      const data = {};

      for (const dataType of dataTypes) {
        try {
          if (dataType === 'meta') {
            data.meta = await this.fetchGitHubEndpoint(owner, repo, '');
          } else if (dataType === 'commits') {
            data.commits = await this.fetchGitHubEndpoint(owner, repo, 'stats/commit_activity');
          } else if (dataType === 'issues') {
            data.issues = await this.fetchGitHubEndpoint(owner, repo, 'issues');
          } else if (dataType === 'prs') {
            data.pulls = await this.fetchGitHubEndpoint(owner, repo, 'pulls');
          }
        } catch (error) {
          console.warn(`Failed to fetch ${dataType} for ${owner}/${repo}:`, error);
          data[dataType === 'prs' ? 'pulls' : dataType] = dataType === 'meta' ? {} : [];
        }
      }

      return data;
    }, {
      ttl: this.cacheTTL.projects,
      validate: (data) => data && typeof data === 'object'
    });
  }

  /**
   * Submit new Base project
   */
  async submitBaseProject(projectData) {
    try {
      // Validate GitHub repository exists
      const githubData = await this.fetchGitHubDataForProject(
        projectData.owner, 
        projectData.repo
      );

      // Enhance project data with GitHub stats
      const enhancedProject = {
        ...projectData,
        githubData,
        stats: this.calculateProjectStats(githubData),
        submittedAt: new Date().toISOString(),
        status: 'pending_review',
        ecosystem: 'base'
      };

      // Submit via API
      const response = await fetch('/api/projects/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedProject)
      });

      if (!response.ok) {
        throw new Error(`Submission failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Clear cache to force refresh
      this.projectCache.clear();
      
      return result;
    } catch (error) {
      console.error('Failed to submit Base project:', error);
      throw error;
    }
  }

  /**
   * Calculate standardized project statistics
   */
  calculateProjectStats(githubData) {
    if (!githubData || typeof githubData !== 'object') {
      return this.getDefaultStats();
    }

    return {
      commits: githubData.commits?.length || 0,
      issues: githubData.issues?.length || 0,
      pulls: githubData.pulls?.length || 0,
      stars: githubData.meta?.stargazers_count || 0,
      forks: githubData.meta?.forks_count || 0,
      watchers: githubData.meta?.watchers_count || 0,
      lastCommit: this.getLastCommitDate(githubData.commits),
      languages: githubData.meta?.language ? [githubData.meta.language] : [],
      isActive: this.isProjectActive(githubData),
      healthScore: this.calculateHealthScore(githubData)
    };
  }

  /**
   * Get default stats for projects without GitHub data
   */
  getDefaultStats() {
    return {
      commits: 0,
      issues: 0,
      pulls: 0,
      stars: 0,
      forks: 0,
      watchers: 0,
      lastCommit: null,
      languages: [],
      isActive: false,
      healthScore: 0
    };
  }

  /**
   * Calculate project health score (0-100)
   */
  calculateHealthScore(githubData) {
    if (!githubData || !githubData.commits) return 0;

    let score = 0;
    
    // Recent activity (40 points)
    const recentCommits = this.getRecentCommits(githubData.commits, 30);
    score += Math.min(recentCommits.length * 2, 40);
    
    // Community engagement (30 points)
    const stars = githubData.meta?.stargazers_count || 0;
    const forks = githubData.meta?.forks_count || 0;
    score += Math.min((stars + forks) * 0.5, 30);
    
    // Issue management (20 points)
    const openIssues = githubData.issues?.filter(issue => issue.state === 'open').length || 0;
    const closedIssues = githubData.issues?.filter(issue => issue.state === 'closed').length || 0;
    const issueRatio = closedIssues / (openIssues + closedIssues + 1);
    score += issueRatio * 20;
    
    // Documentation (10 points)
    const hasReadme = githubData.meta?.has_readme || false;
    const hasDescription = githubData.meta?.description?.length > 0 || false;
    score += (hasReadme ? 5 : 0) + (hasDescription ? 5 : 0);
    
    return Math.round(Math.min(score, 100));
  }

  /**
   * Check if project is active (commits in last 90 days)
   */
  isProjectActive(githubData) {
    if (!githubData.commits || githubData.commits.length === 0) return false;
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    return githubData.commits.some(commit => 
      new Date(commit.commit?.author?.date || commit.commit?.committer?.date) > ninetyDaysAgo
    );
  }

  /**
   * Get recent commits within specified days
   */
  getRecentCommits(commits, days = 30) {
    if (!commits || commits.length === 0) return [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return commits.filter(commit => 
      new Date(commit.commit?.author?.date || commit.commit?.committer?.date) > cutoffDate
    );
  }

  /**
   * Get last commit date
   */
  getLastCommitDate(commits) {
    if (!commits || commits.length === 0) return null;
    
    const dates = commits
      .map(commit => commit.commit?.author?.date || commit.commit?.committer?.date)
      .filter(Boolean)
      .map(date => new Date(date))
      .sort((a, b) => b - a);
    
    return dates.length > 0 ? dates[0].toISOString() : null;
  }

  /**
   * Search projects across all ecosystems
   */
  async searchProjects(query, ecosystem = 'all') {
    const allProjects = await this.loadAllProjects(ecosystem);
    const searchTerm = query.toLowerCase();
    
    const results = [];
    
    Object.entries(allProjects).forEach(([eco, projects]) => {
      const filtered = projects.filter(project => 
        project.name?.toLowerCase().includes(searchTerm) ||
        project.slug?.toLowerCase().includes(searchTerm) ||
        project.description?.toLowerCase().includes(searchTerm) ||
        project.owner?.toLowerCase().includes(searchTerm) ||
        project.category?.toLowerCase().includes(searchTerm)
      );
      
      results.push(...filtered.map(project => ({ ...project, ecosystem: eco })));
    });
    
    return results;
  }

  /**
   * Get project by slug with full data (including issues and PRs)
   *
   * Avoid loading entire ecosystems; fetch the single project and then pull only
   * the GitHub endpoints we need.
   */
  async getProject(slug, ecosystem = null) {
    const dataTypes = ["meta", "commits", "issues", "prs"];

    if (ecosystem) {
      // Dynamic ecosystems (Firestore)
      if (ecosystem !== "celo") {
        try {
          const ref = doc(db, `projects_${ecosystem}`, slug);
          const snap = await getDoc(ref);
          if (!snap.exists()) return null;

          const projectData = { id: snap.id, ...snap.data(), ecosystem };

          if (projectData.owner && projectData.repo) {
            const githubData = await this.fetchGitHubDataForProject(
              projectData.owner,
              projectData.repo,
              dataTypes
            );
            projectData.githubData = githubData;
            projectData.stats = this.calculateProjectStats(githubData);
          }
          
          // Fetch owner wallet address if owners array exists
          if (Array.isArray(projectData.owners) && projectData.owners.length > 0) {
            try {
              const ownerRef = doc(db, 'users', projectData.owners[0]);
              const ownerSnap = await getDoc(ownerRef);
              if (ownerSnap.exists()) {
                projectData.ownerWalletAddress = ownerSnap.data().walletAddress || null;
              }
            } catch (error) {
              console.warn('Failed to fetch owner wallet address:', error);
            }
          }

          return projectData;
        } catch (error) {
          console.error(`Failed to load project ${slug} from ${ecosystem}:`, error);
          return null;
        }
      }

      // Celo: prefer a dynamic doc (if submitted), otherwise fall back to static repos.json
      try {
        const dynamicRef = doc(db, "projects_celo", slug);
        const dynamicSnap = await getDoc(dynamicRef);
        if (dynamicSnap.exists()) {
        const projectData = { id: dynamicSnap.id, ...dynamicSnap.data(), ecosystem: "celo" };
          if (projectData.owner && projectData.repo) {
            const githubData = await this.fetchGitHubDataForProject(
              projectData.owner,
              projectData.repo,
              dataTypes
            );
            projectData.githubData = githubData;
            projectData.stats = this.calculateProjectStats(githubData);
          }
          
          // Fetch owner wallet address if owners array exists
          if (Array.isArray(projectData.owners) && projectData.owners.length > 0) {
            try {
              const ownerRef = doc(db, 'users', projectData.owners[0]);
              const ownerSnap = await getDoc(ownerRef);
              if (ownerSnap.exists()) {
                projectData.ownerWalletAddress = ownerSnap.data().walletAddress || null;
              }
            } catch (error) {
              console.warn('Failed to fetch owner wallet address:', error);
            }
          }
          
          return projectData;
        }

        const repoEntry = repos.find((r) => r.slug === slug);
        if (!repoEntry) return null;

        const githubData = await this.fetchGitHubDataForProject(
          repoEntry.owner,
          repoEntry.repo,
          dataTypes
        );

        return {
          ...repoEntry,
          ecosystem: "celo",
          source: "static",
          githubData,
          stats: this.calculateProjectStats(githubData),
          lastUpdated: new Date().toISOString(),
          dataTypes,
        };
      } catch (error) {
        console.error(`Failed to load Celo project ${slug}:`, error);
        return null;
      }
    }

    // Fallback: try known ecosystems without bulk-loading
    const tryEcosystems = ["base", "celo", "linea"];
    for (const eco of tryEcosystems) {
      const project = await this.getProject(slug, eco);
      if (project) return project;
    }

    return null;
  }

  /**
   * Get ecosystem statistics
   */
  async getEcosystemStats(ecosystem = 'all') {
    const projects = await this.loadAllProjects(ecosystem);
    
    const stats = {};
    
    Object.entries(projects).forEach(([eco, projectList]) => {
      stats[eco] = {
        totalProjects: projectList.length,
        activeProjects: projectList.filter(p => p.stats?.isActive).length,
        totalCommits: projectList.reduce((sum, p) => sum + (p.stats?.commits || 0), 0),
        totalStars: projectList.reduce((sum, p) => sum + (p.stats?.stars || 0), 0),
        averageHealthScore: projectList.length > 0 
          ? Math.round(projectList.reduce((sum, p) => sum + (p.stats?.healthScore || 0), 0) / projectList.length)
          : 0,
        lastUpdated: new Date().toISOString()
      };
    });
    
    return ecosystem === 'all' ? stats : stats[ecosystem];
  }

  /**
   * Clear all caches (useful for development/testing)
   */
  clearAllCaches() {
    super.cache?.clear();
    this.projectCache.clear();
  }
}

export const enhancedDataService = new EnhancedDataService();
export { EnhancedDataService };
