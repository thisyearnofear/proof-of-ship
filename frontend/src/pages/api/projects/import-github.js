import { withApiMiddleware } from '@/utils/apiMiddleware';
import { parseGitHubRepoUrl } from '@/lib/projects/githubRepo';

const GITHUB_API = 'https://api.github.com';

async function handler(req, res) {
  const parsed = parseGitHubRepoUrl(req.query.url);

  if (!parsed) {
    return res.status(400).json({ error: 'A valid GitHub repository URL is required' });
  }

  try {
    const [repo, readme] = await Promise.all([
      githubFetch(`/repos/${parsed.owner}/${parsed.repo}`),
      githubFetch(`/repos/${parsed.owner}/${parsed.repo}/readme`).catch(() => null)
    ]);

    const readmeText = readme?.content
      ? Buffer.from(readme.content, 'base64').toString('utf8')
      : '';

    return res.status(200).json({
      success: true,
      project: {
        name: repo.name || parsed.repo,
        description: repo.description || summarizeReadme(readmeText) || '',
        githubUrl: repo.html_url || parsed.url,
        website: repo.homepage || '',
        tags: Array.isArray(repo.topics) ? repo.topics : [],
        isOpenSource: !repo.private,
        primaryLanguage: repo.language || '',
        license: repo.license?.spdx_id || repo.license?.name || '',
        defaultBranch: repo.default_branch || 'main',
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        openIssues: repo.open_issues_count || 0,
        pushedAt: repo.pushed_at || null,
        readmeSummary: summarizeReadme(readmeText)
      }
    });
  } catch (error) {
    console.error('GitHub project import failed:', error);
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to import GitHub project'
    });
  }
}

async function githubFetch(path) {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'PledgeBond-ProjectImport'
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`${GITHUB_API}${path}`, { headers });

  if (!response.ok) {
    const error = new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    error.statusCode = response.status;
    throw error;
  }

  return response.json();
}

function summarizeReadme(readmeText = '') {
  const cleaned = String(readmeText || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[[^\]]+]\([^)]*\)/g, (match) => match.match(/\[([^\]]+)]/)?.[1] || '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[#>*_`~|-]/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 40)
    .slice(0, 2)
    .join(' ');

  return cleaned.length > 260 ? `${cleaned.slice(0, 257).trim()}...` : cleaned;
}

export default withApiMiddleware(handler, {
  allowedMethods: ['GET'],
  rateLimit: 20,
  rateLimitKey: 'PROJECT_GITHUB_IMPORT'
});

