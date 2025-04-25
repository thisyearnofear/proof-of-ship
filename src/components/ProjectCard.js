import React from "react";

export default function ProjectCard({ project, onchainStats }) {
  return (
    <div className="bg-white border rounded-lg p-4 flex flex-col justify-between shadow hover:shadow-md transition">
      <div>
        <h3 className="text-xl font-bold truncate">{project.name}</h3>
        <div className="flex flex-wrap gap-1 text-xs text-gray-500 mt-1">
          {project.contracts?.map((c) => (
            <a
              key={c.address}
              href={`https://celoscan.io/address/${c.address}`}
              className="mr-2 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {c.label}
            </a>
          ))}
        </div>
      </div>
      <div className="mt-2">
        {/* Example onchain stats (to be hooked up to APIs or props if available) */}
        {onchainStats ? (
          <div className="grid grid-cols-2 gap-1 my-2 text-sm">
            <div>
              <span className="font-semibold">Txns:</span>{" "}
              {onchainStats.txns ?? "--"}
            </div>
            <div>
              <span className="font-semibold">Holders:</span>{" "}
              {onchainStats.holders ?? "--"}
            </div>
            {/* Add additional onchain metrics here */}
          </div>
        ) : (
          <div className="italic text-gray-400 text-xs mb-2">
            Onchain stats unavailable
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-auto pt-2">
        {project.socials?.twitter && (
          <a
            href={project.socials.twitter}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
          >
            <svg
              /* Twitter SVG icon */ className="w-5 h-5 text-blue-400 hover:text-blue-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 ..." />
            </svg>
          </a>
        )}
        {project.socials?.discord && (
          <a
            href={project.socials.discord}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord"
          >
            <svg
              /* Discord SVG icon */ className="w-5 h-5 text-indigo-400 hover:text-indigo-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 ..." />
            </svg>
          </a>
        )}
        {project.socials?.website && (
          <a
            href={project.socials.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Website"
          >
            <svg
              /* Website/Link SVG icon */ className="w-5 h-5 text-gray-400 hover:text-gray-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 ..." />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
