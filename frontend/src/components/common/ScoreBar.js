import React from 'react';

/**
 * ScoreBar - Visual representation of credit score
 * @param {number} score - Current credit score
 * @param {number} min - Minimum possible score (default 400)
 * @param {number} max - Maximum possible score (default 850)
 */
export default function ScoreBar({ score, min = 400, max = 850 }) {
  const pct = Math.max(0, Math.min(100, ((score - min) / (max - min)) * 100));
  
  // Use semantic theme colors
  const colorClass = 
    score >= 700 ? "bg-success-500" : 
    score >= 550 ? "bg-warning-500" : 
    "bg-error-500";
    
  return (
    <div className="w-full bg-surface-secondary dark:bg-gray-700 rounded-full h-3 overflow-hidden">
      <div 
        className={`${colorClass} h-3 rounded-full transition-all duration-1000 ease-out shadow-sm`} 
        style={{ width: `${pct}%` }} 
      />
    </div>
  );
}
