import { useGithub } from "@/providers/Github/Github";
import {
  CodeBracketIcon,
  TagIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  CloudArrowDownIcon,
  UserIcon,
  LinkIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { StatCard } from "@/components/common/cards";
import { celoProjects } from "@/constants/celoProjects";
import {
  OnChainStats,
  EnhancedContractData,
  ContractUsageSection,
} from "@/components/contracts";

export default function Dashboard() {
  const { issues, prs, releases, repos, selectedSlug, setSelectedSlug } =
    useGithub();
  const currentRepo = repos.find((r) => r.slug === selectedSlug) || {};
  const repoName = currentRepo.repo || selectedSlug;

  // Get project data and provide empty fallback in edge case
  const currentProject =
    celoProjects.find((p) => p.slug === selectedSlug) || {};

  // Compile "info cards" for top row with placeholders as needed
  const infoCards = [];

  // 1. Founder Card(s) or placeholder
  if (currentProject.founders && currentProject.founders.length > 0) {
    currentProject.founders.forEach((founder) => {
      infoCards.push({
        title: "Founder",
        value: founder.name || founder.url,
        icon: <UserIcon />,
        link: founder.url,
      });
    });
  } else {
    infoCards.push({
      title: "Founder",
      value: "No founder info yet",
      icon: <UserIcon />,
      placeholder: true,
    });
  }

  // 2. Project Card (Social) or placeholder
  if (
    currentProject.socials &&
    (currentProject.socials.twitter || currentProject.socials.website)
  ) {
    infoCards.push({
      title: "Project",
      value: currentProject.name,
      icon: <LinkIcon />,
      link: currentProject.socials.website || currentProject.socials.twitter,
    });
  } else {
    infoCards.push({
      title: "Project",
      value: "No socials yet",
      icon: <LinkIcon />,
      placeholder: true,
    });
  }

  // 3. Contract Card(s) or placeholder
  if (currentProject.contracts && currentProject.contracts.length > 0) {
    currentProject.contracts.forEach((contractObj) => {
      infoCards.push({
        title: contractObj.label || "Contract",
        value: contractObj.address,
        icon: <CodeBracketIcon />,
        link:
          contractObj.explorer ||
          `https://celoscan.io/address/${contractObj.address}`,
      });
    });
  } else {
    infoCards.push({
      title: "Contract",
      value: "No contract yet",
      icon: <CodeBracketIcon />,
      placeholder: true,
    });
  }

  // Project selector UI
  const ProjectSelector = () => (
    <div className="w-full flex flex-col items-center mb-8">
      <div className="flex items-center w-full max-w-xl bg-amber-50 border-2 border-amber-400 rounded-xl px-6 py-4 shadow">
        <span className="mr-4 text-amber-600">
          <ArrowTrendingUpIcon className="w-8 h-8" />
        </span>
        <label className="block text-lg font-semibold text-gray-800 mr-4 whitespace-nowrap">
          Select Project
        </label>
        <select
          value={selectedSlug || ""}
          onChange={(e) => setSelectedSlug(e.target.value)}
          className="flex-1 bg-white border border-amber-400 text-gray-900 px-4 py-2 rounded-md text-lg focus:ring-amber-400 focus:border-amber-500"
        >
          <option value="" disabled>
            Select a project…
          </option>
          {/* Group by season - reversed order */}
          {[3, 2, 1].map((season) => (
            <optgroup key={season} label={`Season ${season}`}>
              {repos
                .filter((r) => r.season === season)
                .map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.slug}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>
      <hr className="w-full max-w-xl border-t-2 border-amber-200 mt-4" />
    </div>
  );

  // Calculate statistics
  const totalDownloads =
    releases?.reduce((total, release) => {
      const releaseDownloads = release.assets.reduce(
        (sum, asset) => sum + asset.download_count,
        0
      );
      return total + releaseDownloads;
    }, 0) || 0;
  const openIssuesCount =
    issues?.filter((issue) => {
      return issue.state === "open";
    })?.length || 0;
  const openPRsCount = prs?.filter((pr) => pr?.state === "open")?.length || 0;
  const latestVersion = releases?.[0]?.tag_name || "v0.0.0";
  const latestRelease = releases?.[0];

  // Get PR statistics
  const recentPRs = prs?.slice(0, 5) || [];

  return (
    <div className="p-4">
      <ProjectSelector />
      {!selectedSlug ? (
        <div className="text-center text-gray-500 mt-12">
          Please select a project to view its dashboard.
        </div>
      ) : (
        <>
          {/* --- TOP: INFO CARDS ROW (Founder, Project, Contracts) --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {infoCards.map((card, idx) => (
              <StatCard
                key={idx}
                title={card.title}
                value={card.value}
                icon={card.icon}
                link={card.link}
              />
            ))}
          </div>

          <h1 className="text-3xl font-bold mb-8 tracking-tight text-gray-900 border-b pb-2">
            Dashboard: {repoName}
          </h1>

          {/* --- MAIN CONTENT: Contract-focused or GitHub-focused layout --- */}
          {currentProject.contracts && currentProject.contracts.length > 0 ? (
            /* Contract-focused layout */
            <div className="grid grid-cols-1 gap-12">
              {/* Enhanced Contract Data for all projects with contracts */}
              <EnhancedContractData
                contract={currentProject.contracts[0]}
                prs={prs}
                releases={releases}
              />

              {/* --- CONTRACT USAGE SECTION --- */}
              <ContractUsageSection contract={currentProject.contracts[0]} />
            </div>
          ) : (
            /* GitHub-focused layout (fallback when no contract) */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent PRs */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Recent Pull Requests
                </h2>
                <div className="space-y-4">
                  {recentPRs.length > 0 ? (
                    recentPRs.map((pr) => (
                      <div
                        key={pr.id}
                        className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg"
                      >
                        <img
                          src={pr.user.avatar_url}
                          alt={pr.user.login}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <a
                            href={pr.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {pr.title}
                          </a>
                          <div className="text-sm text-gray-500">
                            #{pr.number} opened by {pr.user.login}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No pull requests found
                    </div>
                  )}
                </div>
              </div>

              {/* Latest Release */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Latest Release Details
                </h2>
                {latestRelease ? (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-medium">
                        {latestRelease.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Released on{" "}
                        {new Date(
                          latestRelease.published_at
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Downloads by Platform</h4>
                      {latestRelease.assets.length > 0 ? (
                        latestRelease.assets.map((asset) => (
                          <div
                            key={asset.id}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm text-gray-600">
                              {asset.name}
                            </span>
                            <span className="text-sm font-medium">
                              {asset.download_count.toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-2">
                          No assets found
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No releases found
                  </div>
                )}
              </div>

              {/* Empty Contract Stats Placeholder */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-2">On-Chain Stats</h2>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ChartBarIcon className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">No contract address available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Add a contract address to view on-chain statistics
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --- BOTTOM: METRICS CARDS ROW --- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <StatCard
              title="All Time Downloads"
              value={totalDownloads.toLocaleString()}
              icon={<CloudArrowDownIcon />}
            />
            <StatCard
              title="Open Issues"
              value={openIssuesCount}
              icon={<ExclamationCircleIcon />}
            />
            <StatCard
              title="Open PRs"
              value={openPRsCount}
              icon={<CodeBracketIcon />}
            />
            <StatCard
              title="Latest Version"
              value={latestVersion}
              icon={<TagIcon />}
            />
          </div>
        </>
      )}
    </div>
  );
}

// StatCard: visually distinguish placeholder cards
