/**
 * ExploreProjectListItem — Compact horizontal card for list view of the
 * Projects tab. Shows: thumbnail, name, ecosystem, description, stats,
 * quality % and a bookmark + chevron affordance.
 */

import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { BookmarkIcon as BookmarkOutline } from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { ECOSYSTEM_CONFIGS } from "@/config/ecosystems";
import { getProjectQuality } from "@/lib/projects/projectQuality";

function qualityTextColor(score) {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-gray-400 dark:text-gray-500";
}

export default function ExploreProjectListItem({ project, isBookmarked, onToggleBookmark, onClick }) {
  const ecosystemConfig = ECOSYSTEM_CONFIGS[project.ecosystem];
  const quality = getProjectQuality(project);

  return (
    <div
      onClick={onClick}
      className="bg-surface rounded-xl border border-default p-4 cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 group"
    >
      <div className="flex items-center gap-4">
        {project.imageUrl ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex-shrink-0 flex items-center justify-center">
            <span className="text-2xl">{ecosystemConfig?.icon || "📦"}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-primary dark:text-white text-sm truncate">{project.name}</h3>
            {ecosystemConfig && (
              <span className="text-xs text-secondary flex-shrink-0">
                {ecosystemConfig.icon} {ecosystemConfig.shortName}
              </span>
            )}
            {project.lookingForFunding && (
              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium flex-shrink-0">
                Funding
              </span>
            )}
          </div>
          {project.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{project.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-secondary">
            {project.stats?.commits > 0 && <span>{project.stats.commits} commits</span>}
            {project.stats?.stars > 0 && <span>{project.stats.stars} ★</span>}
            <span className={`font-medium ${
              quality.score < 25 && !(project.stats?.commits || project.stats?.stars || project.stats?.healthScore)
                ? "text-blue-500 dark:text-blue-400"
                : qualityTextColor(quality.score)
            }`}>
              {quality.score < 25 && !(project.stats?.commits || project.stats?.stars || project.stats?.healthScore)
                ? "New"
                : `${quality.score}% quality`}
            </span>
            {project.category && <span>· {project.category}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
            className={`p-1.5 rounded-lg transition-all ${
              isBookmarked
                ? "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                : "text-muted opacity-0 group-hover:opacity-100 hover:text-amber-400"
            }`}
            title={isBookmarked ? "Remove bookmark" : "Bookmark project"}
          >
            {isBookmarked ? <BookmarkSolid className="w-4 h-4" /> : <BookmarkOutline className="w-4 h-4" />}
          </button>
          <ChevronRightIcon className="w-4 h-4 text-muted group-hover:text-gray-500 dark:text-gray-400 transition-colors" />
        </div>
      </div>
    </div>
  );
}
