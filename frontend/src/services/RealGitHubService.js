/**
 * Real GitHub API Service
 * Actual implementation using GitHub's REST API
 */

class RealGitHubService {
  constructor() {
    this.apiKey = process.env.GITHUB_TOKEN;
    this.baseUrl = "https://api.github.com";
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async makeRequest(endpoint, options = {}) {
    if (!this.isConfigured()) {
      throw new Error("GitHub API token not configured");
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `token ${this.apiKey}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Builder-Credit-Platform",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText} - ${
          error.message || "Unknown error"
        }`
      );
    }

    return response.json();
  }

  /**
   * Get user profile information
   */
  async getUserProfile(username) {
    return this.makeRequest(`/users/${username}`);
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
      // Get all data
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

      // Calculate different scoring aspects
      const scores = {
        profile: this.calculateProfileScore(userData.profile),
        activity: this.calculateActivityScore(commits, userData.stats),
        community: this.calculateCommunityScore(
          pullRequests,
          issues,
          organizations
        ),
        repositories: this.calculateRepositoryScore(
          userData.repos,
          userData.stats
        ),
        consistency: this.calculateConsistencyScore(commits, userData.repos),
      };

      // Calculate weighted total
      const totalScore = Math.round(
        scores.profile * 0.15 +
          scores.activity * 0.25 +
          scores.community * 0.25 +
          scores.repositories * 0.2 +
          scores.consistency * 0.15
      );

      return {
        totalScore: Math.min(totalScore, 100),
        breakdown: scores,
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
    let score = 0;

    // Account age (max 20 points)
    const accountAge =
      (Date.now() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24 * 365);
    score += Math.min(accountAge * 5, 20);

    // Profile completeness (max 30 points)
    if (profile.bio && profile.bio.length > 10) score += 10;
    if (profile.blog && profile.blog.length > 0) score += 5;
    if (profile.location && profile.location.length > 0) score += 5;
    if (profile.company && profile.company.length > 0) score += 5;
    if (profile.email && profile.email.length > 0) score += 5;

    // Social proof (max 30 points)
    score += Math.min(profile.followers / 10, 20);
    score += Math.min(profile.public_repos / 5, 10);

    // Verification (max 20 points)
    if (profile.verified) score += 20;

    return Math.min(score, 100);
  }

  calculateActivityScore(commits, stats) {
    let score = 0;

    // Recent commits (max 40 points)
    const recentCommits = commits.filter((commit) => {
      const commitDate = new Date(commit.commit.author.date);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return commitDate > thirtyDaysAgo;
    });

    score += Math.min(recentCommits.length * 2, 40);

    // Repository activity (max 30 points)
    score += Math.min(stats.recentRepos * 5, 30);

    // Commit frequency (max 30 points)
    score += Math.min(commits.length, 30);

    return Math.min(score, 100);
  }

  calculateCommunityScore(pullRequests, issues, organizations) {
    let score = 0;

    // Pull requests (max 40 points)
    score += Math.min(pullRequests.length * 2, 40);

    // Issues (max 30 points)
    score += Math.min(issues.length * 1.5, 30);

    // Organizations (max 30 points)
    score += Math.min(organizations.length * 10, 30);

    return Math.min(score, 100);
  }

  calculateRepositoryScore(repos, stats) {
    let score = 0;

    // Repository count (max 25 points)
    score += Math.min(stats.publicRepos * 2, 25);

    // Stars received (max 25 points)
    score += Math.min(stats.totalStars / 2, 25);

    // Forks received (max 20 points)
    score += Math.min(stats.totalForks * 2, 20);

    // Repository quality (max 30 points)
    score += Math.min(stats.hasReadme * 2, 20);
    score += Math.min(stats.hasLicense * 2, 10);

    return Math.min(score, 100);
  }

  calculateConsistencyScore(commits, repos) {
    let score = 0;

    // Commit regularity (max 50 points)
    const commitDates = commits.map((c) => new Date(c.commit.author.date));
    const uniqueDays = new Set(commitDates.map((d) => d.toDateString())).size;
    score += Math.min(uniqueDays * 2, 50);

    // Repository maintenance (max 50 points)
    const recentlyUpdated = repos.filter((repo) => {
      const lastUpdate = new Date(repo.updated_at);
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      return lastUpdate > sixMonthsAgo;
    });

    score += Math.min(recentlyUpdated.length * 5, 50);

    return Math.min(score, 100);
  }
}

// Export singleton instance
export const realGitHubService = new RealGitHubService();
export default realGitHubService;
