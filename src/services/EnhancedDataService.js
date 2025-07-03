/**
 * Enhanced Data Service - Unified data management for all project types
 * Handles both static (Celo) and dynamic (Base) project data cohesively
 */

import DataService from './DataService';
import { db } from '../lib/firebase/clientApp';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import repos from '../../repos.json';

class EnhancedDataService extends DataService {
  constructor() {
    super();
    this.projectCache = new Map();
    this.ecosystemData = {
      celo: { projects: repos, source: 'static' },
      base: { projects: [], source: 'dynamic' }
    };
  }

  /**
   * Unified project loading - handles both Celo and Base projects
   */
  async loadAllProjects(ecosystem = 'all') {
    const cacheKey = `projects_${ecosystem}`;
    
    try {
      // Check cache first
      if (this.projectCache.has(cacheKey)) {
        const { data, timestamp } = this.projectCache.get(cacheKey);
        if (Date.now() - timestamp < this.cacheTTL.projects) {
          return data;
        }
      }

      let projects = {};

      if (ecosystem === 'all' || ecosystem === 'celo') {
        // Load Celo projects (existing static data)
        const celoProjects = await this.loadCeloProjects();
        projects.celo = celoProjects;
      }

      if (ecosystem === 'all' || ecosystem === 'base') {
        // Load Base projects (new dynamic data)
        const baseProjects = await this.loadBaseProjects();
        projects.base = baseProjects;
      }

      // Cache the results
      this.projectCache.set(cacheKey, {
        data: projects,
        timestamp: Date.now()
      });

      return projects;
    } catch (error) {
      console.error('Failed to load projects:', error);
      throw error;
    }
  }

  /**
   * Load Celo projects using existing infrastructure
   */
  async loadCeloProjects() {
    try {
      // Use existing GitHub data loading
      const githubData = await this.loadAllGitHubData(repos);
      
      // Enhance with ecosystem metadata
      const enhancedProjects = repos.map(repo => ({
        ...repo,
        ecosystem: 'celo',
        source: 'static',
        githubData: githubData[repo.slug] || {},
        stats: this.calculateProjectStats(githubData[repo.slug] || {}),
        lastUpdated: new Date().toISOString()
      }));

      return enhancedProjects;
    } catch (error) {
      console.error('Failed to load Celo projects:', error);
      return [];
    }
  }

  /**
   * Load Base projects from Firestore
   */
  async loadBaseProjects() {
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
        
        // Fetch GitHub data for Base projects too
        if (projectData.owner && projectData.repo) {
          try {
            const githubData = await this.fetchGitHubDataForProject(
              projectData.owner, 
              projectData.repo
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
          source: 'dynamic'
        });
      }

      return projects;
    } catch (error) {
      console.error('Failed to load Base projects:', error);
      return [];
    }
  }

  /**
   * Fetch GitHub data for a single project (used for Base projects)
   */
  async fetchGitHubDataForProject(owner, repo) {
    const cacheKey = `github_${owner}_${repo}`;
    
    return await this.fetchWithCache(cacheKey, async () => {
      const endpoints = ['commits', 'issues', 'pulls'];
      const data = {};

      for (const endpoint of endpoints) {
        try {
          data[endpoint] = await this.fetchGitHubEndpoint(owner, repo, endpoint);
        } catch (error) {
          console.warn(`Failed to fetch ${endpoint} for ${owner}/${repo}:`, error);
          data[endpoint] = [];
        }
      }

      // Fetch repository metadata
      try {
        data.meta = await this.fetchGitHubEndpoint(owner, repo, '');
      } catch (error) {
        console.warn(`Failed to fetch metadata for ${owner}/${repo}:`, error);
        data.meta = {};
      }

      return data;
    }, {
      ttl: this.cacheTTL.github,
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
   * Get project by slug (works across ecosystems)
   */
  async getProject(slug, ecosystem = null) {
    if (ecosystem) {
      const projects = await this.loadAllProjects(ecosystem);
      return projects[ecosystem]?.find(p => p.slug === slug) || null;
    }
    
    // Search across all ecosystems
    const allProjects = await this.loadAllProjects();
    
    for (const [eco, projects] of Object.entries(allProjects)) {
      const project = projects.find(p => p.slug === slug);
      if (project) {
        return { ...project, ecosystem: eco };
      }
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
    console.log('All caches cleared');
  }
}

export const enhancedDataService = new EnhancedDataService();
export { EnhancedDataService };
