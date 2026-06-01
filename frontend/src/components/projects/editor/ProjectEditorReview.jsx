/**
 * ProjectEditorReview — Step 3 read-only summary of the project before
 * submit.
 */

import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Card } from "@/components/common/Card";

function ReviewField({ label, value }) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{value || "—"}</p>
    </div>
  );
}

export default function ProjectEditorReview({ form, ecosystemConfig }) {
  const milestones = (form.milestones || []).filter(Boolean);
  return (
    <Card className="p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Review & Submit</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Review your project before submitting. All required fields are complete.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReviewField label="Name" value={form.name} />
        <ReviewField label="Ecosystem" value={ecosystemConfig?.shortName || form.ecosystem} />
        <div className="p-4 bg-gray-50 rounded-xl md:col-span-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Description</p>
          <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-3">{form.description || "—"}</p>
        </div>
        <ReviewField label="GitHub" value={form.githubUrl} />
        <ReviewField label="Category" value={form.category} />
        {form.website && <ReviewField label="Website" value={form.website} />}
        {form.twitter && <ReviewField label="Twitter" value={form.twitter} />}
        {form.discord && <ReviewField label="Discord" value={form.discord} />}

        {milestones.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-xl md:col-span-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-2">Milestones ({milestones.length})</p>
            <ul className="space-y-1">
              {milestones.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{String(m)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {form.lookingForFunding && (
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Funding</p>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Seeking {form.fundingAmount || "support"}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
