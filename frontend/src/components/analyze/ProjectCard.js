/**
 * ProjectCard — single project tile in the analyze grid. Shows name,
 * ecosystem, category, and a clickable Analyze CTA. When selected
 * for analysis, the spinner replaces the CTA.
 */
import { LoadingSpinner } from "@/components/common/LoadingStates";

export default function ProjectCard({ project, isSelected, isAnalyzing, onSelect }) {
  return (
    <button
      onClick={() => onSelect(project)}
      disabled={isAnalyzing}
      className={`text-left p-4 rounded-xl border transition-all hover:shadow-md ${
        isSelected
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
          : "border-border-primary bg-surface-primary hover:border-indigo-300"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-text-primary text-sm truncate">{project.name}</h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            {project.ecosystem} - {project.category || "General"}
          </p>
        </div>
        {isAnalyzing && isSelected ? (
          <LoadingSpinner size="sm" />
        ) : (
          <span className="text-xs text-indigo-600 font-medium flex-shrink-0 ml-2">Analyze</span>
        )}
      </div>
      {project.description && (
        <p className="text-xs text-text-secondary line-clamp-2">{project.description}</p>
      )}
    </button>
  );
}
