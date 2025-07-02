import ProjectEditor from "@/components/projects/ProjectEditor";

export default function NewProjectPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Submit a New Project</h1>
      <ProjectEditor />
    </div>
  );
}
