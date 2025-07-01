import React from 'react';
import { cva } from 'class-variance-authority';

// Button variant styles using our design tokens
const buttonVariants = cva(
  // Base styles
  'btn-base inline-flex items-center justify-center font-medium transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm',
        secondary: 'bg-surface border border-default hover:bg-surface-hover text-primary',
        ghost: 'hover:bg-surface-hover text-secondary hover:text-primary',
        danger: 'bg-error-500 hover:bg-error-600 text-white shadow-sm',
        success: 'bg-success-500 hover:bg-success-600 text-white shadow-sm',
        warning: 'bg-warning-500 hover:bg-warning-600 text-white shadow-sm',
        outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white',
        link: 'text-primary-500 hover:text-primary-600 underline-offset-4 hover:underline p-0 h-auto'
      },
      size: {
        sm: 'h-button-sm px-3 text-sm rounded-md',
        md: 'h-button-md px-4 text-sm rounded-md',
        lg: 'h-button-lg px-6 text-base rounded-lg',
        xl: 'h-button-xl px-8 text-lg rounded-lg'
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false
    }
  }
);

const Button = React.forwardRef(({
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      className={buttonVariants({ variant, size, fullWidth, className })}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {!loading && leftIcon && (
        <span className="mr-2 -ml-1">
          {leftIcon}
        </span>
      )}
      
      {children}
      
      {!loading && rightIcon && (
        <span className="ml-2 -mr-1">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

// Button group component for related actions
export const ButtonGroup = ({ children, className = '', orientation = 'horizontal' }) => {
  return (
    <div
      className={`
        inline-flex
        ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}
        ${orientation === 'horizontal' ? '[&>*:not(:first-child)]:ml-px [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none' : '[&>*:not(:first-child)]:mt-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Icon button component
export const IconButton = React.forwardRef(({
  className = '',
  size = 'md',
  variant = 'ghost',
  icon,
  'aria-label': ariaLabel,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-14 w-14'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-7 w-7'
  };

  return (
    <button
      ref={ref}
      className={buttonVariants({ 
        variant, 
        className: `${sizeClasses[size]} p-0 ${className}` 
      })}
      aria-label={ariaLabel}
      {...props}
    >
      {React.cloneElement(icon, { 
        className: `${iconSizes[size]} ${icon.props.className || ''}` 
      })}
    </button>
  );
});

IconButton.displayName = 'IconButton';

export default Button;
