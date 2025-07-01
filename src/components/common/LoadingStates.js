/**
 * Optimized loading state components with skeleton screens
 */

import React from 'react';

// Basic skeleton animation
const SkeletonBase = ({ className, ...props }) => (
  <div 
    className={`animate-pulse bg-gray-200 rounded ${className}`} 
    {...props} 
  />
);

// Card skeleton for project cards
export const ProjectCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 space-y-4">
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
    
    <div className="grid grid-cols-3 gap-4 pt-4">
      <div className="text-center">
        <SkeletonBase className="h-6 w-8 mx-auto mb-1" />
        <SkeletonBase className="h-3 w-16 mx-auto" />
      </div>
      <div className="text-center">
        <SkeletonBase className="h-6 w-8 mx-auto mb-1" />
        <SkeletonBase className="h-3 w-16 mx-auto" />
      </div>
      <div className="text-center">
        <SkeletonBase className="h-6 w-8 mx-auto mb-1" />
        <SkeletonBase className="h-3 w-16 mx-auto" />
      </div>
    </div>
  </div>
);

// List item skeleton for issues/PRs
export const ListItemSkeleton = () => (
  <div className="border-b border-gray-200 p-4 space-y-3">
    <div className="flex items-start space-x-3">
      <SkeletonBase className="h-5 w-5 rounded mt-0.5" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-3/4" />
        <SkeletonBase className="h-3 w-full" />
        <SkeletonBase className="h-3 w-2/3" />
      </div>
    </div>
    
    <div className="flex items-center space-x-4 ml-8">
      <div className="flex items-center space-x-2">
        <SkeletonBase className="h-4 w-4 rounded-full" />
        <SkeletonBase className="h-3 w-16" />
      </div>
      <SkeletonBase className="h-3 w-20" />
      <div className="flex space-x-1">
        <SkeletonBase className="h-5 w-12" />
        <SkeletonBase className="h-5 w-16" />
      </div>
    </div>
  </div>
);

// Stat card skeleton
export const StatCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <SkeletonBase className="h-10 w-10 rounded-lg" />
      <SkeletonBase className="h-4 w-8" />
    </div>
    <SkeletonBase className="h-3 w-20 mb-2" />
    <SkeletonBase className="h-6 w-16" />
  </div>
);

// Chart skeleton
export const ChartSkeleton = ({ height = 'h-64' }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${height}`}>
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
  </div>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    {/* Header */}
    <div className="bg-gray-50 px-6 py-3">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(columns)].map((_, i) => (
          <SkeletonBase key={i} className="h-4 w-20" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div key={rowIndex} className="px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(columns)].map((_, colIndex) => (
            <SkeletonBase 
              key={colIndex} 
              className={`h-4 ${colIndex === 0 ? 'w-24' : 'w-16'}`} 
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Navigation skeleton
export const NavigationSkeleton = () => (
  <nav className="bg-white shadow">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center space-x-8">
          <SkeletonBase className="h-8 w-32" />
          <div className="hidden md:flex space-x-6">
            <SkeletonBase className="h-4 w-16" />
            <SkeletonBase className="h-4 w-20" />
            <SkeletonBase className="h-4 w-18" />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <SkeletonBase className="h-8 w-8 rounded-full" />
          <SkeletonBase className="h-8 w-20" />
        </div>
      </div>
    </div>
  </nav>
);

// Full page skeleton for dashboard
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <SkeletonBase className="h-8 w-64" />
        <SkeletonBase className="h-4 w-96" />
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
    
    {/* Chart */}
    <ChartSkeleton />
    
    {/* Project Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
    </div>
  </div>
);

// Error state component
export const ErrorState = ({ 
  error, 
  onRetry, 
  title = "Something went wrong",
  description = "We encountered an error while loading the data." 
}) => (
  <div className="bg-white rounded-lg shadow p-8 text-center">
    <div className="text-red-500 mb-4">
      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6">{description}</p>
    
    {error && process.env.NODE_ENV === 'development' && (
      <details className="text-left mb-6">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
          Error Details (Development)
        </summary>
        <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      </details>
    )}
    
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Try Again
      </button>
    )}
  </div>
);

// Empty state component
export const EmptyState = ({ 
  title = "No data available",
  description = "There's no data to display at the moment.",
  action = null,
  icon = null
}) => (
  <div className="bg-white rounded-lg shadow p-8 text-center">
    {icon ? icon : (
      <div className="text-gray-400 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-2-2m0 0l-2 2m2-2v12" />
        </svg>
      </div>
    )}
    
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6">{description}</p>
    
    {action}
  </div>
);

// Loading spinner
export const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
};

// Inline loading state
export const InlineLoading = ({ text = "Loading..." }) => (
  <div className="flex items-center justify-center space-x-2 text-gray-500">
    <LoadingSpinner size="small" />
    <span className="text-sm">{text}</span>
  </div>
);
