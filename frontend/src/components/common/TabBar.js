import React from 'react';

/**
 * TabBar - Shared tab navigation component
 * Consolidates the repeated active/inactive tab pattern used across pages.
 *
 * @param {Array} tabs - Array of tab objects: { id, label, icon? }
 * @param {string} activeTab - Currently active tab id
 * @param {function} onChange - Callback when tab is clicked
 * @param {string} variant - 'pill' (default, bg-primary-600) or 'underline' (border-b style)
 * @param {string} className - Additional classes for the container
 */
export default function TabBar({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  className = '',
}) {
  if (!tabs || tabs.length === 0) return null;

  if (variant === 'underline') {
    return (
      <div className={`flex border-b ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent'
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.icon && <tab.icon className="w-4 h-4 mr-1.5 inline" />}
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  // Pill variant (default)
  return (
    <div
      className={`flex rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 gap-1 w-fit ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors min-h-touch flex items-center justify-center ${
            activeTab === tab.id
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.icon && <tab.icon className="w-4 h-4 mr-1.5" />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
