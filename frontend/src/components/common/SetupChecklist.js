/**
 * SetupChecklist — horizontal login/setup progress strip.
 * Matches the step-indicator pattern from ProjectEditorStepNav.
 */

import { CheckCircleIcon } from "@heroicons/react/24/outline";

/**
 * @param {{ steps: Array<{ id: string, label: string, status: 'pending' | 'active' | 'complete' }>, className?: string }} props
 */
export default function SetupChecklist({ steps, className = "" }) {
  if (!steps?.length) return null;

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
        {steps.map((step, index) => {
          const isComplete = step.status === "complete";
          const isActive = step.status === "active";
          return (
            <div key={step.id} className="flex items-center gap-2 sm:gap-4">
              {index > 0 && (
                <div className={`hidden sm:block w-6 h-0.5 rounded ${isComplete || isActive ? "bg-emerald-400" : "bg-gray-200 dark:bg-gray-700"}`} />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isComplete
                      ? "bg-emerald-500 text-white"
                      : isActive
                        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 ring-4 ring-gray-900/10 dark:ring-gray-100/10"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {isComplete ? <CheckCircleIcon className="w-5 h-5" /> : index + 1}
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isActive
                      ? "text-gray-900 dark:text-gray-100"
                      : isComplete
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
