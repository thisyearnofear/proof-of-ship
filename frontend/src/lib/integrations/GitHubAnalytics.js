/**
 * GitHub Analytics Integration
 * Fetches developer metrics (commits, PRs, test coverage) from GitHub
 *
 * Core Principles:
 * - PERFORMANT: Cache results with 24h TTL, webhook-triggered updates
 * - DRY: Single service for all GitHub metrics
 * - CLEAN: Separate concern from project mutations
 */

class GitHubAnalyticsService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.apiKey = process.env.GITHUB_TOKEN;
    this.cacheKey = 'github_metrics_';
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Fetch analytics for a GitHub repository
   */
  async getRepoMetrics(owner, repo) {
    if (!owner || !repo) {
      return null;
    }

    // Check cache first
    const cached = this._getCache(`${owner}/${repo}`);
    if (cached) {
      return cached;
    }

    try {
      // Fetch from GitHub API
      const metrics = await this._fetchFromGitHub(owner, repo);
      this._setCache(`${owner}/${repo}`, metrics);
      return metrics;
    } catch (error) {
      console.error(`Error fetching GitHub metrics for ${owner}/${repo}:`, error);
      return this._getDefaultMetrics();
    }
  }

  /**
   * Fetch metrics from GitHub API
   * @private
   */
  async _fetchFromGitHub(owner, repo) {
    // Development mode: return mock data
    if (process.env.NODE_ENV !== 'production' || !this.apiKey) {
      return this._generateMockMetrics(owner, repo);
    }

    try {
      // TODO: Call GitHub GraphQL API
      // Query should fetch:
      // - Recent commit history (last 30 days)
      // - Pull request count (last 30 days)
      // - Test coverage (if available via API or file)
      
      // For now, return mock data
      return this._generateMockMetrics(owner, repo);
    } catch (error) {
      console.error('GitHub API error:', error);
      return this._getDefaultMetrics();
    }
  }

  /**
   * Generate realistic mock metrics for development
   * @private
   */
  _generateMockMetrics(owner, repo) {
    const seed = owner.charCodeAt(0) + repo.charCodeAt(0);
    const activity = (seed % 3); // 0: low, 1: medium, 2: high

    const activityLevels = {
      0: { commits: 4, prs: 1, coverage: 65 },
      1: { commits: 12, prs: 4, coverage: 78 },
      2: { commits: 20, prs: 8, coverage: 85 },
    };

    const level = activityLevels[activity];

    return {
      owner,
      repo,
      commitsWeek: level.commits,
      prsMerged: level.prs,
      testCoverage: level.coverage,
      lastUpdated: new Date().toISOString(),
      source: 'github',
    };
  }

  /**
   * Get default empty metrics
   * @private
   */
  _getDefaultMetrics() {
    return {
      owner: null,
      repo: null,
      commitsWeek: 0,
      prsMerged: 0,
      testCoverage: 0,
      lastUpdated: new Date().toISOString(),
      source: 'github',
    };
  }

  /**
   * Cache management
   * @private
   */
  _getCache(repoPath) {
    if (typeof window === 'undefined') {
      return null; // No cache on server
    }

    const key = this.cacheKey + repoPath;
    const cached = localStorage.getItem(key);

    if (!cached) return null;

    try {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < this.cacheTTL) {
        return data;
      }

      localStorage.removeItem(key);
      return null;
    } catch (error) {
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * @private
   */
  _setCache(repoPath, data) {
    if (typeof window === 'undefined') {
      return; // No cache on server
    }

    try {
      const key = this.cacheKey + repoPath;
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache GitHub metrics:', error);
    }
  }

  /**
   * Determine activity level from commits
   */
  getActivityLevel(commitsWeek) {
    if (!commitsWeek) return 'inactive';
    if (commitsWeek >= 15) return 'very-active';
    if (commitsWeek >= 8) return 'active';
    if (commitsWeek >= 3) return 'moderate';
    return 'low';
  }

  /**
   * Determine code quality from coverage
   */
  getQualityLevel(coverage) {
    if (!coverage) return 'unknown';
    if (coverage >= 80) return 'excellent';
    if (coverage >= 70) return 'good';
    if (coverage >= 50) return 'fair';
    return 'needs-improvement';
  }
}

export default new GitHubAnalyticsService();
