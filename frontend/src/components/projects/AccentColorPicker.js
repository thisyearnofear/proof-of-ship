/**
 * Accent Color Picker
 *
 * A constrained palette picker that lets builders personalize their project
 * page accent color while staying within the design system.
 * Uses the ACCENT_COLORS palette defined in projectNormalize.js.
 */

import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { ACCENT_COLORS, getAccentColor } from '@/lib/projects/projectNormalize';

export default function AccentColorPicker({ value, onChange }) {
  const current = getAccentColor(value);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Accent color
      </label>
      <p className="text-xs text-gray-500 mb-3">
        Pick a color to give your project page a distinct look — stays within the platform design system.
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {ACCENT_COLORS.map((color) => {
          const isSelected = (current?.value || null) === color.value;
          return (
            <button
              key={color.name}
              type="button"
              onClick={() => onChange(color.value)}
              className={`
                relative flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all
                ${isSelected
                  ? 'border-gray-900 ring-2 ring-gray-900/10'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              title={color.name}
            >
              <div
                className={`w-5 h-5 rounded-full flex-shrink-0 bg-gradient-to-br ${color.gradient || 'from-indigo-500 to-purple-600'}`}
              />
              <span className="text-xs font-medium text-gray-700 truncate">
                {color.name}
              </span>
              {isSelected && (
                <CheckCircleIcon className="w-3.5 h-3.5 text-gray-900 absolute top-1 right-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
