/**
 * ProjectSearch — search input for filtering the analyze project grid.
 */
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function ProjectSearch({ value, onChange }) {
  return (
    <div className="relative mb-6">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
      <input
        type="text"
        placeholder="Search projects to analyze..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-primary bg-surface-primary text-text-primary placeholder:text-text-tertiary text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}
