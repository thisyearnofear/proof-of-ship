import React from 'react';
import { cva } from 'class-variance-authority';

// Card variant styles using our design tokens
const cardVariants = cva(
  // Base styles
  'card-base bg-surface border border-default transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'shadow-card hover:shadow-card-hover',
        elevated: 'shadow-lg hover:shadow-xl',
        outlined: 'border-2 shadow-none hover:shadow-sm',
        ghost: 'shadow-none border-transparent hover:border-default hover:shadow-sm'
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10'
      },
      interactive: {
        true: 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false
    }
  }
);

// Main Card Component
export const Card = React.forwardRef(({
  className = '',
  variant = 'default',
  size = 'md',
  interactive = false,
  onClick,
  children,
  ...props
}, ref) => {
  const isInteractive = interactive || !!onClick;

  return (
    <div
      ref={ref}
      className={cardVariants({ variant, size, interactive: isInteractive, className })}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e);
        }
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Card Header Component
export const CardHeader = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`flex items-center justify-between pb-4 border-b border-default mb-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Title Component
export const CardTitle = ({ className = '', children, ...props }) => {
  return (
    <h3
      className={`text-lg font-semibold text-primary leading-6 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

// Card Description Component
export const CardDescription = ({ className = '', children, ...props }) => {
  return (
    <p
      className={`text-sm text-secondary mt-1 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

// Card Content Component
export const CardContent = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Footer Component
export const CardFooter = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`flex items-center justify-between pt-4 border-t border-default mt-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Stat Card Component (for metrics and KPIs)
export const StatCard = ({
  className = '',
  title,
  value,
  change,
  changeType = 'neutral', // 'positive', 'negative', 'neutral'
  icon,
  description,
  trend,
  loading = false,
  ...props
}) => {
  const changeColors = {
    positive: 'text-success-600 bg-success-50',
    negative: 'text-error-600 bg-error-50',
    neutral: 'text-text-secondary bg-background-secondary'
  };

  if (loading) {
    return (
      <Card className={className} {...props}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-background-secondary rounded w-20"></div>
            <div className="h-8 w-8 bg-background-secondary rounded"></div>
          </div>
          <div className="mt-2 h-8 bg-background-secondary rounded w-16"></div>
          <div className="mt-2 h-3 bg-background-secondary rounded w-24"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-secondary">{title}</p>
          <div className="flex items-baseline mt-2">
            <p className="text-2xl font-semibold text-primary">{value}</p>
            {change && (
              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${changeColors[changeType]}`}>
                {changeType === 'positive' && '+'}
                {change}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-tertiary mt-1">{description}</p>
          )}
          {trend && (
            <p className="text-xs text-secondary mt-2">{trend}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="h-8 w-8 text-text-tertiary">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Feature Card Component (for showcasing features or benefits)
export const FeatureCard = ({
  className = '',
  icon,
  title,
  description,
  action,
  variant = 'default',
  ...props
}) => {
  return (
    <Card className={className} variant={variant} {...props}>
      <div className="text-center">
        {icon && (
          <div className="mx-auto h-12 w-12 text-primary-500 mb-4">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-medium text-primary mb-2">{title}</h3>
        {description && (
          <p className="text-secondary mb-4">{description}</p>
        )}
        {action && (
          <div className="mt-4">
            {action}
          </div>
        )}
      </div>
    </Card>
  );
};

// Project Card Component (specific to POS Dashboard)
export const ProjectCard = ({
  className = '',
  project,
  onEdit,
  onView,
  loading = false,
  ...props
}) => {
  if (loading) {
    return (
      <Card className={className} {...props}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-background-secondary rounded w-32"></div>
            <div className="h-4 w-4 bg-background-secondary rounded"></div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-background-secondary rounded w-full"></div>
            <div className="h-4 bg-background-secondary rounded w-3/4"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-8 bg-background-secondary rounded w-20"></div>
            <div className="h-8 bg-background-secondary rounded w-16"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className} interactive={!!onView} onClick={onView} {...props}>
      <CardHeader>
        <div>
          <CardTitle>{project?.name || 'Untitled Project'}</CardTitle>
          <CardDescription>{project?.description}</CardDescription>
        </div>
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(project);
            }}
            className="text-text-tertiary hover:text-primary transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-secondary">Commits</p>
            <p className="text-lg font-semibold text-primary">{project?.stats?.commits || 0}</p>
          </div>
          <div>
            <p className="text-xs text-secondary">Issues</p>
            <p className="text-lg font-semibold text-primary">{project?.stats?.issues || 0}</p>
          </div>
          <div>
            <p className="text-xs text-secondary">PRs</p>
            <p className="text-lg font-semibold text-primary">{project?.stats?.prs || 0}</p>
          </div>
          <div>
            <p className="text-xs text-secondary">Stars</p>
            <p className="text-lg font-semibold text-primary">{project?.stats?.stars || 0}</p>
          </div>
        </div>
      </CardContent>
      
      {project?.season && (
        <CardFooter>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            Season {project.season}
          </span>
          {project?.lastUpdated && (
            <span className="text-xs text-tertiary">
              Updated {new Date(project.lastUpdated).toLocaleDateString()}
            </span>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default Card;
