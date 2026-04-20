import React from 'react';
import { cva } from 'class-variance-authority';

/**
 * TabBar - Shared tab navigation component (Phase 4C)
 * Consolidates the repeated active/inactive tab pattern used across pages.
 * Uses CVA for variants and semantic tokens for dark mode compatibility.
 */

// Tab container variants
const tabContainerVariants = cva(
  'flex w-fit',
  {
    variants: {
      variant: {
        // Pill style: rounded container with background
        pill: 'rounded-lg bg-surface-secondary border border-default p-1 gap-1',
        // Underline style: border-bottom indicator
        underline: 'border-b border-default',
        // Segmented style: full-width segmented control
        segmented: 'rounded-lg bg-surface-secondary border border-default p-0.5 gap-0.5',
      },
    },
    defaultVariants: {
      variant: 'pill',
    },
  }
);

// Tab button variants
const tabButtonVariants = cva(
  'transition-colors focus-ring font-medium flex items-center justify-center',
  {
    variants: {
      variant: {
        pill: 'px-3 py-1.5 rounded-md text-sm',
        underline: 'px-4 py-3 text-sm border-b-2 -mb-px',
        segmented: 'px-4 py-2 rounded-md text-sm flex-1',
      },
      active: {
        true: '', // active styles applied via JSX below
        false: '',
      },
      size: {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2',
      },
    },
    compoundVariants: [
      // Active states
      {
        variant: 'pill',
        active: true,
        className: 'bg-primary-500 text-white shadow-sm',
      },
      {
        variant: 'underline',
        active: true,
        className: 'border-primary-500 text-primary-600',
      },
      {
        variant: 'segmented',
        active: true,
        className: 'bg-surface shadow-sm text-primary',
      },
      // Inactive states
      {
        variant: 'pill',
        active: false,
        className: 'text-secondary hover:text-primary hover:bg-surface-hover',
      },
      {
        variant: 'underline',
        active: false,
        className: 'border-transparent text-secondary hover:text-primary hover:border-border-hover',
      },
      {
        variant: 'segmented',
        active: false,
        className: 'text-secondary hover:text-primary',
      },
    ],
    defaultVariants: {
      variant: 'pill',
      active: false,
      size: 'md',
    },
  }
);

/**
 * TabBar - Shared tab navigation component
 *
 * @param {Array} tabs - Array of tab objects: { id, label, icon?, disabled? }
 * @param {string} activeTab - Currently active tab id
 * @param {function} onChange - Callback when tab is clicked
 * @param {string} variant - 'pill' | 'underline' | 'segmented'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} className - Additional classes for the container
 * @param {boolean} fullWidth - Whether tabs should fill container width (for segmented)
 */
export default function TabBar({
  tabs = [],
  activeTab,
  onChange,
  variant = 'pill',
  size = 'md',
  className = '',
  fullWidth = false,
}) {
  if (!tabs || tabs.length === 0) return null;

  const handleClick = (tab) => {
    if (!tab.disabled) {
      onChange(tab.id);
    }
  };

  // Underline variant renders differently
  if (variant === 'underline') {
    return (
      <div className={`${tabContainerVariants({ variant, className })}`} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleClick(tab)}
            disabled={tab.disabled}
            className={tabButtonVariants({
              variant,
              active: activeTab === tab.id,
              size,
              className: tab.disabled ? 'opacity-50 cursor-not-allowed' : '',
            })}
            aria-selected={activeTab === tab.id}
            role="tab"
            aria-disabled={tab.disabled}
          >
            {tab.icon && <tab.icon className="w-4 h-4 mr-1.5" />}
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  // Pill and segmented variants
  return (
    <div
      className={`${tabContainerVariants({ variant, className })} ${fullWidth ? 'w-full' : ''}`}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleClick(tab)}
          disabled={tab.disabled}
          className={tabButtonVariants({
            variant,
            active: activeTab === tab.id,
            size,
            className: `${fullWidth && variant === 'segmented' ? 'flex-1' : ''} ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
          })}
          aria-selected={activeTab === tab.id}
          role="tab"
          aria-disabled={tab.disabled}
        >
          {tab.icon && <tab.icon className="w-4 h-4 mr-1.5" />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
