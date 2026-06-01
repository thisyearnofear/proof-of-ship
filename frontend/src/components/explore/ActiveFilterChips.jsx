/**
 * ActiveFilterChips — Renders a row of pill-shaped chips for the
 * currently-applied filters, each with an X button to remove it.
 * Returns null when no filters are active.
 */

import { XMarkIcon } from "@heroicons/react/24/outline";

export default function ActiveFilterChips({ filters, onRemove, onClearAll }) {
  if (!filters || filters.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs text-secondary font-medium">Filters:</span>
      {filters.map((f, i) => (
        <span
          key={`${f.label}-${i}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
        >
          {f.label}
          <button
            onClick={() => onRemove(f.key)}
            className="hover:text-blue-900 dark:text-blue-200 dark:hover:text-blue-100 transition-colors"
          >
            <XMarkIcon className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium ml-1"
      >
        Clear all
      </button>
    </div>
  );
}
