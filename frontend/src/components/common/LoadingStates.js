/**
 * Optimized loading state components with nautical-themed skeleton screens (Phase 4D)
 */

import React from 'react';

// Basic skeleton animation with theme-aware colors
const SkeletonBase = ({ className, ...props }) => (
  <div 
    className={`animate-pulse bg-surface-secondary dark:bg-gray-700 rounded ${className}`} 
    {...props} 
  />
);

// Card wrapper with nautical styling
const NauticalSkeletonCard = ({ children, className = "" }) => (
  <div className={`bg-surface dark:bg-gray-800 rounded-card shadow-card nautical-card p-6 space-y-4 ${className}`}>
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
    
    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-default dark:border-gray-700">
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
            <div key={i} className="flex items-center space-x-3 py-3 border-b border-default dark:border-gray-700 last:border-0">
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

// Error state component
export const ErrorState = ({ 
  error, 
  onRetry, 
  title = "Something went wrong",
  description = "We encountered an error while loading the data." 
}) => (
  <div className="bg-surface dark:bg-gray-800 rounded-card shadow-card p-8 text-center border-t-4 border-error-500">
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
        <pre className="mt-2 text-xs text-error-600 bg-error-50 dark:bg-red-900/20 p-3 rounded overflow-auto">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      </details>
    )}
    
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-button text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);
