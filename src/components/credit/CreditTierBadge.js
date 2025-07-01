import React, { useState, useEffect } from 'react';
import { cva } from 'class-variance-authority';
import { 
  TrophyIcon,
  StarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

// Credit tier configuration
const creditTiers = {
  excellent: {
    name: 'Excellent',
    range: '800-850',
    minScore: 800,
    color: '#22c55e',
    bgColor: '#dcfce7',
    borderColor: '#16a34a',
    icon: TrophyIcon,
    description: 'Outstanding credit profile',
    benefits: [
      'Maximum funding eligibility ($5,000)',
      'Lowest interest rates',
      'Priority support',
      'Exclusive opportunities'
    ],
    gradient: 'from-green-400 to-green-600'
  },
  good: {
    name: 'Good',
    range: '700-799',
    minScore: 700,
    color: '#3b82f6',
    bgColor: '#dbeafe',
    borderColor: '#2563eb',
    icon: StarIcon,
    description: 'Good credit standing',
    benefits: [
      'High funding eligibility ($3,500)',
      'Competitive rates',
      'Standard support',
      'Most opportunities available'
    ],
    gradient: 'from-blue-400 to-blue-600'
  },
  fair: {
    name: 'Fair',
    range: '600-699',
    minScore: 600,
    color: '#f59e0b',
    bgColor: '#fef3c7',
    borderColor: '#d97706',
    icon: ShieldCheckIcon,
    description: 'Average credit profile',
    benefits: [
      'Moderate funding eligibility ($2,000)',
      'Standard rates',
      'Basic support',
      'Limited opportunities'
    ],
    gradient: 'from-amber-400 to-amber-600'
  },
  poor: {
    name: 'Poor',
    range: '500-599',
    minScore: 500,
    color: '#f97316',
    bgColor: '#fed7aa',
    borderColor: '#ea580c',
    icon: ExclamationTriangleIcon,
    description: 'Below average credit',
    benefits: [
      'Limited funding eligibility ($1,000)',
      'Higher rates',
      'Basic support',
      'Few opportunities'
    ],
    gradient: 'from-orange-400 to-orange-600'
  },
  veryPoor: {
    name: 'Very Poor',
    range: '400-499',
    minScore: 400,
    color: '#ef4444',
    bgColor: '#fee2e2',
    borderColor: '#dc2626',
    icon: XCircleIcon,
    description: 'Poor credit standing',
    benefits: [
      'Minimum funding eligibility ($500)',
      'Highest rates',
      'Limited support',
      'Very few opportunities'
    ],
    gradient: 'from-red-400 to-red-600'
  }
};

// Get tier based on score
const getTierFromScore = (score) => {
  if (score >= 800) return creditTiers.excellent;
  if (score >= 700) return creditTiers.good;
  if (score >= 600) return creditTiers.fair;
  if (score >= 500) return creditTiers.poor;
  return creditTiers.veryPoor;
};

// Badge variant styles
const badgeVariants = cva(
  'inline-flex items-center font-medium transition-all duration-300',
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-xs rounded-md',
        md: 'px-3 py-1.5 text-sm rounded-lg',
        lg: 'px-4 py-2 text-base rounded-lg',
        xl: 'px-6 py-3 text-lg rounded-xl'
      },
      variant: {
        solid: 'text-white shadow-sm',
        outline: 'border-2 bg-transparent',
        soft: 'border',
        gradient: 'text-white shadow-lg'
      },
      animated: {
        true: 'hover:scale-105 hover:shadow-md',
        false: ''
      }
    },
    defaultVariants: {
      size: 'md',
      variant: 'solid',
      animated: true
    }
  }
);

