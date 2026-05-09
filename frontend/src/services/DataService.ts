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
import { COLLECTIONS, getProjectCollection } from '@/config/collections';

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

        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const data = await fetcher(controller.signal);
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

    await Promise.all(ecosystems.map(async (eco) => {
      try {
        const ecoProjects = await this.loadEcosystemProjects(eco, eco === 'celo' ? celoDataTypes : baseDataTypes);
        projects[eco as keyof EcosystemProjects] = ecoProjects;
      } catch (error) {
        console.error(`Failed to load ${eco} projects:`, error);
      }
    }));

    this.projectCache.set(cacheKey, { data: projects, timestamp: Date.now() });
    return projects;
  }

  async loadEcosystemProjects(ecosystemId: string, dataTypes: string[] = ['meta', 'commits']): Promise<Project[]> {
    try {
      const collectionName = getProjectCollection(ecosystemId);
      const ref = collection(db, collectionName);
      const q = ecosystemId === 'base' 
        ? query(ref, where('status', '==', 'approved'), orderBy('createdAt', 'desc'))
        : query(ref, orderBy('createdAt', 'desc'));
      
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

    if (ecosystem && ecosystem !== 'celo') {
      try {
        const collectionName = getProjectCollection(ecosystem);
        const ref = doc(db, collectionName, slug);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;

        const snapData = snap.data();
        const projectData: Project = { 
          id: snap.id, 
          slug: snapData.slug || slug,
          name: snapData.name || '',
          owner: snapData.owner || '',
          repo: snapData.repo || '',
          ecosystem, 
          ...snapData 
        };
        if (projectData.owner && projectData.repo) {
          const githubData = await this.fetchGitHubDataForProject(projectData.owner, projectData.repo, dataTypes);
          projectData.githubData = githubData;
          projectData.stats = this.calculateProjectStats(githubData);
        }
        return projectData;
      } catch (error) {
        console.error(`Failed to load project ${slug} from ${ecosystem}:`, error);
        return null;
      }
    }

    // Try Celo (dynamic first, then static fallback)
    try {
      const dynamicRef = doc(db, 'projects_celo', slug);
      const dynamicSnap = await getDoc(dynamicRef);
      if (dynamicSnap.exists()) {
        const snapData = dynamicSnap.data();
        const projectData: Project = { 
          id: dynamicSnap.id, 
          slug: snapData.slug || slug,
          name: snapData.name || '',
          owner: snapData.owner || '',
          repo: snapData.repo || '',
          ecosystem: 'celo', 
          ...snapData 
        };
        if (projectData.owner && projectData.repo) {
          const githubData = await this.fetchGitHubDataForProject(projectData.owner, projectData.repo, dataTypes);
          projectData.githubData = githubData;
          projectData.stats = this.calculateProjectStats(githubData);
        }
        return projectData;
      }

      // Static fallback for Celo projects not in Firestore
      const repos = await getStaticRepos();
      const repoEntry = repos.find((r: any) => r.slug === slug);
      if (repoEntry) {
        const githubData = await this.fetchGitHubDataForProject(repoEntry.owner, repoEntry.repo, dataTypes);
        return {
          ...repoEntry,
          ecosystem: 'celo',
          source: 'static',
          githubData,
          stats: this.calculateProjectStats(githubData),
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error(`Failed to load Celo project ${slug}:`, error);
    }

    return null;
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
      const requiredFields = ['name', 'description', 'githubUrl', 'ecosystem', 'category'];
      const missingFields = requiredFields.filter(field => !inputData[field]);
      
      if (missingFields.length > 0) {
        return { success: false, error: `Missing required fields: ${missingFields.join(', ')}` };
      }

      if (!inputData.githubUrl.includes('github.com')) {
        return { success: false, error: 'Invalid GitHub URL' };
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

      const [, owner, repo] = githubMatch;
      const now = new Date().toISOString();

      const projectDoc: Project = {
        slug,
        name: inputData.name,
        description: inputData.description,
        owner,
        repo: repo.replace('.git', ''),
        ecosystem: inputData.ecosystem,
        category: inputData.category || '',
        contractAddress: inputData.contractAddress || null,
        deploymentTxHash: inputData.deploymentTxHash || null,
        imageUrl: inputData.imageUrl || null,
        website: inputData.website || null,
        twitter: inputData.twitter || null,
        discord: inputData.discord || null,
        teamMembers: Array.isArray(inputData.teamMembers) ? inputData.teamMembers.filter(Boolean) : [],
        hackathons: Array.isArray(inputData.hackathons) ? inputData.hackathons : [],
        isOpenSource: Boolean(inputData.isOpenSource),
        lookingForFunding: Boolean(inputData.lookingForFunding),
        fundingAmount: inputData.fundingAmount || null,
        milestones: Array.isArray(inputData.milestones) ? inputData.milestones.filter(Boolean) : [],
        launchOnBags: Boolean(inputData.launchOnBags),
        bagsTokenAddress: inputData.bagsTokenAddress || null,
        submittedBy: user.uid,
        owners: [user.uid],
        submittedAt: now,
        status: 'pending_review',
        createdAt: now,
        updatedAt: now,
        verified: false,
        featured: false,
        stats: { commits: 0, issues: 0, pulls: 0, stars: 0, forks: 0, watchers: 0, lastCommit: null, languages: [], isActive: false, healthScore: 0 },
      };

      await setDoc(doc(db, COLLECTIONS.PROJECTS_GENERIC, slug), projectDoc as any);
      await setDoc(doc(db, getProjectCollection(inputData.ecosystem), slug), projectDoc as any);

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
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
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