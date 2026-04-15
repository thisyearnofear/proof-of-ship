/**
 * ProjectHealthChart Component
 * Visualizes Confidence vs Health metrics
 */

import React from 'react';

export default function ProjectHealthChart({ confidence, health, size = 'md' }) {
  const isLarge = size === 'lg';
  
  return (
    <div className="space-y-4">
      {/* Health Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase">Project Health</span>
          <span className={`text-sm font-bold ${
            health > 80 ? 'text-green-600' : health > 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {Math.round(health)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              health > 80 ? 'bg-green-500' : health > 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${health}%` }}
          />
        </div>
      </div>

      {/* Confidence Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase">Backer Confidence</span>
          <span className="text-sm font-bold text-blue-600">
            {Math.round(confidence)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      {isLarge && (
        <div className="pt-2 border-t border-gray-100 flex justify-between">
          <div className="text-center px-2">
            <div className="text-xs text-gray-500">Risk Profile</div>
            <div className="text-sm font-medium text-gray-900">
              {health > 70 && confidence > 70 ? 'Stable' : health < 40 ? 'High Risk' : 'Emerging'}
            </div>
          </div>
          <div className="text-center px-2 border-l border-gray-100">
            <div className="text-xs text-gray-500">Sentiment</div>
            <div className="text-sm font-medium text-gray-900">
              {confidence > 80 ? 'Bullish' : confidence > 40 ? 'Neutral' : 'Wary'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
