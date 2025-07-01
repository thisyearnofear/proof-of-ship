import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

const ThemeToggle = ({ variant = 'button', className = '' }) => {
  const { theme, setTheme, toggleTheme } = useTheme();

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="bg-surface border border-default rounded-md px-3 py-2 text-sm focus-ring transition-colors"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="high-contrast">High Contrast</option>
        </select>
      </div>
    );
  }

  if (variant === 'tabs') {
    const themes = [
      { value: 'light', label: 'Light', icon: SunIcon },
      { value: 'dark', label: 'Dark', icon: MoonIcon },
      { value: 'high-contrast', label: 'High Contrast', icon: ComputerDesktopIcon }
    ];

    return (
      <div className={`flex bg-surface-secondary rounded-lg p-1 ${className}`}>
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${theme === value 
                ? 'bg-surface shadow-sm text-primary' 
                : 'text-secondary hover:text-primary hover:bg-surface-hover'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Default button variant
  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center justify-center w-10 h-10 rounded-lg
        bg-surface-secondary hover:bg-surface-hover
        text-secondary hover:text-primary
        transition-colors focus-ring
        ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
