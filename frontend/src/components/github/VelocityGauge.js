import React from 'react';

/**
 * VelocityGauge Component
 * Visualizes GitHub streaks as "Engine Velocity" using an SVG gauge
 */
const VelocityGauge = ({ value, maxValue = 30, label = "Engine Velocity", size = 120 }) => {
  const radius = size * 0.4;
  const strokeWidth = size * 0.1;
  const normalizedValue = Math.min(value, maxValue);
  const percentage = (normalizedValue / maxValue) * 100;
  
  // SVG arc calculation
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color based on velocity
  const getColor = (val) => {
    if (val >= 20) return '#ef4444'; // High (Red Hot)
    if (val >= 10) return '#f59e0b'; // Medium (Optimal)
    return '#3b82f6'; // Low (Cruising)
  };

  const color = getColor(value);

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            style={{ 
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.5s ease'
            }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{value}</span>
          <span className="text-[10px] uppercase text-gray-500 font-medium">days</span>
        </div>
      </div>
      <div className="mt-2 text-sm font-semibold text-gray-700">{label}</div>
      <div className="text-[10px] text-gray-400 italic">GitHub Streak</div>
    </div>
  );
};

export default VelocityGauge;
