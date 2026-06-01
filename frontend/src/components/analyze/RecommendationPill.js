/**
 * RecommendationPill — colored pill displaying the AI recommendation tier.
 */
const TIER_STYLES = {
  "strong-back": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "moderate-back": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "watch": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

const DEFAULT_STYLE = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

export default function RecommendationPill({ tier }) {
  const style = TIER_STYLES[tier] || DEFAULT_STYLE;
  return (
    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${style}`}>
      {(tier || "").replace("-", " ")}
    </span>
  );
}
