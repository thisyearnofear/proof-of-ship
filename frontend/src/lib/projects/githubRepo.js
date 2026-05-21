const GITHUB_REPO_RE = /github\.com[/:]([^/\s]+)\/([^/\s#?]+)(?:[/?#].*)?$/i;

export function parseGitHubRepoUrl(url = '') {
  const value = String(url || '').trim();
  const match = value.match(GITHUB_REPO_RE);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, ''),
    url: `https://github.com/${match[1]}/${match[2].replace(/\.git$/i, '')}`
  };
}

export function isGitHubRepoUrl(url = '') {
  return Boolean(parseGitHubRepoUrl(url));
}

