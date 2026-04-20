/**
 * Score Preview API — Public, lightweight credit score estimate
 * Returns an estimated score from public GitHub data (profile + repos only).
 * No auth required. Skips expensive calls (commits, PRs, issues, orgs).
 *
 * Usage: GET /api/score/preview?username=octocat
 */

import { withApiMiddleware } from '@/utils/apiMiddleware';

const GITHUB_API = 'https://api.github.com';
const USERNAME_REGEX = /^[a-zA-Z0-9-]{1,39}$/;

function getTierLabel(creditScore) {
  if (creditScore >= 800) return 'Elite Voyager';
  if (creditScore >= 700) return 'Proven Captain';
  if (creditScore >= 550) return 'Rising Builder';
  if (creditScore >= 400) return 'New Sailor';
  return 'Unscored';
}

/**
 * Profile score — mirrors RealGitHubService.calculateProfileScore
 */
function calculateProfileScore(profile) {
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

/**
 * Repository score — mirrors RealGitHubService.calculateRepositoryScore
 */
function calculateRepositoryScore(repos) {
  const publicRepos = repos.filter((r) => !r.private);
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
  const hasReadme = repos.filter((r) => r.has_readme).length;
  const hasLicense = repos.filter((r) => r.license).length;

  let score = 0;

  // Repository count (max 25 points)
  score += Math.min(publicRepos.length * 2, 25);

  // Stars received (max 25 points)
  score += Math.min(totalStars / 2, 25);

  // Forks received (max 20 points)
  score += Math.min(totalForks * 2, 20);

  // Repository quality (max 30 points)
  score += Math.min(hasReadme * 2, 20);
  score += Math.min(hasLicense * 2, 10);

  return Math.min(score, 100);
}

async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(503).json({
      success: false,
      error: 'GitHub API not configured on server',
    });
  }

  const { username } = req.query;
  if (!username || !USERNAME_REGEX.test(username)) {
    return res.status(400).json({
      success: false,
      error:
        'Invalid or missing username. Must be 1-39 alphanumeric characters or hyphens.',
    });
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'ProofOfShip-BFF',
  };

  try {
    const [profileRes, reposRes] = await Promise.all([
      fetch(`${GITHUB_API}/users/${username}`, { headers }),
      fetch(
        `${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated`,
        { headers }
      ),
    ]);

    if (!profileRes.ok) {
      const status = profileRes.status === 404 ? 404 : profileRes.status;
      return res.status(status).json({
        success: false,
        error:
          status === 404
            ? `GitHub user '${username}' not found`
            : `GitHub API error: ${profileRes.status} ${profileRes.statusText}`,
      });
    }

    if (!reposRes.ok) {
      return res.status(reposRes.status).json({
        success: false,
        error: `GitHub API error: ${reposRes.status} ${reposRes.statusText}`,
      });
    }

    const [profile, repos] = await Promise.all([
      profileRes.json(),
      reposRes.json(),
    ]);

    // Use the same weights as RealGitHubService.calculateGitHubScore
    // Profile: 15%, Repositories: 20%
    // Activity (25%), Community (25%), Consistency (15%) are unavailable — omitted
    const profileScore = calculateProfileScore(profile);
    const repoScore = calculateRepositoryScore(repos);

    // Normalise to a 0-100 scale using the available weight ratio (0.15 + 0.20 = 0.35)
    const rawWeighted = profileScore * 0.15 + repoScore * 0.2;
    const internalScore = Math.min(Math.round(rawWeighted / 0.35), 100);

    // Map 0-100 → 400-850 credit range
    const estimatedScore = Math.round(400 + (internalScore / 100) * 450);

    const publicRepos = repos.filter((r) => !r.private).length;
    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24)
    );

    return res.status(200).json({
      success: true,
      data: {
        username: profile.login,
        estimatedScore,
        tier: getTierLabel(estimatedScore),
        breakdown: {
          profile: Math.round(profileScore),
          repositories: Math.round(repoScore),
        },
        stats: {
          publicRepos,
          totalStars,
          accountAgeDays,
          followers: profile.followers,
        },
      },
    });
  } catch (error) {
    console.error('Score preview error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate score preview',
    });
  }
}

export default withApiMiddleware(handler, {
  allowedMethods: ['GET'],
  rateLimit: 10,
  rateLimitKey: 'SCORE_PREVIEW',
});
