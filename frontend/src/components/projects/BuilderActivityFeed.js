import React, { useMemo } from "react";
import { Card } from "@/components/common/Card";
import {
  ChatBubbleLeftRightIcon,
  RocketLaunchIcon,
  SparklesIcon,
  CheckCircleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { getEcosystemConfig } from "@/config/ecosystems";

const ACTIVITY_ICONS = {
  micro_update: ChatBubbleLeftRightIcon,
  milestone: RocketLaunchIcon,
  verification: CheckCircleIcon,
  deployment: SparklesIcon,
  follow: UserPlusIcon,
};

const ACTIVITY_COLORS = {
  micro_update: "bg-blue-50 border-blue-200 text-blue-600",
  milestone: "bg-green-50 border-green-200 text-green-600",
  verification: "bg-purple-50 border-purple-200 text-purple-600",
  deployment: "bg-amber-50 border-amber-200 text-amber-600",
  follow: "bg-pink-50 border-pink-200 text-pink-600",
};

const ACTIVITY_LABELS = {
  micro_update: "Update",
  milestone: "Milestone",
  verification: "Verification",
  deployment: "Deployment",
  follow: "Follow",
};

function getProjectEcosystem(activity, projectMap) {
  if (activity.ecosystem) return activity.ecosystem;
  const project = projectMap[activity.projectSlug];
  return project?.ecosystem || null;
}

function getProjectName(activity, projectMap) {
  if (activity.projectName) return activity.projectName;
  const project = projectMap[activity.projectSlug];
  return project?.name || activity.projectSlug || "Unknown";
}

export default function BuilderActivityFeed({
  activities = [],
  projectMap = {},
  loading = false,
  maxItems = 20,
}) {
  const sorted = useMemo(() => {
    return [...activities]
      .sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")))
      .slice(0, maxItems);
  }, [activities, maxItems]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (sorted.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No recent activity</h3>
          <p className="text-sm text-gray-500">
            Ships Log updates from this builder&apos;s projects will appear here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <RocketLaunchIcon className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
        <span className="text-xs text-gray-500 ml-auto">
          {sorted.length} update{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100" />

        <div className="space-y-0">
          {sorted.map((activity, index) => {
            const type = activity.type || "micro_update";
            const IconComponent = ACTIVITY_ICONS[type] || ChatBubbleLeftRightIcon;
            const colorClasses = ACTIVITY_COLORS[type] || ACTIVITY_COLORS.micro_update;
            const label = ACTIVITY_LABELS[type] || "Update";
            const eco = getProjectEcosystem(activity, projectMap);
            const ecoConfig = eco ? getEcosystemConfig(eco) : null;
            const projectName = getProjectName(activity, projectMap);

            return (
              <div key={activity.id || index} className="relative pl-10 pb-6 last:pb-0">
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 top-0.5 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 ${colorClasses}`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>

                <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {ecoConfig && (
                        <span className="text-xs flex-shrink-0" title={ecoConfig.name}>
                          {ecoConfig.icon}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-gray-900 truncate">
                        {projectName}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 border ${colorClasses}`}
                      >
                        {label}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{activity.message}</p>
                  {activity.userHandle && (
                    <p className="text-[10px] text-gray-400 mt-1">by {activity.userHandle}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
