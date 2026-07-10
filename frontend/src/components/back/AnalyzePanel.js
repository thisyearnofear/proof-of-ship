/**
 * AnalyzePanel — project analysis flow (formerly /analyze page body).
 */

import { useUser } from "@/stores/authStore";
import useAnalyzeProjects from "@/hooks/useAnalyzeProjects";
import useUserCreditScore from "@/hooks/useUserCreditScore";
import useAnalyzeProject from "@/hooks/useAnalyzeProject";
import useExplainCredit from "@/hooks/useExplainCredit";
import {
  AnalyzeHeader,
  ProjectSearch,
  CreditScoreCard,
  ProjectGrid,
  AnalysisResult,
  AnalysisLoading,
  AnalysisError,
} from "@/components/analyze";

export default function AnalyzePanel() {
  const { currentUser } = useUser();
  const { filtered, loading, searchQuery, setSearchQuery } = useAnalyzeProjects();
  const userScore = useUserCreditScore(currentUser);
  const analyze = useAnalyzeProject();
  const explainCredit = useExplainCredit(userScore);

  return (
    <div className="space-y-6">
      <AnalyzeHeader compact />
      <ProjectSearch value={searchQuery} onChange={setSearchQuery} />

      {userScore && (
        <CreditScoreCard
          userScore={userScore}
          result={explainCredit.result}
          loading={explainCredit.loading}
          onExplain={explainCredit.run}
        />
      )}

      <div>
        <h2 className="text-lg font-bold text-text-primary mb-4">Select a Project</h2>
        <ProjectGrid
          projects={filtered}
          loading={loading}
          selectedId={analyze.selected?.id}
          analyzing={analyze.loading}
          onSelect={analyze.run}
          searchQuery={searchQuery}
        />
      </div>

      {analyze.error && <AnalysisError message={analyze.error} />}
      {analyze.loading && <AnalysisLoading name={analyze.selected?.name} />}
      {analyze.result && !analyze.loading && (
        <AnalysisResult name={analyze.selected?.name} result={analyze.result} />
      )}
    </div>
  );
}
