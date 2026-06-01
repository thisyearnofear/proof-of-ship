/**
 * StrengthsRisksCard — two-column strengths/risks list with color-coded
 * sign markers. Falls back to null for empty sections.
 */
const SIGN = {
  strengths: { color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800", label: "text-green-700 dark:text-green-300", glyph: "+" },
  risks: { color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800", label: "text-red-700 dark:text-red-300", glyph: "-" },
};

function List({ kind, items }) {
  if (!items || items.length === 0) return null;
  const s = SIGN[kind];
  return (
    <div className={`p-4 rounded-lg ${s.bg} border`}>
      <p className={`text-xs font-bold ${s.label} uppercase tracking-wider mb-2`}>
        {kind}
      </p>
      <ul className="text-sm text-text-secondary space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`${s.color} mt-0.5 flex-shrink-0`}>{s.glyph}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StrengthsRisksCard({ strengths, risks }) {
  if (!strengths?.length && !risks?.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <List kind="strengths" items={strengths} />
      <List kind="risks" items={risks} />
    </div>
  );
}
