import React from 'react';
import { cva } from 'class-variance-authority';
import Button from './Button';

// Empty state variant styles
const emptyStateVariants = cva(
  'flex flex-col items-center justify-center text-center',
  {
    variants: {
      size: {
        sm: 'py-8 px-4',
        md: 'py-12 px-6',
        lg: 'py-16 px-8',
        xl: 'py-20 px-10'
      }
    },
    defaultVariants: {
      size: 'md'
    }
  }
);

// Base Empty State Component
export const EmptyState = ({ 
  size = 'md',
  icon,
  title,
  description,
  action,
  className = '',
  ...props 
}) => {
  return (
    <div className={emptyStateVariants({ size, className })} {...props}>
      {icon && (
        <div className="mb-6">
          {icon}
        </div>
      )}
      
      {title && (
        <h3 className="text-lg font-medium text-primary mb-2">{title}</h3>
      )}
      
      {description && (
        <p className="text-secondary max-w-sm mb-6">{description}</p>
      )}
      
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
};

// No Projects Empty State
export const NoProjectsEmptyState = ({ 
  size = 'md',
  onCreateProject,
  className = '',
  ...props 
}) => {
  const icon = (
    <svg
      className="h-24 w-24 text-text-tertiary mx-auto"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  );

  return (
    <EmptyState
      size={size}
      icon={icon}
      title="No Projects Found"
      description="You haven't created any projects yet. Start building your proof of ship portfolio by creating your first project."
      action={
        onCreateProject && (
          <Button onClick={onCreateProject} variant="primary">
            Create Your First Project
          </Button>
        )
      }
      className={className}
      {...props}
    />
  );
};

// No GitHub Data Empty State
export const NoGitHubDataEmptyState = ({ 
  size = 'md',
  onConnectGitHub,
  className = '',
  ...props 
}) => {
  const icon = (
    <svg
      className="h-24 w-24 text-text-tertiary mx-auto"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      <circle cx="12" cy="12" r="3" fill="white" opacity="0.8" />
      <path d="M12 10v4M10 12h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  return (
    <EmptyState
      size={size}
      icon={icon}
      title="No GitHub Activity"
      description="We couldn't find any GitHub activity for your account. Connect your GitHub profile to start tracking your development progress."
      action={
        onConnectGitHub && (
          <Button onClick={onConnectGitHub} variant="primary">
            Connect GitHub Account
          </Button>
        )
      }
      className={className}
      {...props}
    />
  );
};

// No Credit Score Data
export const NoCreditDataEmptyState = ({ 
  size = 'md',
  onStartAnalysis,
  className = '',
  ...props 
}) => {
  const icon = (
    <svg
      className="h-24 w-24 text-text-tertiary mx-auto"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
      <circle cx="12" cy="8" r="2" fill="currentColor" opacity="0.3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M12 14v2"
      />
    </svg>
  );

  return (
    <EmptyState
      size={size}
      icon={icon}
      title="Credit Analysis Not Available"
      description="We need more data to calculate your developer credit score. Connect your GitHub, social profiles, and wallet to get started."
      action={
        onStartAnalysis && (
          <Button onClick={onStartAnalysis} variant="primary">
            Start Credit Analysis
          </Button>
        )
      }
      className={className}
      {...props}
    />
  );
};

// No Wallet Connected
export const NoWalletEmptyState = ({ 
  size = 'md',
  onConnectWallet,
  className = '',
  ...props 
}) => {
  const icon = (
    <svg
      className="h-24 w-24 text-text-tertiary mx-auto"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
      <circle cx="15" cy="12" r="1" fill="currentColor" opacity="0.3" />
    </svg>
  );

  return (
    <EmptyState
      size={size}
      icon={icon}
      title="No Wallet Connected"
      description="Connect your MetaMask wallet to access funding features and manage your USDC transactions."
      action={
        onConnectWallet && (
          <Button onClick={onConnectWallet} variant="primary">
            Connect Wallet
          </Button>
        )
      }
      className={className}
      {...props}
    />
  );
};

// No Search Results
export const NoSearchResultsEmptyState = ({ 
  size = 'md',
  searchTerm,
  onClearSearch,
  className = '',
  ...props 
}) => {
  const icon = (
    <svg
      className="h-24 w-24 text-text-tertiary mx-auto"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
      <circle cx="11" cy="11" r="3" fill="none" stroke="currentColor" strokeWidth={1} opacity="0.3" />
      <path d="M11 9v4M9 11h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );

  return (
    <EmptyState
      size={size}
      icon={icon}
      title="No Results Found"
      description={
        searchTerm 
          ? `No results found for "${searchTerm}". Try adjusting your search terms or filters.`
          : "No results match your current filters. Try adjusting your search criteria."
      }
      action={
        onClearSearch && (
          <Button onClick={onClearSearch} variant="ghost">
            Clear Search
          </Button>
        )
      }
      className={className}
      {...props}
    />
  );
};

// No Notifications
export const NoNotificationsEmptyState = ({ 
  size = 'md',
  className = '',
  ...props 
}) => {
  const icon = (
    <svg
      className="h-24 w-24 text-text-tertiary mx-auto"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.2" />
    </svg>
  );

  return (
    <EmptyState
      size={size}
      icon={icon}
      title="No Notifications"
      description="You're all caught up! We'll notify you when there are updates to your projects or credit score."
      className={className}
      {...props}
    />
  );
};

// No Funding History
export const NoFundingHistoryEmptyState = ({ 
  size = 'md',
  onRequestFunding,
  className = '',
  ...props 
}) => {
  const icon = (
    <svg
      className="h-24 w-24 text-text-tertiary mx-auto"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth={1} opacity="0.3" />
    </svg>
  );

  return (
    <EmptyState
      size={size}
      icon={icon}
      title="No Funding History"
      description="You haven't received any funding yet. Build your credit score and request funding to support your development projects."
      action={
        onRequestFunding && (
          <Button onClick={onRequestFunding} variant="primary">
            Check Funding Eligibility
          </Button>
        )
      }
      className={className}
      {...props}
    />
  );
};

// Generic Empty State with Custom Content
export const CustomEmptyState = ({ 
  size = 'md',
  iconName,
  customIcon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
  ...props 
}) => {
  let icon = customIcon;
  
  if (!icon && iconName) {
    // Create icon based on name
    const iconMap = {
      folder: (
        <svg className="h-24 w-24 text-text-tertiary mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      document: (
        <svg className="h-24 w-24 text-text-tertiary mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      users: (
        <svg className="h-24 w-24 text-text-tertiary mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    };
    
    icon = iconMap[iconName];
  }

  return (
    <EmptyState
      size={size}
      icon={icon}
      title={title}
      description={description}
      action={
        (primaryAction || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {primaryAction}
            {secondaryAction}
          </div>
        )
      }
      className={className}
      {...props}
    />
  );
};

export default EmptyState;
