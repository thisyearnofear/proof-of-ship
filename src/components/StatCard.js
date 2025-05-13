import React from "react";
import { ArrowTrendingUpIcon } from "@heroicons/react/24/outline";

/**
 * Unified StatCard component for all dashboard/stat/metric cards
 * Props:
 * - title: string
 * - value: string|number|ReactNode
 * - icon: ReactNode
 * - link: string (optional)
 * - placeholder: boolean (optional)
 * - trend: string|number (optional)
 * - loading: boolean (optional)
 * - tooltip: string|ReactNode (optional)
 */
export default function StatCard({
  title,
  value,
  icon,
  link,
  placeholder = false,
  trend,
  loading = false,
  tooltip,
}) {
  const Wrapper = link
    ? ({ children }) => (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:bg-blue-50 rounded transition"
        >
          {children}
        </a>
      )
    : ({ children }) => <>{children}</>;

  return (
    <Wrapper>
      <div
        className={`bg-white rounded-lg shadow p-6 h-full flex flex-col justify-between group transition
        ${
          placeholder
            ? "opacity-70 italic text-gray-400 border border-dashed border-gray-300"
            : "hover:shadow-lg"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div
            className={`p-2 ${
              placeholder ? "bg-gray-100" : "bg-blue-50 group-hover:bg-blue-100"
            } rounded-lg transition`}
          >
            <div
              className={`w-6 h-6 ${
                placeholder ? "text-gray-300" : "text-blue-600"
              }`}
            >
              {icon}
            </div>
          </div>
          {trend && !placeholder && (
            <div className="flex items-center space-x-1 text-green-600">
              <ArrowTrendingUpIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{trend}</span>
            </div>
          )}
        </div>
        <div className="flex items-center mb-1">
          <h3
            className={`text-sm font-medium ${
              placeholder ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {title}
          </h3>
          {tooltip && (
            <span className="ml-1 cursor-pointer group relative">
              <span className="text-xs text-gray-400">&#9432;</span>
              <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-black text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition">
                {tooltip}
              </span>
            </span>
          )}
        </div>
        <div
          className={`text-lg font-semibold break-all min-h-[1.5em] ${
            placeholder ? "text-gray-400" : "text-gray-900"
          }`}
        >
          {loading ? (
            <span className="block animate-pulse h-6 bg-gray-200 rounded w-3/4" />
          ) : (
            value
          )}
        </div>
      </div>
    </Wrapper>
  );
}
