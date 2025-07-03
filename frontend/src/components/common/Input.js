import React from 'react';
import { cva } from 'class-variance-authority';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Input variant styles using our design tokens
const inputVariants = cva(
  // Base styles
  'block w-full border rounded-input bg-surface text-primary placeholder-text-tertiary transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        sm: 'h-input-sm px-3 text-sm',
        md: 'h-input-md px-3 text-sm',
        lg: 'h-input-lg px-4 text-base'
      },
      state: {
        default: 'border-default focus:border-primary-500',
        error: 'border-error-500 focus:border-error-500 text-error-600',
        success: 'border-success-500 focus:border-success-500 text-success-600',
        disabled: 'border-border-secondary bg-background-secondary cursor-not-allowed'
      }
    },
    defaultVariants: {
      size: 'md',
      state: 'default'
    }
  }
);

const labelVariants = cva(
  'block text-sm font-medium mb-2',
  {
    variants: {
      state: {
        default: 'text-primary',
        error: 'text-error-600',
        success: 'text-success-600',
        disabled: 'text-text-tertiary'
      },
      required: {
        true: "after:content-['*'] after:ml-0.5 after:text-error-500",
        false: ''
      }
    },
    defaultVariants: {
      state: 'default',
      required: false
    }
  }
);

const helperTextVariants = cva(
  'mt-2 text-sm',
  {
    variants: {
      state: {
        default: 'text-text-secondary',
        error: 'text-error-600',
        success: 'text-success-600',
        disabled: 'text-text-tertiary'
      }
    },
    defaultVariants: {
      state: 'default'
    }
  }
);

// Base Input Component
export const Input = React.forwardRef(({
  className = '',
  size = 'md',
  state = 'default',
  label,
  helperText,
  error,
  success,
  required = false,
  disabled = false,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const inputState = error ? 'error' : success ? 'success' : disabled ? 'disabled' : state;
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className={labelVariants({ state: inputState, required })}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {React.cloneElement(leftIcon, { 
              className: `h-5 w-5 text-text-tertiary ${leftIcon.props.className || ''}` 
            })}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputVariants({ 
            size, 
            state: inputState,
            className: `
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon || error || success ? 'pr-10' : ''}
            `
          })}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            helperText || error || success 
              ? `${inputId}-description` 
              : undefined
          }
          {...props}
        />
        
        {(rightIcon || error || success) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {error && <ExclamationCircleIcon className="h-5 w-5 text-error-500" />}
            {success && !error && <CheckCircleIcon className="h-5 w-5 text-success-500" />}
            {rightIcon && !error && !success && React.cloneElement(rightIcon, { 
              className: `h-5 w-5 text-text-tertiary ${rightIcon.props.className || ''}` 
            })}
          </div>
        )}
      </div>
      
      {(helperText || error || success) && (
        <p
          id={`${inputId}-description`}
          className={helperTextVariants({ state: inputState })}
        >
          {error || success || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea Component
export const Textarea = React.forwardRef(({
  className = '',
  size = 'md',
  state = 'default',
  label,
  helperText,
  error,
  success,
  required = false,
  disabled = false,
  rows = 4,
  ...props
}, ref) => {
  const inputState = error ? 'error' : success ? 'success' : disabled ? 'disabled' : state;
  const textareaId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const textareaClasses = cva(
    'block w-full border rounded-input bg-surface text-primary placeholder-text-tertiary transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed resize-vertical',
    {
      variants: {
        size: {
          sm: 'p-3 text-sm',
          md: 'p-3 text-sm',
          lg: 'p-4 text-base'
        },
        state: {
          default: 'border-default focus:border-primary-500',
          error: 'border-error-500 focus:border-error-500',
          success: 'border-success-500 focus:border-success-500',
          disabled: 'border-border-secondary bg-background-secondary cursor-not-allowed'
        }
      },
      defaultVariants: {
        size: 'md',
        state: 'default'
      }
    }
  );

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={textareaId}
          className={labelVariants({ state: inputState, required })}
        >
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={textareaClasses({ size, state: inputState })}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          helperText || error || success 
            ? `${textareaId}-description` 
            : undefined
        }
        {...props}
      />
      
      {(helperText || error || success) && (
        <p
          id={`${textareaId}-description`}
          className={helperTextVariants({ state: inputState })}
        >
          {error || success || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Select Component
export const Select = React.forwardRef(({
  className = '',
  size = 'md',
  state = 'default',
  label,
  helperText,
  error,
  success,
  required = false,
  disabled = false,
  placeholder,
  children,
  ...props
}, ref) => {
  const inputState = error ? 'error' : success ? 'success' : disabled ? 'disabled' : state;
  const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={selectId}
          className={labelVariants({ state: inputState, required })}
        >
          {label}
        </label>
      )}
      
      <select
        ref={ref}
        id={selectId}
        className={inputVariants({ size, state: inputState })}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          helperText || error || success 
            ? `${selectId}-description` 
            : undefined
        }
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      
      {(helperText || error || success) && (
        <p
          id={`${selectId}-description`}
          className={helperTextVariants({ state: inputState })}
        >
          {error || success || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// Checkbox Component
export const Checkbox = React.forwardRef(({
  className = '',
  label,
  helperText,
  error,
  disabled = false,
  ...props
}, ref) => {
  const checkboxId = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className="h-4 w-4 text-primary-500 border-default rounded focus-ring disabled:opacity-50"
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              helperText || error 
                ? `${checkboxId}-description` 
                : undefined
            }
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label
              htmlFor={checkboxId}
              className={`font-medium ${disabled ? 'text-text-tertiary' : 'text-primary'}`}
            >
              {label}
            </label>
          </div>
        )}
      </div>
      
      {(helperText || error) && (
        <p
          id={`${checkboxId}-description`}
          className={`mt-2 text-sm ${error ? 'text-error-600' : 'text-text-secondary'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// Radio Component
export const Radio = React.forwardRef(({
  className = '',
  label,
  helperText,
  error,
  disabled = false,
  ...props
}, ref) => {
  const radioId = props.id || `radio-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={radioId}
            type="radio"
            className="h-4 w-4 text-primary-500 border-default focus-ring disabled:opacity-50"
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              helperText || error 
                ? `${radioId}-description` 
                : undefined
            }
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label
              htmlFor={radioId}
              className={`font-medium ${disabled ? 'text-text-tertiary' : 'text-primary'}`}
            >
              {label}
            </label>
          </div>
        )}
      </div>
      
      {(helperText || error) && (
        <p
          id={`${radioId}-description`}
          className={`mt-2 text-sm ${error ? 'text-error-600' : 'text-text-secondary'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Radio.displayName = 'Radio';

export default Input;
