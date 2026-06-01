/**
 * PortfolioStats — 4-card stat grid for the /scout page.
 *
 * Pure presentational; expects a stats object with: totalEvaluated,
 * totalBacked, totalStaked, winRate.
 */
import { Card } from "@/components/common/Card";

const TONES = {
  evaluated: { value: "text-white" },
  backed:    { value: "text-emerald-400" },
  staked:    { value: "text-cyan-400 dark:text-cyan-500" },
  winRate:   { value: "text-amber-400" },
};

export default function PortfolioStats({ stats }) {
  const cards = [
    { label: "Projects Evaluated",  value: stats.totalEvaluated,            tone: TONES.evaluated },
    { label: "Backings Executed",   value: stats.totalBacked,               tone: TONES.backed },
    { label: "Total Staked",        value: `$${stats.totalStaked.toFixed(2)}`, tone: TONES.staked },
    { label: "Success Rate",        value: `${stats.winRate}%`,              tone: TONES.winRate },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="bg-slate-900 border-slate-800 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{c.label}</div>
          <div className={`text-2xl font-bold ${c.tone.value}`}>{c.value}</div>
        </Card>
      ))}
    </div>
  );
}
