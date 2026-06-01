/**
 * ProjectGrid — 3-column responsive grid of ProjectCard tiles, with
 * loading + empty states.
 */
import { Card } from "@/components/common/Card";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import ProjectCard from "./ProjectCard";

export default function ProjectGrid({ projects, loading, selectedId, analyzing, onSelect, searchQuery }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }
  if (projects.length === 0) {
    return (
      <Card className="p-8 text-center text-text-secondary">
        {searchQuery
          ? `No projects matching "${searchQuery}"`
          : "No projects found. Submit a project first to see AI analysis."}
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isSelected={selectedId === project.id}
          isAnalyzing={analyzing}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
