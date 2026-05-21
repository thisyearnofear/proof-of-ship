/**
 * Canonical Data Service
 * 
 * Single source of truth for all data operations:
 * - GitHub data fetching with caching
 * - Multi-ecosystem project loading from Firestore
 * - Project submission
 * - React hook for context integration
 * 
 * Consolidated from:
 * - DataService.ts (base caching)
 * - EnhancedDataService.js (multi-ecosystem)
 * - ClientProjectService.js (submission)
 */


import { db } from '@/lib/firebase/clientApp';
import { collection, getDocs, doc, getDoc, query, where, orderBy, setDoc, addDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/config/collections';
import { createProjectDocument, generateProjectSlug, validateProjectInput } from '@/lib/projects/projectNormalize';

// Static repos for Celo fallback (imported lazily to avoid bundling in server contexts)
let staticRepos: any[] | null = null;
async function getStaticRepos() {
  if (!staticRepos) {
    try {
      // From src/services/ -> project root's data/ directory
      const reposModule = await import('../../../data/repos.json');
      staticRepos = reposModule.default || reposModule;
    } catch {
      staticRepos = [];
    }
  }
  return staticRepos;
}

// ============================================================================
// Types
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface FetchOptions<T> {
  ttl?: number;
  validate?: (data: any) => boolean;
  transform?: (data: any) => T;
  retries?: number;
  timeout?: number;
}

export interface ProjectStats {
  commits: number;
  issues: number;
  pulls: number;
  stars: number;
  forks: number;
  watchers: number;
  lastCommit: string | null;
  languages: string[];
  isActive: boolean;
  healthScore: number;
}

export interface Project {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  owner: string;
  repo: string;
  ecosystem: string;
  githubData?: {
    meta?: any;
    commits?: any[];
    issues?: any[];
    pulls?: any[];
  };
  stats?: ProjectStats;
  [key: string]: any;
}

export interface EcosystemProjects {
  celo: Project[];
  arc: Project[];
  base: Project[];
  linea: Project[];
  arbitrum: Project[];
  ethereum: Project[];
  optimism: Project[];
  solana: Project[];
}

export interface EcosystemStats {
  totalProjects: number;
  activeProjects: number;
  totalCommits: number;
  totalStars: number;
  averageHealthScore: number;
  lastUpdated: string;
}

// ============================================================================
// DataService Class
// ============================================================================

class DataService {
  private cache: Map<string, CacheEntry<any>>;
  private abortControllers: Map<string, AbortController>;
  private requestQueue: Map<string, Promise<any>>;
  private cacheTTL: Record<string, number>;

  constructor() {
    this.cache = new Map();
    this.abortControllers = new Map();
    this.requestQueue = new Map();
    this.cacheTTL = {
      contracts: 60 * 1000,
      projects: 10 * 60 * 1000,
      github: 60 * 60 * 1000,
      meta: 24 * 60 * 60 * 1000,
      commits: 24 * 60 * 60 * 1000,
      issues: 60 * 60 * 1000,
      prs: 60 * 60 * 1000,
    };
  }

  // --------------------------------------------------------------------------
  // Caching utilities
  // --------------------------------------------------------------------------

  async fetchWithCache<T>(
    key: string,
    fetcher: (signal: AbortSignal) => Promise<T>,
    options: FetchOptions<T> = {}
  ): Promise<T> {
    const {
      ttl = this.cacheTTL.github,
      retries = 3,
      timeout = 30000,
    } = options;

    if (this.cache.has(key)) {
      const { data, timestamp } = this.cache.get(key)!;
      if (Date.now() - timestamp < ttl) {
        return data;
      }
    }

    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!;
    }

    const requestPromise = this._executeRequest(key, fetcher, { retries, timeout });
    this.requestQueue.set(key, requestPromise);

    try {
      const data = await requestPromise;
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } finally {
      this.requestQueue.delete(key);
    }
  }

  private async _executeRequest<T>(
    key: string,
    fetcher: (signal: AbortSignal) => Promise<T>,
    options: { retries?: number; timeout?: number }
  ): Promise<T> {
    const { retries = 3, timeout = 30000 } = options;
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        this.abortControllers.set(`${key}-${attempt}`, controller);

        let timeoutId: ReturnType<typeof setTimeout>;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            controller.abort();
            const error = new Error(`Request ${key} timed out`);
            error.name = 'AbortError';
            reject(error);
          }, timeout);
        });

        try {
          const data = await Promise.race([
            fetcher(controller.signal),
            timeoutPromise,
          ]);
          clearTimeout(timeoutId);
          return data;
        } finally {
          this.abortControllers.delete(`${key}-${attempt}`);
        }
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') {
          console.warn(`Request ${key} timed out (attempt ${attempt + 1})`);
        } else {
          console.error(`Request ${key} failed (attempt ${attempt + 1}):`, err);
        }
      }
    }
    throw lastError;
  }

  clearCache(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  cancelAllRequests(): void {
    for (const controller of Array.from(this.abortControllers.values())) {
      controller.abort();
    }
    this.abortControllers.clear();
    this.requestQueue.clear();
  }

  // --------------------------------------------------------------------------
  // GitHub Data (Legacy - for Celo/static repos)
  // --------------------------------------------------------------------------

  async loadAllGitHubData(repos: { slug: string; owner: string; repo: string }[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const repo of repos) {
      try {
        const data = await this.loadGitHubRepoData(repo.owner, repo.repo);
        results[repo.slug] = data;
      } catch (error) {
        results[repo.slug] = { hasErrors: true, errors: error };
      }
    }
    
    return results;
  }

  /**
   * Helper: call GitHub API via the BFF proxy at /api/github/...
   * This avoids embedding GITHUB_TOKEN in the browser bundle.
   */
  private async githubFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const qs = new URLSearchParams(params).toString();
    const url = `/api/github/${path}${qs ? `?${qs}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `GitHub proxy error: ${res.status}`);
    }
    const json = await res.json();
    return json.data as T;
  }

  async loadGitHubRepoData(owner: string, repo: string): Promise<any> {
    const cacheKey = `github_${owner}_${repo}`;
    return this.fetchWithCache(cacheKey, async () => {
      const [meta, commits, issues, prs] = await Promise.all([
        this.githubFetch(`repos/${owner}/${repo}`),
        this.githubFetch(`repos/${owner}/${repo}/commits`, { per_page: '100' }),
        this.githubFetch(`repos/${owner}/${repo}/issues`, { state: 'all', per_page: '50' }),
        this.githubFetch(`repos/${owner}/${repo}/pulls`, { state: 'all', per_page: '50' }),
      ]);

      return { meta, commits, issues: (issues as any[]).filter((i: any) => !i.pull_request), prs };
    });
  }

  // --------------------------------------------------------------------------
  // Multi-Ecosystem Project Loading (from Firestore)
  // --------------------------------------------------------------------------

  private projectCache: Map<string, CacheEntry<any>> = new Map();

  async loadAllProjects(ecosystem = 'all', options: { 
    celoDataTypes?: string[];
    baseDataTypes?: string[];
    forceRefresh?: boolean;
  } = {}): Promise<EcosystemProjects> {
    const { 
      celoDataTypes = ['meta', 'commits'],
      baseDataTypes = ['meta', 'commits'],
      forceRefresh = false 
    } = options;
    
    const cacheKey = `projects_${ecosystem}_${celoDataTypes.join(',')}_${baseDataTypes.join(',')}`;
    
    if (!forceRefresh && this.projectCache.has(cacheKey)) {
      const { data, timestamp } = this.projectCache.get(cacheKey)!;
      if (Date.now() - timestamp < this.cacheTTL.projects) {
        return data;
      }
    }

    const projects: EcosystemProjects = {
      celo: [], arc: [], base: [], linea: [], arbitrum: [], ethereum: [], optimism: [], solana: []
    };

    const ecosystems = ecosystem === 'all' 
      ? ['celo', 'arc', 'base', 'linea', 'arbitrum', 'ethereum', 'optimism', 'solana']
      : [ecosystem];

    const seenSlugs = new Set<string>();

    // Load all projects from the single 'projects' collection
    try {
      const ref = collection(db, 'projects');
      const q = query(ref, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      await Promise.all(snapshot.docs.map(async (docSnap) => {
        const docData = docSnap.data();
        const projectEcosystem = docData.ecosystem || 'base';
        
        // Only include if in our ecosystem list
        if (!ecosystems.includes(projectEcosystem)) return;
        
        const projectData: Project = { 
          id: docSnap.id, 
          slug: docData.slug || '',
          name: docData.name || '',
          owner: docData.owner || '',
          repo: docData.repo || '',
          ecosystem: projectEcosystem,
          ...docData 
        } as Project;
        
        if (projectData.owner && projectData.repo) {
          try {
            const githubData = await this.fetchGitHubDataForProject(
              projectData.owner,
              projectData.repo,
              projectEcosystem === 'celo' ? celoDataTypes : baseDataTypes
            );
            projectData.githubData = githubData;
            projectData.stats = this.calculateProjectStats(githubData);
          } catch (error) {
            projectData.githubData = {};
            projectData.stats = this.getDefaultStats();
          }
        }

        if (!seenSlugs.has(projectData.slug)) {
          seenSlugs.add(projectData.slug);
          projects[projectEcosystem as keyof EcosystemProjects].push(projectData);
        }
      }));
    } catch (error) {
      console.error('Failed to load projects:', error);
      }
    }));

    this.projectCache.set(cacheKey, { data: projects, timestamp: Date.now() });
    return projects;
  }

  async loadEcosystemProjects(ecosystemId: string, dataTypes: string[] = ['meta', 'commits']): Promise<Project[]> {
    try {
      const collectionName = getProjectCollection(ecosystemId);
      const ref = collection(db, collectionName);
      const q = query(ref, orderBy('createdAt', 'desc'));
      
      const snapshot = await getDocs(q);
      const projects: Project[] = [];

      await Promise.all(snapshot.docs.map(async (docSnap) => {
        const docData = docSnap.data();
        const projectData: Project = { 
          id: docSnap.id, 
          slug: docData.slug || '',
          name: docData.name || '',
          owner: docData.owner || '',
          repo: docData.repo || '',
          ecosystem: ecosystemId,
          ...docData 
        } as Project;
        
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
        });
      }));

      return projects;
    } catch (error) {
      console.error(`Failed to load ${ecosystemId} projects:`, error);
      return [];
    }
  }

  async fetchGitHubDataForProject(owner: string, repo: string, dataTypes: string[] = ['meta', 'commits']): Promise<any> {
    const cacheKey = `github_${owner}_${repo}_${dataTypes.join(',')}`;
    
    return this.fetchWithCache(cacheKey, async () => {
      const data: any = {};

      for (const dataType of dataTypes) {
        try {
          if (dataType === 'meta') {
            data.meta = await this.githubFetch(`repos/${owner}/${repo}`);
          } else if (dataType === 'commits') {
            data.commits = await this.githubFetch(`repos/${owner}/${repo}/commits`, { per_page: '100' });
          } else if (dataType === 'issues') {
            data.issues = await this.githubFetch(`repos/${owner}/${repo}/issues`, { state: 'all', per_page: '50' });
          } else if (dataType === 'prs') {
            data.pulls = await this.githubFetch(`repos/${owner}/${repo}/pulls`, { state: 'all', per_page: '50' });
          }
        } catch (error) {
          console.warn(`Failed to fetch ${dataType} for ${owner}/${repo}:`, error);
          data[dataType === 'prs' ? 'pulls' : dataType] = dataType === 'meta' ? {} : [];
        }
      }

      return data;
    }, { ttl: this.cacheTTL.projects });
  }

  calculateProjectStats(githubData: any): ProjectStats {
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

  getDefaultStats(): ProjectStats {
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

  calculateHealthScore(githubData: any): number {
    if (!githubData || !githubData.commits) return 0;

    let score = 0;
    const recentCommits = this.getRecentCommits(githubData.commits, 30);
    score += Math.min(recentCommits.length * 2, 40);
    
    const stars = githubData.meta?.stargazers_count || 0;
    const forks = githubData.meta?.forks_count || 0;
    score += Math.min((stars + forks) * 0.5, 30);
    
    const openIssues = githubData.issues?.filter((issue: any) => issue.state === 'open').length || 0;
    const closedIssues = githubData.issues?.filter((issue: any) => issue.state === 'closed').length || 0;
    const issueRatio = closedIssues / (openIssues + closedIssues + 1);
    score += issueRatio * 20;
    
    const hasReadme = githubData.meta?.has_readme || false;
    const hasDescription = githubData.meta?.description?.length > 0 || false;
    score += (hasReadme ? 5 : 0) + (hasDescription ? 5 : 0);
    
    return Math.round(Math.min(score, 100));
  }

  isProjectActive(githubData: any): boolean {
    if (!githubData.commits || githubData.commits.length === 0) return false;
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    return githubData.commits.some((commit: any) => 
      new Date(commit.commit?.author?.date || commit.commit?.committer?.date) > ninetyDaysAgo
    );
  }

  getRecentCommits(commits: any[], days = 30): any[] {
    if (!commits || commits.length === 0) return [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return commits.filter((commit: any) => 
      new Date(commit.commit?.author?.date || commit.commit?.committer?.date) > cutoffDate
    );
  }

  getLastCommitDate(commits: any[]): string | null {
    if (!commits || commits.length === 0) return null;
    
    const dates = commits
      .map((commit: any) => commit.commit?.author?.date || commit.commit?.committer?.date)
      .filter(Boolean)
      .map((date: string) => new Date(date))
      .sort((a: Date, b: Date) => b.getTime() - a.getTime());
    
    return dates.length > 0 ? dates[0].toISOString() : null;
  }

  // --------------------------------------------------------------------------
  // Project Details
  // --------------------------------------------------------------------------

  async getProject(slug: string, ecosystem: string | null = null): Promise<Project | null> {
    const dataTypes = ['meta', 'commits', 'issues', 'prs'];

    try {
      const ref = doc(db, 'projects', slug);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;

      const snapData = snap.data();
      const projectData: Project = { 
        id: snap.id, 
        slug: snapData.slug || slug,
        name: snapData.name || '',
        owner: snapData.owner || '',
        repo: snapData.repo || '',
        ecosystem: ecosystem || snapData.ecosystem || 'base', 
        ...snapData 
      };
      if (projectData.owner && projectData.repo) {
        const githubData = await this.fetchGitHubDataForProject(projectData.owner, projectData.repo, dataTypes);
        projectData.githubData = githubData;
        projectData.stats = this.calculateProjectStats(githubData);
      }
      return projectData;
    } catch (error) {
      console.error(`Failed to load project ${slug}:`, error);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  async searchProjects(query: string, ecosystem = 'all'): Promise<Project[]> {
    const allProjects = await this.loadAllProjects(ecosystem);
    const searchTerm = query.toLowerCase();
    const results: Project[] = [];

    Object.values(allProjects).forEach((projects) => {
      const filtered = projects.filter((project: Project) => 
        project.name?.toLowerCase().includes(searchTerm) ||
        project.slug?.toLowerCase().includes(searchTerm) ||
        project.description?.toLowerCase().includes(searchTerm) ||
        project.owner?.toLowerCase().includes(searchTerm)
      );
      results.push(...filtered);
    });

    return results;
  }

  // --------------------------------------------------------------------------
  // Project Submission
  // --------------------------------------------------------------------------

  async submitProject(inputData: {
    name: string;
    description: string;
    githubUrl: string;
    ecosystem: string;
    category?: string;
    [key: string]: any;
  }): Promise<{ success: boolean; projectSlug?: string; error?: string }> {
    const { auth: firebaseAuth } = await import('@/lib/firebase/clientApp');
    const user = firebaseAuth.currentUser;
    
    if (!user) {
      return { success: false, error: 'You must be logged in to submit a project' };
    }

    try {
      const validation = validateProjectInput(inputData);
      if (!validation.isValid) {
        return { success: false, error: validation.errors[0] };
      }

      const slug = this.generateSlug(inputData.name);
      const existingProject = await getDoc(doc(db, 'projects', slug));
      if (existingProject.exists()) {
        return { success: false, error: 'Project with this name already exists' };
      }

      const githubMatch = inputData.githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!githubMatch) {
        return { success: false, error: 'Could not parse GitHub URL' };
      }

      const now = new Date().toISOString();

      const projectDoc: Project = {
        ...(createProjectDocument(inputData, user.uid, { slug, createdAt: now, submittedAt: now }) as Project),
        bagsTokenAddress: inputData.bagsTokenAddress || null,
      };

      await setDoc(doc(db, COLLECTIONS.PROJECTS, slug), projectDoc as any);

      await addDoc(collection(db, COLLECTIONS.ADMIN_QUEUE), {
        type: 'project_submission',
        projectSlug: slug,
        ecosystem: inputData.ecosystem,
        submittedBy: user.uid,
        submittedAt: now,
        status: 'pending',
        priority: inputData.ecosystem === 'base' ? 'high' : 'normal',
      });

      // Clear project cache to include new project
      this.projectCache.clear();

      return { success: true, projectSlug: slug };
    } catch (error: any) {
      console.error('Error submitting project:', error);
      
      if (error.code === 'permission-denied') {
        return { success: false, error: 'Permission denied. Please make sure you are logged in.' };
      }
      
      return { success: false, error: error.message || 'Failed to submit project' };
    }
  }

  private generateSlug(name: string): string {
    return generateProjectSlug(name);
  }

  // --------------------------------------------------------------------------
  // Stats
  // --------------------------------------------------------------------------

  async getEcosystemStats(ecosystem = 'all'): Promise<Record<string, EcosystemStats>> {
    const projects = await this.loadAllProjects(ecosystem);
    const stats: Record<string, EcosystemStats> = {};

    Object.entries(projects).forEach(([eco, projectList]) => {
      stats[eco] = {
        totalProjects: projectList.length,
        activeProjects: projectList.filter((p: Project) => p.stats?.isActive).length,
        totalCommits: projectList.reduce((sum: number, p: Project) => sum + (p.stats?.commits || 0), 0),
        totalStars: projectList.reduce((sum: number, p: Project) => sum + (p.stats?.stars || 0), 0),
        averageHealthScore: projectList.length > 0 
          ? Math.round(projectList.reduce((sum: number, p: Project) => sum + (p.stats?.healthScore || 0), 0) / projectList.length)
          : 0,
        lastUpdated: new Date().toISOString()
      };
    });

    return ecosystem === 'all' ? stats : { [ecosystem]: stats[ecosystem] } as Record<string, EcosystemStats>;
  }

  clearAllCaches(): void {
    this.cache.clear();
    this.projectCache.clear();
    for (const controller of Array.from(this.abortControllers.values())) {
      controller.abort();
    }
    this.abortControllers.clear();
    this.requestQueue.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const dataService = new DataService();

// ============================================================================
// React Hook
// ============================================================================

interface UseDataServiceReturn {
  dataService: DataService;
  clearCache: (prefix?: string) => void;
  cancelAllRequests: () => void;
}

export function useDataService(): UseDataServiceReturn {
  return {
    dataService,
    clearCache: (prefix?: string) => dataService.clearCache(prefix),
    cancelAllRequests: () => dataService.cancelAllRequests(),
  };
}

// ============================================================================
// Legacy Exports for Backward Compatibility
// ============================================================================

// Re-export for EnhancedDataService compatibility
export { DataService };

// Export singleton method aliases
export const enhancedDataService = dataService;
export const submitProject = (data: any) => dataService.submitProject(data);
