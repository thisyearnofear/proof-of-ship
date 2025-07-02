import React from "react";
import { useContractData } from "@/hooks/useContractData";
import { useSocialData } from "@/hooks/useSocialData";
import { formatAddress } from "@/utils/web3";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import StatCard from "@/components/common/cards";

const MilestoneTracker = ({ milestones }) => {
  if (!milestones || milestones.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <h4 className="text-xs font-bold text-gray-600">Milestones</h4>
      <ul className="space-y-1 mt-1">
        {milestones.map((milestone, index) => (
          <li key={index} className="flex items-center text-xs">
            <svg
              className={`h-4 w-4 mr-2 ${
                milestone.completed ? "text-green-500" : "text-gray-400"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d={
                  milestone.completed
                    ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    : "M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"
                }
                clipRule="evenodd"
              />
            </svg>
            <span className={milestone.completed ? "line-through" : ""}>
              {milestone.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function ProjectCard({
  project,
  onchainStats,
  loanStatus,
  milestones,
}) {
  // Get auth context to check if user can edit this project
  const { currentUser, hasProjectPermission } = useAuth();
  const canEdit = currentUser && hasProjectPermission(project.slug);

  // Get contract data for the first contract (if any)
  const contractAddress = project.contracts?.[0]?.address;
  const { contractData, isLoading: isContractLoading } = useContractData(
    contractAddress,
    "mainnet"
  );

  // Get social data
  const { socialData } = useSocialData(project.socials);

  return (
    <div className="bg-white border rounded-lg p-4 flex flex-col justify-between shadow hover:shadow-md transition">
      <div>
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold truncate">{project.name}</h3>

          {canEdit && (
            <Link
              href={`/projects/${project.slug}/edit`}
              className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded transition"
            >
              Edit
            </Link>
          )}
        </div>

        {/* Season badge */}
        {project.season && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mt-1">
            Season {project.season}
          </span>
        )}

        {loanStatus && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
              loanStatus === "Active"
                ? "bg-blue-100 text-blue-800"
                : loanStatus === "Repaid"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Loan: {loanStatus}
          </span>
        )}

        {/* Contracts */}
        {project.contracts?.length > 0 && (
          <div className="flex flex-wrap gap-1 text-xs text-gray-500 mt-2">
            {project.contracts.map((c) => (
              <a
                key={c.address}
                href={c.explorer || `https://celoscan.io/address/${c.address}`}
                className="inline-flex items-center px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="font-mono">
                  {formatAddress(c.address, 4, 4)}
                </span>
                {c.label && (
                  <span className="ml-1 text-gray-600">({c.label})</span>
                )}
              </a>
            ))}
          </div>
        )}

        {/* Founders */}
        {project.founders?.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">Founders:</span>{" "}
            {project.founders.map((founder, idx) => (
              <React.Fragment key={founder.name}>
                {idx > 0 && ", "}
                {founder.url ? (
                  <a
                    href={founder.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {founder.name}
                  </a>
                ) : (
                  <span>{founder.name}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* On-chain stats */}
      <div className="mt-3">
        {isContractLoading ? (
          <div className="animate-pulse flex space-x-2 my-2">
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ) : contractData ? (
          <div className="grid grid-cols-2 gap-1 my-2 text-xs">
            <StatCard
              title="Type"
              value={contractData.type || "Contract"}
              icon={null}
            />
            <StatCard
              title="Txns"
              value={contractData.txCount?.toLocaleString() || "0"}
              icon={null}
            />
            {contractData.type === "ERC20" && contractData.details && (
              <StatCard
                title="Token"
                value={`${contractData.details.symbol} (${contractData.details.name})`}
                icon={null}
                className="col-span-2"
              />
            )}
          </div>
        ) : onchainStats ? (
          <div className="grid grid-cols-2 gap-1 my-2 text-xs">
            <div>
              <span className="font-semibold">Txns:</span>{" "}
              {onchainStats.txns?.toLocaleString() ?? "--"}
            </div>
            <div>
              <span className="font-semibold">Holders:</span>{" "}
              {onchainStats.holders?.toLocaleString() ?? "--"}
            </div>
          </div>
        ) : (
          project.contracts?.length > 0 && (
            <div className="italic text-gray-400 text-xs my-2">
              On-chain data not available.
            </div>
          )
        )}
      </div>

      <MilestoneTracker milestones={milestones} />

      {/* Social links */}
      <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-gray-100">
        {/* Twitter/X */}
        {project.socials?.twitter && (
          <a
            href={project.socials.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition"
            aria-label="Twitter/X"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
            </svg>
            {socialData?.twitter?.followers ? (
              <span>{socialData.twitter.followers.toLocaleString()}</span>
            ) : (
              <span>--</span>
            )}
          </a>
        )}

        {/* Discord */}
        {project.socials?.discord && (
          <a
            href={project.socials.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-indigo-600 transition"
            aria-label="Discord"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.39-.444.977-.608 1.414a17.97 17.97 0 0 0-5.487 0 12.197 12.197 0 0 0-.617-1.414.077.077 0 0 0-.079-.036c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.202 13.202 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.964 19.964 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"></path>
            </svg>
            {socialData?.discord?.members ? (
              <span>{socialData.discord.members.toLocaleString()}</span>
            ) : (
              <span>--</span>
            )}
          </a>
        )}

        {/* Farcaster */}
        {project.socials?.farcaster && socialData?.farcaster?.profile && (
          <a
            href={`https://warpcast.com/${socialData.farcaster.profile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-purple-600 transition"
            aria-label="Farcaster"
          >
            {/* Farcaster Icon */}
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.248 4.932L8.493 15.41l-2.41-4.927L13.248 4.932z"
                fill="#8A63D2"
              />
              <path
                d="M15.659 10.483l-2.411-4.928-4.755 10.478 2.41 4.928 4.756-10.478z"
                fill="#8A63D2"
              />
            </svg>
            {socialData.farcaster.followers ? (
              <span>{socialData.farcaster.followers.toLocaleString()}</span>
            ) : (
              <span>--</span>
            )}
          </a>
        )}

        {/* Lens */}
        {project.socials?.lens && socialData?.lens?.profile && (
          <a
            href={`https://hey.xyz/u/${socialData.lens.profile.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-green-600 transition"
            aria-label="Lens"
          >
            {/* Lens Icon */}
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                fill="#A0D84E"
              />
              <path
                d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                fill="#A0D84E"
              />
            </svg>
            {socialData.lens.followers ? (
              <span>{socialData.lens.followers.toLocaleString()}</span>
            ) : (
              <span>--</span>
            )}
          </a>
        )}

        {/* Website */}
        {project.socials?.website && (
          <a
            href={project.socials.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition"
            aria-label="Website"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              ></path>
            </svg>
            <span>Website</span>
          </a>
        )}
      </div>
    </div>
  );
}
