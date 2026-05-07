import React from 'react';
import { FireIcon } from '@heroicons/react/24/outline';

/**
 * Lightweight velocity badge for project cards.
 * Shows shipping velocity score with color-coded intensity.
 *
 * @param {object} props
 * @param {number} props.velocity - Shipping velocity score
 * @param {string} [props.size] - "sm" | "md" — controls sizing
 * @param {string} [props.className] - Additional CSS classes
 */
export default function VelocityBadge({ velocity, size = "sm", className = "" }) {
  if (!velocity || velocity <= 0) return null;

  const color =
    velocity >= 50
      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800"
      : velocity >= 20
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800"
        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";

  const sizing = size === "md"
    ? "text-sm px-2.5 py-1 gap-1.5"
    : "text-xs px-2 py-0.5 gap-1";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${color} ${sizing} ${className}`}
      title={`Shipping velocity: ${velocity}`}
    >
      <FireIcon className={size === "md" ? "w-4 h-4" : "w-3 h-3"} />
      {velocity}
    </span>
  );
}
