/**
 * GitHub API Proxy — BFF Route
 * Keeps GITHUB_TOKEN server-side only. Client code calls this route
 * instead of hitting github.com directly with a leaked token.
 *
 * Usage: GET /api/github/users/:username
 *        GET /api/github/repos/:owner/:repo/pulls?state=all&per_page=10
 *        GET /api/github/search/issues?q=...
 */

import { withApiMiddleware } from '@/utils/apiMiddleware';

const GITHUB_API = 'https://api.github.com';

// Only allow safe, public-scoped path prefixes
const ALLOWED_PREFIXES = [
  'users/',
  'repos/',
  'search/',
  'orgs/',
];

function isPathAllowed(githubPath) {
  return ALLOWED_PREFIXES.some((prefix) => githubPath.startsWith(prefix));
}

async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(503).json({
      success: false,
      error: 'GitHub API not configured on server',
    });
  }

  // Reconstruct the GitHub API path from the catch-all [...path] param
  const { path } = req.query;
  if (!path || !Array.isArray(path) || path.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing GitHub API path',
    });
  }

  const githubPath = path.join('/');

  // Validate path is in allowlist
  if (!isPathAllowed(githubPath)) {
    return res.status(403).json({
      success: false,
      error: `Path '${githubPath}' is not allowed. Allowed prefixes: ${ALLOWED_PREFIXES.join(', ')}`,
    });
  }

  const url = `${GITHUB_API}/${githubPath}`;

  // Forward allowed query params (exclude Next.js internals)
  const allowedParams = ['state', 'per_page', 'page', 'sort', 'q', 'since', 'author'];
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (allowedParams.includes(key) && typeof value === 'string') {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  try {
    const response = await fetch(fullUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'PledgeBond-BFF',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return res.status(response.status).json({
        success: false,
        error: `GitHub API error: ${response.status} ${response.statusText}`,
        details: process.env.NODE_ENV !== 'production' ? errorBody : undefined,
      });
    }

    // Parse rate limit headers for debugging
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    const rateLimitReset = response.headers.get('x-ratelimit-reset');

    const data = await response.json();

    return res.status(200).json({
      success: true,
      data,
      meta: {
        rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined,
        rateLimitReset: rateLimitReset ? parseInt(rateLimitReset, 10) : undefined,
      },
    });
  } catch (error) {
    console.error('GitHub proxy error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'GitHub proxy request failed',
    });
  }
}

export default withApiMiddleware(handler, {
  allowedMethods: ['GET'],
  rateLimit: 30,
  rateLimitKey: 'GITHUB_PROXY',
});
