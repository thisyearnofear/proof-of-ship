/**
 * Optimized loading state components with nautical-themed skeleton screens (Phase 4D)
 * Uses semantic tokens for dark mode and the custom skeleton animation from globals.css
 */

import React from 'react';

// Basic skeleton with theme-aware colors using semantic tokens + custom skeleton animation
const SkeletonBase = ({ className = '', ...props }) => (
  <div 
    className={`skeleton bg-surface-secondary rounded ${className}`}
    {...props} 
  />
);

// Card wrapper with nautical styling (uses nautical-card class from nautical.css)
const NauticalSkeletonCard = ({ children, className = '' }) => (
  <div className={`bg-surface border border-default rounded-card shadow-card nautical-card p-6 space-y-4 ${className}`}>
    {children}
  </div>
);

// Card skeleton for project cards
export const ProjectCardSkeleton = () => (
  <NauticalSkeletonCard>
    <div className="flex items-center space-x-3">
      <SkeletonBase className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <SkeletonBase className="h-4 w-3/4" />
        <SkeletonBase className="h-3 w-1/2" />
      </div>
    </div>
    
    <SkeletonBase className="h-3 w-full" />
    <SkeletonBase className="h-3 w-5/6" />
    
    <div className="flex space-x-2">
      <SkeletonBase className="h-6 w-16" />
      <SkeletonBase className="h-6 w-20" />
      <SkeletonBase className="h-6 w-14" />
    </div>
    
    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-default">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="text-center">
          <SkeletonBase className="h-6 w-8 mx-auto mb-1" />
          <SkeletonBase className="h-3 w-16 mx-auto" />
        </div>
      ))}
    </div>
  </NauticalSkeletonCard>
);

// Stat card skeleton
export const StatCardSkeleton = () => (
  <NauticalSkeletonCard>
    <div className="flex items-center justify-between mb-4">
      <SkeletonBase className="h-10 w-10 rounded-lg" />
      <SkeletonBase className="h-4 w-8" />
    </div>
    <SkeletonBase className="h-3 w-20 mb-2" />
    <SkeletonBase className="h-8 w-24" />
  </NauticalSkeletonCard>
);

// Chart skeleton
export const ChartSkeleton = ({ height = 'h-64' }) => (
  <NauticalSkeletonCard className={height}>
    <div className="flex justify-between items-center mb-6">
      <SkeletonBase className="h-5 w-32" />
      <SkeletonBase className="h-8 w-24" />
    </div>
    
    <div className="flex items-end justify-between h-40 space-x-2">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="flex-1">
          <SkeletonBase 
            className="w-full mb-2" 
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
          <SkeletonBase className="h-3 w-full" />
        </div>
      ))}
    </div>
  </NauticalSkeletonCard>
);

// Full page skeleton for dashboard
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="space-y-2">
        <SkeletonBase className="h-8 w-64" />
        <SkeletonBase className="h-4 w-96 max-w-full" />
      </div>
      <SkeletonBase className="h-10 w-32" />
    </div>
    
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
    
    {/* Main Content Area */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ChartSkeleton />
      </div>
      <div>
        <NauticalSkeletonCard className="h-full">
          <SkeletonBase className="h-6 w-32 mb-4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 py-3 border-b border-default last:border-0">
              <SkeletonBase className="h-8 w-8 rounded" />
              <div className="flex-1 space-y-1">
                <SkeletonBase className="h-3 w-3/4" />
                <SkeletonBase className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </NauticalSkeletonCard>
      </div>
    </div>
  </div>
);

// Credit Dashboard skeleton (Phase 4D)
export const CreditDashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header with score */}
    <NauticalSkeletonCard>
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <SkeletonBase className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <SkeletonBase className="h-8 w-48" />
          <SkeletonBase className="h-4 w-64" />
          <SkeletonBase className="h-4 w-32" />
        </div>
      </div>
    </NauticalSkeletonCard>

    {/* Stats Row */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>

    {/* Funding & Projects */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <NauticalSkeletonCard>
        <SkeletonBase className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <SkeletonBase className="h-4 w-24" />
              <SkeletonBase className="h-4 w-16" />
            </div>
          ))}
        </div>
      </NauticalSkeletonCard>
      <NauticalSkeletonCard>
        <SkeletonBase className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <SkeletonBase className="h-8 w-8 rounded" />
              <div className="flex-1 space-y-1">
                <SkeletonBase className="h-3 w-3/4" />
                <SkeletonBase className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </NauticalSkeletonCard>
    </div>
  </div>
);

