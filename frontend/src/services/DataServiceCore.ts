/**
 * DataServiceCore — shared caching infrastructure and GitHub API proxy.
 *
 * This is the engine behind ProjectDataService (which consumes its cache
 * and GitHub fetch methods) and the standalone DataService singleton.
 */

import { db } from '@/lib/firebase/clientApp';

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

  clearAllCaches(): void {
    this.cache.clear();
    for (const controller of Array.from(this.abortControllers.values())) {
      controller.abort();
    }
    this.abortControllers.clear();
    this.requestQueue.clear();
  }

  // --------------------------------------------------------------------------
  // GitHub API Proxy (via BFF /api/github/...)
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Stats Calculation
  // --------------------------------------------------------------------------

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
      healthScore: this.calculateHealthScore(githubData),
    };
  }

  getDefaultStats(): ProjectStats {
    return {
      commits: 0, issues: 0, pulls: 0, stars: 0, forks: 0,
      watchers: 0, lastCommit: null, languages: [], isActive: false, healthScore: 0,
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
    score += (closedIssues / (openIssues + closedIssues + 1)) * 20;
    score += (githubData.meta?.has_readme ? 5 : 0) + (githubData.meta?.description?.length > 0 ? 5 : 0);
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
}

// ============================================================================
// Singleton
// ============================================================================

export const dataService = new DataService();

// ============================================================================
// Hook
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

export { DataService };
