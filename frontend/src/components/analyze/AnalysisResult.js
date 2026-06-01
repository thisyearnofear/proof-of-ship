/**
 * AnalysisResult — full result card showing source badge, score
 * circle, summary, and strengths/risks. Falls back to raw text if
 * the result didn't parse as JSON.
 */
import { Card } from "@/components/common/Card";
import SourceBadge from "./SourceBadge";
import ScoreCircle from "./ScoreCircle";
import StrengthsRisksCard from "./StrengthsRisksCard";

export default function AnalysisResult({ name, result }) {
  if (!result) return null;
  return (
    <Card className="p-6 mb-6 border-indigo-200 dark:border-indigo-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-primary">{name}</h3>
        <SourceBadge source={result.source} />
      </div>

      {result.parsed ? (
        <div className="space-y-5">
          <ScoreCircle
            score={result.parsed.score}
            recommendation={result.parsed.recommendation}
          />
          {result.parsed.summary && (
            <p className="text-sm text-text-secondary">{result.parsed.summary}</p>
          )}
          <StrengthsRisksCard
            strengths={result.parsed.strengths}
            risks={result.parsed.risks}
          />
        </div>
      ) : (
        <div className="p-4 bg-surface-secondary rounded-lg text-sm text-text-secondary whitespace-pre-wrap">
          {result.text}
        </div>
      )}
    </Card>
  );
}