// Explore Page skeleton (Phase 4D)
export const ExplorePageSkeleton = () => (
  <div className="space-y-6">
    {/* Search & Filters */}
    <div className="flex flex-col md:flex-row gap-4">
      <SkeletonBase className="h-12 flex-1" />
      <div className="flex gap-2">
        <SkeletonBase className="h-12 w-24" />
        <SkeletonBase className="h-12 w-24" />
        <SkeletonBase className="h-12 w-24" />
      </div>
    </div>

    {/* Tabs */}
    <div className="flex gap-2">
      {[...Array(4)].map((_, i) => (
        <SkeletonBase key={i} className="h-10 w-20 rounded-md" />
      ))}
    </div>

    {/* Project Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>

    {/* Pagination */}
    <div className="flex justify-center gap-2">
      {[...Array(5)].map((_, i) => (
        <SkeletonBase key={i} className="h-10 w-10 rounded-md" />
      ))}
    </div>
  </div>
);

// Loading spinner (themed)
export const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  };

  return (
    <div className={`animate-spin rounded-full border-surface-hover border-t-primary-600 ${sizeClasses[size]} ${className}`} />
  );
};

// Market Confidence skeleton (for BackingPanel)
export const MarketConfidenceSkeleton = () => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <div className="flex items-center text-sm text-secondary">
        <div className="w-4 h-4 bg-surface-secondary rounded animate-pulse mr-1"></div>
        <div className="h-4 w-28 bg-surface-secondary rounded animate-pulse"></div>
      </div>
      <div className="h-5 w-24 bg-surface-secondary rounded animate-pulse"></div>
    </div>
    <div className="w-full bg-surface-secondary rounded-full h-2">
      <div className="bg-surface-secondary h-2 rounded-full animate-pulse w-3/4"></div>
    </div>
    <div className="h-4 w-36 bg-surface-secondary rounded animate-pulse"></div>
  </div>
);

// Error state component
export const ErrorState = ({ 
  error, 
  onRetry, 
  title = "Something went wrong",
  description = "We encountered an error while loading the data." 
}) => (
  <div className="bg-surface border border-default rounded-card shadow-card p-8 text-center border-t-4 border-error-500">
    <div className="text-error-500 mb-4">
      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    
    <h3 className="text-lg font-medium text-primary mb-2">{title}</h3>
    <p className="text-secondary mb-6">{description}</p>
    
    {error && process.env.NODE_ENV === 'development' && (
      <details className="text-left mb-6">
        <summary className="cursor-pointer text-sm text-secondary hover:text-primary">
          Error Details (Development)
        </summary>
        <pre className="mt-2 text-xs text-error-600 bg-error-50 p-3 rounded overflow-auto">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      </details>
    )}
    
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-button text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

// ── SkeletonLoader equivalents (consolidated from SkeletonLoader.js) ──

// Generic block skeleton — same as SkeletonBase but named for backward compat
export const SkeletonBlock = ({ className = '' }) => (
  <SkeletonBase className={className} />
);

// Text skeleton with variable line count
export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBase
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
      />
    ))}
  </div>
);

// Generic card skeleton
export const SkeletonCard = ({ className = '' }) => (
  <NauticalSkeletonCard className={className}>
    <div className="flex items-center gap-3 mb-4">
      <SkeletonBase className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-1/3" />
        <SkeletonBase className="h-3 w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonBase className="h-3 w-full" />
      <SkeletonBase className="h-3 w-full" />
      <SkeletonBase className="h-3 w-2/3" />
    </div>
    <div className="flex gap-2 mt-4">
      <SkeletonBase className="h-6 w-16 rounded-full" />
      <SkeletonBase className="h-6 w-20 rounded-full" />
    </div>
  </NauticalSkeletonCard>
);

// Project grid skeleton
export const SkeletonProjectGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

// Dashboard stat cards skeleton
export const SkeletonDashboardStats = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <NauticalSkeletonCard key={i}>
        <div className="flex items-center space-x-3">
          <SkeletonBase className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <SkeletonBase className="h-6 w-16" />
            <SkeletonBase className="h-3 w-20" />
          </div>
        </div>
      </NauticalSkeletonCard>
    ))}
  </div>
);

// Table skeleton with configurable rows/cols
export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="bg-surface border border-default rounded-card overflow-hidden">
    <div className="grid gap-0">
      <div
        className="grid gap-4 p-4 bg-surface-secondary border-b border-default"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBase key={i} className="h-4 w-3/4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-4 p-4 border-b border-default last:border-0"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBase key={c} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Full detail page skeleton (breadcrumbs + header + cards + text)
export const SkeletonDetailPage = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <SkeletonBase className="h-4 w-16" />
      <SkeletonBase className="h-4 w-4" />
      <SkeletonBase className="h-4 w-24" />
      <SkeletonBase className="h-4 w-4" />
      <SkeletonBase className="h-4 w-32" />
    </div>
    <div className="flex items-center gap-4">
      <SkeletonBase className="h-16 w-16 rounded-xl" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-8 w-1/3" />
        <SkeletonBase className="h-4 w-2/3" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <div className="space-y-2">
      <SkeletonBase className="h-3 w-full" />
      <SkeletonBase className="h-3 w-full" />
      <SkeletonBase className="h-3 w-2/3" />
      <SkeletonBase className="h-3 w-full" />
      <SkeletonBase className="h-3 w-1/2" />
    </div>
  </div>
);
