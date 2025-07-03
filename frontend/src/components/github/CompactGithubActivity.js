import React from 'react';

/**
 * CompactGithubActivity Component
 * A compact version of GitHub activity to be displayed in the contract-focused layout
 */
export default function CompactGithubActivity({ prs, releases }) {
  const recentPRs = prs?.slice(0, 3) || [];
  const latestRelease = releases?.[0];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-md font-semibold mb-3">GitHub Activity</h2>
      
      {/* PRs Section */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Pull Requests</h3>
        {recentPRs.length > 0 ? (
          <div className="space-y-2">
            {recentPRs.map((pr) => (
              <div key={pr.id} className="flex items-center space-x-2 text-sm">
                <img
                  src={pr.user.avatar_url}
                  alt={pr.user.login}
                  className="w-6 h-6 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 truncate block"
                  >
                    {pr.title}
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recent pull requests</p>
        )}
      </div>
      
      {/* Release Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Latest Release</h3>
        {latestRelease ? (
          <div className="text-sm">
            <a
              href={latestRelease.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {latestRelease.name || latestRelease.tag_name}
            </a>
            <p className="text-xs text-gray-500">
              Released on {new Date(latestRelease.published_at).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No releases found</p>
        )}
      </div>
    </div>
  );
}
