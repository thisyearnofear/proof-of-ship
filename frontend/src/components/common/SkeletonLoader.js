/**
 * Skeleton Loading Components
 * Replaces spinners with animated placeholder bars for a polished loading experience.
 * Uses shimmer animation for more realistic loading feedback.
 */
import React from "react";

export function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded relative overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(90deg, transparent 25%, var(--color-background-tertiary) 50%, transparent 75%)',
        backgroundSize: '200px 100%',
        animation: 'shimmer 1.5s infinite'
      }}
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <SkeletonBlock className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <SkeletonBlock className="h-4 w-1/3 mb-2" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-2 mt-4">
        <SkeletonBlock className="h-6 w-16 rounded-full" />
        <SkeletonBlock className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonProjectGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonDashboardStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <SkeletonBlock className="w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <SkeletonBlock className="h-6 w-16 mb-2" />
              <SkeletonBlock className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="grid gap-0">
        <div
          className="grid gap-4 p-4 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonBlock key={i} className="h-4 w-3/4" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-4 p-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonBlock key={c} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDetailPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <SkeletonBlock className="h-4 w-16" />
        <SkeletonBlock className="h-4 w-4" />
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-4 w-4" />
        <SkeletonBlock className="h-4 w-32" />
      </div>
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-16 w-16 rounded-xl" />
        <div className="flex-1">
          <SkeletonBlock className="h-8 w-1/3 mb-2" />
          <SkeletonBlock className="h-4 w-2/3" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonText lines={5} />
    </div>
  );
}