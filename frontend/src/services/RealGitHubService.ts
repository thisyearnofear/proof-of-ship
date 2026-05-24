/**
 * Real GitHub API Service
 * Proxies all requests through the BFF route (/api/github/...)
 * to keep GITHUB_TOKEN server-side only.
 * Scoring logic consolidated to @/lib/scoring (DRY)
 */

import {
  calculateFullGitHubScore,
  calculateProfileScore,
  calculateActivityScore,
  calculateCommunityScore,
  calculateRepositoryScore,
  calculateConsistencyScore,
} from '@/lib/scoring';

interface GitHubRepo {
  name: string;
  owner: string;
  slug?: string;
  [key: string]: any;
}

interface GitHubUserProfile {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface GitHubRepoData {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  html_url: string;
  description: string | null;
  fork: boolean;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  [key: string]: any;
}

interface GitHubCommit {
  sha: string;
  commit: {
    author: { name: string; email: string; date: string };
    message: string;
  };
  [key: string]: any;
}

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  user: { login: string; id: number };
  created_at: string;
  merged_at: string | null;
  [key: string]: any;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  user: { login: string; id: number };
  created_at: string;
  closed_at: string | null;
  pull_request?: any;
  [key: string]: any;
}

interface GitHubRepoDetail {
  meta: GitHubRepoData;
  commits: GitHubCommit[];
  issues: GitHubIssue[];
  pulls: GitHubPullRequest[];
}

interface ScoreResultFull {
  profileScore: number;
  activityScore: number;
  communityScore: number;
  repositoryScore: number;
  consistencyScore: number;
  overall: { totalScore: number; breakdown: Record<string, number> };
  details: Record<string, any>;
}

interface CacheEntry {
  data: any;
  ts: number;
}

const BFF_BASE = '/api/github';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

class RealGitHubService {
  private bffBaseUrl: string;
  private cache: Map<string, CacheEntry>;

  constructor() {
    this.bffBaseUrl = BFF_BASE;
    this.cache = new Map();
  }

  isConfigured(): boolean {
    return true; // Always configured — uses BFF proxy
  }

  private async bffFetch<T>(path: string): Promise<T> {
    const url = `${this.bffBaseUrl}/${path.replace(/^\//, '')}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `GitHub BFF error: ${res.status}`);
    }
    const json = await res.json();
    return json.data as T;
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
    return null;
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, { data, ts: Date.now() });
  }

  async getUserProfile(username: string): Promise<GitHubUserProfile> {
    const cacheKey = `profile_${username}`;
    const cached = this.getCached<GitHubUserProfile>(cacheKey);
    if (cached) return cached;
    const data = await this.bffFetch<GitHubUserProfile>(`users/${username}`);
    this.setCached(cacheKey, data);
    return data;
  }

  async getRepoList(username: string): Promise<GitHubRepoData[]> {
    const cacheKey = `repos_${username}`;
    const cached = this.getCached<GitHubRepoData[]>(cacheKey);
    if (cached) return cached;
    const data = await this.bffFetch<GitHubRepoData[]>(`users/${username}/repos?per_page=100&sort=updated`);
    this.setCached(cacheKey, data);
    return data;
  }

  async getRepoPullRequests(owner: string, repo: string, state: string = 'all'): Promise<GitHubPullRequest[]> {
    const cacheKey = `pulls_${owner}_${repo}_${state}`;
    const cached = this.getCached<GitHubPullRequest[]>(cacheKey);
    if (cached) return cached;
    const data = await this.bffFetch<GitHubPullRequest[]>(`repos/${owner}/${repo}/pulls?state=${state}&per_page=50`);
    this.setCached(cacheKey, data);
    return data;
  }

  async getRepoDetail(owner: string, repo: string): Promise<GitHubRepoDetail> {
    const cacheKey = `detail_${owner}_${repo}`;
    const cached = this.getCached<GitHubRepoDetail>(cacheKey);
    if (cached) return cached;
    const [meta, commits, issues, pulls] = await Promise.all([
      this.bffFetch<GitHubRepoData>(`repos/${owner}/${repo}`),
      this.bffFetch<GitHubCommit[]>(`repos/${owner}/${repo}/commits?per_page=100`),
      this.bffFetch<GitHubIssue[]>(`repos/${owner}/${repo}/issues?state=all&per_page=50`),
      this.bffFetch<GitHubPullRequest[]>(`repos/${owner}/${repo}/pulls?state=all&per_page=50`),
    ]);
    const data: GitHubRepoDetail = {
      meta,
      commits,
      issues: issues.filter((i: GitHubIssue) => !i.pull_request),
      pulls,
    };
    this.setCached(cacheKey, data);
    return data;
  }

  async hasRepoPushAccess(owner: string, repo: string, token: string): Promise<boolean> {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/branches/main`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getRepoCommits(owner: string, repo: string): Promise<GitHubCommit[]> {
    return this.bffFetch<GitHubCommit[]>(`repos/${owner}/${repo}/commits?per_page=100`);
  }

  async getReposForMultipleUsers(users: string[]): Promise<GitHubRepoData[]> {
    const allRepos = await Promise.all(
      users.map(u => this.getRepoList(u).catch(() => [] as GitHubRepoData[]))
    );
    return allRepos.flat();
  }

  async calculateOverallScore(githubData: GitHubRepoDetail): Promise<ScoreResultFull> {
    const profileScore = calculateProfileScore(githubData.meta);
    const activityScore = calculateActivityScore(githubData);
    const communityScore = calculateCommunityScore(githubData);
    const repositoryScore = calculateRepositoryScore(githubData);
    const consistencyScore = calculateConsistencyScore(githubData);
    const overall = calculateFullGitHubScore(githubData);

    return {
      profileScore,
      activityScore,
      communityScore,
      repositoryScore,
      consistencyScore,
      overall,
      details: {},
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

const realGitHubService = new RealGitHubService();
export { RealGitHubService };
export { realGitHubService };
export default realGitHubService;
