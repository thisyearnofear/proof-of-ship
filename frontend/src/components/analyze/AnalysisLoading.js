/**
 * AnalysisLoading — card shown while analysis is in flight.
 */
import { Card } from "@/components/common/Card";
import { LoadingSpinner } from "@/components/common/LoadingStates";

export default function AnalysisLoading({ name }) {
  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-3">
        <LoadingSpinner size="md" />
        <div>
          <p className="font-medium text-text-primary">Analyzing {name}...</p>
          <p className="text-sm text-text-tertiary">Running AI analysis - results in a few seconds</p>
        </div>
      </div>
    </Card>
  );
}