// Simple tier badge
export const CreditTierBadge = ({
  score,
  size = 'md',
  variant = 'solid',
  animated = true,
  showIcon = true,
  showRange = false,
  className = '',
  ...props
}) => {
  const tier = getTierFromScore(score);
  const IconComponent = tier.icon;

  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return {
          borderColor: tier.borderColor,
          color: tier.color
        };
      case 'soft':
        return {
          backgroundColor: tier.bgColor,
          borderColor: tier.borderColor,
          color: tier.color
        };
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${tier.color}, ${tier.borderColor})`
        };
      default: // solid
        return {
          backgroundColor: tier.color
        };
    }
  };

  return (
    <span
      className={badgeVariants({ size, variant, animated, className })}
      style={getVariantStyles()}
      {...props}
    >
      {showIcon && <IconComponent className="h-4 w-4 mr-1.5" />}
      <span>{tier.name}</span>
      {showRange && (
        <span className="ml-1 opacity-75">({tier.range})</span>
      )}
    </span>
  );
};

// Detailed tier card with animation
export const CreditTierCard = ({
  score,
  previousScore = null,
  animated = true,
  showProgress = true,
  showBenefits = true,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  const currentTier = getTierFromScore(score);
  const previousTier = previousScore ? getTierFromScore(previousScore) : null;
  const hasUpgraded = previousTier && currentTier.minScore > previousTier.minScore;
  
  // Get next tier info
  const getNextTier = () => {
    const tiers = Object.values(creditTiers);
    const currentIndex = tiers.findIndex(t => t.minScore === currentTier.minScore);
    return currentIndex > 0 ? tiers[currentIndex - 1] : null;
  };
  
  const nextTier = getNextTier();
  const progressToNext = nextTier ? 
    ((score - currentTier.minScore) / (nextTier.minScore - currentTier.minScore)) * 100 : 100;

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [animated]);

  useEffect(() => {
    if (hasUpgraded) {
      setShowUpgrade(true);
      const timer = setTimeout(() => setShowUpgrade(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasUpgraded]);

  const IconComponent = currentTier.icon;

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border-2 transition-all duration-500
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        ${className}
      `}
      style={{
        borderColor: currentTier.borderColor,
        backgroundColor: currentTier.bgColor
      }}
      {...props}
    >
      {/* Upgrade celebration animation */}
      {showUpgrade && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 opacity-20 animate-pulse" />
      )}
      
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="p-3 rounded-full"
              style={{ backgroundColor: currentTier.color }}
            >
              <IconComponent className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: currentTier.color }}>
                {currentTier.name}
              </h3>
              <p className="text-sm text-secondary">
                Score Range: {currentTier.range}
              </p>
            </div>
          </div>
          
          {hasUpgraded && showUpgrade && (
            <div className="animate-bounce">
              <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Upgraded! 🎉
              </div>
            </div>
          )}
        </div>
        
        <p className="text-secondary">{currentTier.description}</p>
      </div>

      {/* Progress to next tier */}
      {showProgress && nextTier && (
        <div className="px-6 pb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-secondary">Progress to {nextTier.name}</span>
            <span className="font-medium" style={{ color: currentTier.color }}>
              {Math.round(progressToNext)}%
            </span>
          </div>
          <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-1000 ease-out"
              style={{
                backgroundColor: currentTier.color,
                width: `${Math.min(progressToNext, 100)}%`
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-secondary mt-1">
            <span>{currentTier.minScore}</span>
            <span>{nextTier.minScore}</span>
          </div>
        </div>
      )}

      {/* Benefits */}
      {showBenefits && (
        <div className="px-6 pb-6">
          <h4 className="font-medium text-primary mb-3">Your Benefits:</h4>
          <ul className="space-y-2">
            {currentTier.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <div 
                  className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: currentTier.color }}
                />
                <span className="text-secondary">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Tier comparison component
export const TierComparison = ({ 
  currentScore, 
  className = '',
  showAllTiers = true 
}) => {
  const currentTier = getTierFromScore(currentScore);
  const tiers = Object.values(creditTiers);
  const displayTiers = showAllTiers ? tiers : tiers.slice(0, 3);

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-primary mb-4">Credit Tier Comparison</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayTiers.map((tier) => {
          const isCurrent = tier.minScore === currentTier.minScore;
          const IconComponent = tier.icon;
          
          return (
            <div
              key={tier.name}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200
                ${isCurrent 
                  ? 'border-primary-500 bg-primary-50 shadow-md scale-105' 
                  : 'border-border-secondary bg-surface hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-center space-x-2 mb-3">
                <IconComponent 
                  className="h-5 w-5" 
                  style={{ color: tier.color }}
                />
                <h4 className="font-medium text-primary">{tier.name}</h4>
                {isCurrent && (
                  <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              
              <p className="text-sm text-secondary mb-2">
                Score: {tier.range}
              </p>
              
              <p className="text-xs text-secondary">
                {tier.benefits[0]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CreditTierBadge;
