/**
 * CreditScoreCard — credit profile summary + AI explain button. Shown
 * only when the user has a credit score.
 */
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import SourceBadge from "./SourceBadge";

export default function CreditScoreCard({ userScore, result, loading, onExplain }) {
  return (
    <Card className="p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Your Credit Profile</h2>
          <p className="text-sm text-text-secondary">AI explanation of your PledgeBond score</p>
        </div>
        <Button
          variant="outline"
          onClick={onExplain}
          disabled={loading}
          className="text-sm"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" /> Analyzing...
            </>
          ) : (
            "Explain My Score"
          )}
        </Button>
      </div>

      {result && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <SourceBadge source={result.source} />
            <span className="text-sm font-medium text-text-primary">
              Score: {userScore.reputation || userScore.creditScore || "N/A"}
            </span>
          </div>
          <div className="p-3 bg-surface-secondary rounded-lg text-sm text-text-secondary whitespace-pre-wrap">
            {result.text}
          </div>
        </div>
      )}
    </Card>
  );
}
