/**
 * AnalyzeHeader — heading block for project analysis.
 * @param {{ compact?: boolean }} props
 */
export default function AnalyzeHeader({ compact = false }) {
  const TitleTag = compact ? "h2" : "h1";
  return (
    <div className={compact ? "mb-4" : "mb-8"}>
      <TitleTag className={`${compact ? "text-xl" : "text-3xl"} font-bold text-text-primary mb-2`}>
        Underwriter
      </TitleTag>
      <p className="text-text-secondary max-w-2xl text-sm sm:text-base">
        Score a project into a shareable packet — strengths, risks, and a recommendation.
        For winners, run this from Build → Wins after claiming your win.
      </p>
    </div>
  );
}
