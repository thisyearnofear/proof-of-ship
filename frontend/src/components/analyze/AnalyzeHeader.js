/**
 * AnalyzeHeader — top heading block for the /analyze page.
 */
export default function AnalyzeHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-text-primary mb-2">AI Project Analysis</h1>
      <p className="text-text-secondary max-w-2xl">
        Get instant AI-powered insights on any project - strengths, risks, and a recommendation
        score. Select a project below or search by name.
      </p>
    </div>
  );
}
