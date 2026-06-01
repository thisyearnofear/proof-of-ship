/**
 * ScoreCircle — large gradient circle showing the AI score (0-100)
 * with the recommendation pill alongside.
 */
import RecommendationPill from "./RecommendationPill";

export default function ScoreCircle({ score, recommendation }) {
  return (
    <div className="flex items-center gap-5">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <span className="text-2xl font-bold text-white">{score}</span>
      </div>
      <div>
        <p className="text-lg font-bold text-text-primary">{score}/100</p>
        <RecommendationPill tier={recommendation} />
      </div>
    </div>
  );
}
