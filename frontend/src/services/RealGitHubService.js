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

class RealGitHubService {
  constructor() {
    // No API key stored client-side — all requests go through BFF
    this.bffBaseUrl = "/api/github";
  }

  isConfigured() {
    // Always available — the BFF route handles the server-side token check
    return true;
  }

  /**
   * Make a proxied GitHub API request through the BFF route
   * @param {string} endpoint - GitHub API path (e.g. "/users/username")
   * @param {Object} options - Fetch options (query params forwarded)
   * @returns {Object} Parsed JSON data from GitHub
   */
  async makeRequest(endpoint, options = {}) {
    // Parse query params out of the endpoint string (e.g. "/repos/o/r/pulls?state=all&per_page=10")
    const parts = endpoint.replace(/^\//, "").split("?");
    const pathOnly = parts[0];
    const queryString = parts.length > 1 ? parts.slice(1).join("?") : null;

    // Merge params from endpoint string and options.params
    const allowedParams = ["state", "per_page", "page", "sort", "q", "since", "author"];
    const params = new URLSearchParams();

    // Parse params from the endpoint query string
    if (queryString) {
      const endpointParams = new URLSearchParams(queryString);
      for (const [key, value] of endpointParams.entries()) {
        if (allowedParams.includes(key)) {
          params.set(key, value);
        }
      }
    }

    // Merge options.params (takes precedence)
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (allowedParams.includes(key)) {
          params.set(key, value);
        }
      }
    }

    const url = `${this.bffBaseUrl}/${pathOnly}`;
    const finalQueryString = params.toString();
    const fullUrl = finalQueryString ? `${url}?${finalQueryString}` : url;

    const response = await fetch(fullUrl);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        errorBody.error || `GitHub proxy error: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Make a user-scoped request using the user's own GitHub token
   * This bypasses the BFF since it uses the user's token, not the server's.
   */
  async makeUserRequest(endpoint, userToken, options = {}) {
    const url = `https://api.github.com${endpoint}`;
    const headers = {
      Authorization: `token ${userToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Builder-Credit-Platform",
      ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`GitHub API (user) error: ${response.status} ${response.statusText} - ${error.message || 'Unknown error'}`);
    }
    return response.json();
  }

  async hasRepoPushAccess(owner, repo, userToken) {
    if (!userToken) return false;
    try {
      const repoData = await this.makeUserRequest(`/repos/${owner}/${repo}`, userToken);
      const perms = repoData.permissions || {};
      return Boolean(perms.push || perms.admin || perms.maintain);
    } catch (e) {
      return false;
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(username) {
    return this.makeRequest(`/users/${username}`);
  }

  /**
   * Get pull requests for a specific repository
   */
  async getRepoPullRequests(owner, repo, state = "all") {
    return this.makeRequest(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=10`);
  }

  /**
   * Get user's repositories
   */
  async getUserRepos(username, page = 1, perPage = 100) {
    return this.makeRequest(
      `/users/${username}/repos?page=${page}&per_page=${perPage}&sort=updated`
    );
  }

  /**
   * Get user's contribution stats
   */
  async getUserStats(username) {
    // Get user profile
    const profile = await this.getUserProfile(username);

    // Get repositories
    const repos = await this.getUserRepos(username);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return {
      profile,
      repos,
      stats: {
        totalRepos: repos.length,
        publicRepos: repos.filter((repo) => !repo.private).length,
        totalStars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
        totalForks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
        recentRepos: repos.filter(
          (repo) => new Date(repo.updated_at) > thirtyDaysAgo
        ).length,
        languages: [
          ...new Set(repos.map((repo) => repo.language).filter(Boolean)),
        ],
        hasReadme: repos.filter((repo) => repo.has_readme).length,
        hasLicense: repos.filter((repo) => repo.license).length,
      },
    };
  }

  /**
   * Get user's recent commits across repositories
   */
  async getUserCommits(username, since = null) {
    const repos = await this.getUserRepos(username);
    const commits = [];

    // Get commits from user's own repos (last 10 most active)
    const activeRepos = repos
      .filter((repo) => !repo.private && !repo.fork)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 10);

    for (const repo of activeRepos) {
      try {
        const sinceParam = since ? `&since=${since}` : "";
        const repoCommits = await this.makeRequest(
          `/repos/${username}/${repo.name}/commits?author=${username}&per_page=10${sinceParam}`
        );

        commits.push(
          ...repoCommits.map((commit) => ({
            ...commit,
            repo: repo.name,
          }))
        );
      } catch (error) {
        // Skip repos that error (might be empty or access restricted)
        console.warn(`Failed to get commits for ${repo.name}:`, error.message);
      }
    }

    return commits;
  }

  /**
   * Get user's pull requests
   */
  async getUserPullRequests(username, state = "closed") {
    // Search for PRs authored by user
    const query = `author:${username} type:pr state:${state}`;
    const searchResult = await this.makeRequest(
      `/search/issues?q=${encodeURIComponent(query)}&per_page=100`
    );

    return searchResult.items || [];
  }

  /**
   * Get user's issues
   */
  async getUserIssues(username, state = "closed") {
    // Search for issues authored by user
    const query = `author:${username} type:issue state:${state}`;
    const searchResult = await this.makeRequest(
      `/search/issues?q=${encodeURIComponent(query)}&per_page=100`
    );

    return searchResult.items || [];
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(username) {
    return this.makeRequest(`/users/${username}/orgs`);
  }

  /**
   * Calculate comprehensive GitHub score
   */
  async calculateGitHubScore(username) {
    try {
      const [userData, commits, pullRequests, issues, organizations] =
        await Promise.all([
          this.getUserStats(username),
          this.getUserCommits(
            username,
            new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
          ),
          this.getUserPullRequests(username),
          this.getUserIssues(username),
          this.getUserOrganizations(username),
        ]);

      const result = calculateFullGitHubScore(
        userData,
        commits,
        pullRequests,
        issues,
        organizations
      );

      return {
        totalScore: result.totalScore,
        breakdown: result.breakdown,
        data: {
          profile: userData.profile,
          stats: userData.stats,
          commits: commits.length,
          pullRequests: pullRequests.length,
          issues: issues.length,
          organizations: organizations.length,
        },
      };
    } catch (error) {
      console.error("Failed to calculate GitHub score:", error);
      throw error;
    }
  }

  calculateProfileScore(profile) {
    return calculateProfileScore(profile);
  }

  calculateActivityScore(commits, stats) {
    return calculateActivityScore(commits, stats);
  }

  calculateCommunityScore(pullRequests, issues, organizations) {
    return calculateCommunityScore(pullRequests, issues, organizations);
  }

  calculateRepositoryScore(repos, stats) {
    return calculateRepositoryScore(repos, stats);
  }

  calculateConsistencyScore(commits, repos) {
    return calculateConsistencyScore(commits, repos);
  }
}

// Export singleton instance
export const realGitHubService = new RealGitHubService();
export default realGitHubService;
