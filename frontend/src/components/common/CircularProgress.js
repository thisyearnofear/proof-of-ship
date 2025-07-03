import React, { useEffect, useState } from 'react';
import { cva } from 'class-variance-authority';

// Circular progress variant styles
const progressVariants = cva(
  'relative inline-flex items-center justify-center',
  {
    variants: {
      size: {
        sm: 'h-16 w-16',
        md: 'h-24 w-24',
        lg: 'h-32 w-32',
        xl: 'h-40 w-40',
        '2xl': 'h-48 w-48'
      }
    },
    defaultVariants: {
      size: 'lg'
    }
  }
);

// Get color based on score
const getScoreColor = (score) => {
  if (score >= 800) return { primary: '#22c55e', secondary: '#dcfce7' }; // Excellent - Green
  if (score >= 700) return { primary: '#3b82f6', secondary: '#dbeafe' }; // Good - Blue
  if (score >= 600) return { primary: '#f59e0b', secondary: '#fef3c7' }; // Fair - Amber
  if (score >= 500) return { primary: '#f97316', secondary: '#fed7aa' }; // Poor - Orange
  return { primary: '#ef4444', secondary: '#fee2e2' }; // Very Poor - Red
};

// Get credit tier info
const getCreditTier = (score) => {
  if (score >= 800) return { tier: 'Excellent', description: 'Outstanding credit' };
  if (score >= 700) return { tier: 'Good', description: 'Good credit standing' };
  if (score >= 600) return { tier: 'Fair', description: 'Average credit' };
  if (score >= 500) return { tier: 'Poor', description: 'Below average credit' };
  return { tier: 'Very Poor', description: 'Poor credit standing' };
};

export const CircularProgress = ({
  value = 0,
  maxValue = 100,
  size = 'lg',
  strokeWidth = 8,
  showValue = true,
  showLabel = false,
  label = '',
  animated = true,
  duration = 1500,
  className = '',
  children,
  ...props
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Animation effect
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValue(value);
    }
  }, [animated, value]);

  useEffect(() => {
    if (isVisible && animated) {
      const startTime = Date.now();
      const startValue = animatedValue;
      const endValue = value;
      const duration_ms = duration;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration_ms, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (endValue - startValue) * easeOut;
        
        setAnimatedValue(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isVisible, value, animatedValue, duration, animated]);

  const percentage = (animatedValue / maxValue) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeMap = {
    sm: { radius: 30, center: 32, fontSize: 'text-xs' },
    md: { radius: 40, center: 48, fontSize: 'text-sm' },
    lg: { radius: 45, center: 64, fontSize: 'text-lg' },
    xl: { radius: 55, center: 80, fontSize: 'text-xl' },
    '2xl': { radius: 70, center: 96, fontSize: 'text-2xl' }
  };

  const { radius, center, fontSize } = sizeMap[size];
  const adjustedCircumference = 2 * Math.PI * radius;
  const adjustedStrokeDasharray = adjustedCircumference;
  const adjustedStrokeDashoffset = adjustedCircumference - (percentage / 100) * adjustedCircumference;

  return (
    <div className={progressVariants({ size, className })} {...props}>
      <svg
        className="transform -rotate-90"
        width={center * 2}
        height={center * 2}
        viewBox={`0 0 ${center * 2} ${center * 2}`}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-background-secondary opacity-20"
        />
        
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={adjustedStrokeDasharray}
          strokeDashoffset={adjustedStrokeDashoffset}
          className="text-primary-500 transition-all duration-300 ease-out"
          style={{
            transition: animated ? `stroke-dashoffset ${duration}ms ease-out` : 'none'
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (
          <>
            {showValue && (
              <span className={`font-bold text-primary ${fontSize}`}>
                {Math.round(animatedValue)}
                {maxValue === 100 && '%'}
              </span>
            )}
            {showLabel && label && (
              <span className="text-xs text-secondary mt-1">{label}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Credit Score specific circular progress
export const CreditScoreCircular = ({
  score = 0,
  maxScore = 850,
  size = 'xl',
  animated = true,
  showTier = true,
  showImprovement = false,
  previousScore = null,
  className = '',
  ...props
}) => {
  const colors = getScoreColor(score);
  const tierInfo = getCreditTier(score);
  const improvement = previousScore ? score - previousScore : 0;

  return (
    <div className={`text-center ${className}`}>
      <div className="relative">
        <CircularProgress
          value={score}
          maxValue={maxScore}
          size={size}
          animated={animated}
          className="drop-shadow-sm"
          style={{
            '--tw-text-primary-500': colors.primary
          }}
          {...props}
        >
          <div className="text-center">
            <div 
              className="text-3xl font-bold mb-1"
              style={{ color: colors.primary }}
            >
              {Math.round(score)}
            </div>
            <div className="text-xs text-secondary">
              out of {maxScore}
            </div>
          </div>
        </CircularProgress>
        
        {/* Improvement indicator */}
        {showImprovement && improvement !== 0 && (
          <div className="absolute -top-2 -right-2">
            <div className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              ${improvement > 0 
                ? 'bg-success-100 text-success-700' 
                : 'bg-error-100 text-error-700'
              }
            `}>
              {improvement > 0 ? '+' : ''}{improvement}
            </div>
          </div>
        )}
      </div>
      
      {showTier && (
        <div className="mt-4">
          <div 
            className="text-lg font-semibold mb-1"
            style={{ color: colors.primary }}
          >
            {tierInfo.tier}
          </div>
          <div className="text-sm text-secondary">
            {tierInfo.description}
          </div>
        </div>
      )}
    </div>
  );
};

// Multi-segment circular progress (for breakdown)
export const MultiSegmentCircular = ({
  segments = [],
  size = 'lg',
  strokeWidth = 8,
  animated = true,
  showLabels = true,
  className = '',
  ...props
}) => {
  const [animatedValues, setAnimatedValues] = useState(segments.map(() => 0));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValues(segments.map(s => s.value));
    }
  }, [animated, segments]);

  useEffect(() => {
    if (isVisible && animated) {
      segments.forEach((segment, index) => {
        const startTime = Date.now();
        const duration = 1500 + (index * 200); // Stagger animations
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const currentValue = segment.value * easeOut;
          
          setAnimatedValues(prev => {
            const newValues = [...prev];
            newValues[index] = currentValue;
            return newValues;
          });
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        setTimeout(() => requestAnimationFrame(animate), index * 100);
      });
    }
  }, [isVisible, segments, animated]);

  const sizeMap = {
    sm: { radius: 30, center: 32 },
    md: { radius: 40, center: 48 },
    lg: { radius: 45, center: 64 },
    xl: { radius: 55, center: 80 },
    '2xl': { radius: 70, center: 96 }
  };

  const { radius, center } = sizeMap[size];
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercentage = 0;

  return (
    <div className={progressVariants({ size, className })} {...props}>
      <svg
        className="transform -rotate-90"
        width={center * 2}
        height={center * 2}
        viewBox={`0 0 ${center * 2} ${center * 2}`}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-background-secondary opacity-20"
        />
        
        {/* Segment circles */}
        {segments.map((segment, index) => {
          const percentage = (animatedValues[index] / 100) * 100;
          const segmentLength = (percentage / 100) * circumference;
          const segmentOffset = circumference - cumulativePercentage * circumference / 100 - segmentLength;
          
          cumulativePercentage += percentage;
          
          return (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={segmentOffset}
              className="transition-all duration-300 ease-out"
            />
          );
        })}
      </svg>
      
      {/* Legend */}
      {showLabels && (
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-48">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-secondary truncate">
                  {segment.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CircularProgress;
