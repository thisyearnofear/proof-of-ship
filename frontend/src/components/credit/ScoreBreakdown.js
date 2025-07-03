import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common';
import { CircularProgress, MultiSegmentCircular } from '@/components/common/CircularProgress';
import { 
  CodeBracketIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  IdentificationIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Score breakdown data structure
const getScoreBreakdown = (creditData) => {
  const breakdown = {
    github: {
      label: 'GitHub Activity',
      weight: 40,
      score: creditData?.scores?.github?.score || 0,
      maxScore: 100,
      color: '#3b82f6',
      icon: CodeBracketIcon,
      details: {
        commits: creditData?.scores?.github?.commits || 0,
        repositories: creditData?.scores?.github?.repositories || 0,
        pullRequests: creditData?.scores?.github?.pullRequests || 0,
        issues: creditData?.scores?.github?.issues || 0
      },
      description: 'Based on your coding activity, repository quality, and contribution consistency'
    },
    social: {
      label: 'Social Reputation',
      weight: 30,
      score: creditData?.scores?.social?.score || 0,
      maxScore: 100,
      color: '#8b5cf6',
      icon: UserGroupIcon,
      details: {
        farcaster: creditData?.scores?.social?.farcaster || 0,
        lens: creditData?.scores?.social?.lens || 0,
        followers: creditData?.scores?.social?.followers || 0,
        engagement: creditData?.scores?.social?.engagement || 0
      },
      description: 'Your reputation across social protocols like Farcaster and Lens'
    },
    onchain: {
      label: 'On-Chain Activity',
      weight: 20,
      score: creditData?.scores?.onchain?.score || 0,
      maxScore: 100,
      color: '#10b981',
      icon: CurrencyDollarIcon,
      details: {
        transactions: creditData?.scores?.onchain?.transactions || 0,
        volume: creditData?.scores?.onchain?.volume || 0,
        defi: creditData?.scores?.onchain?.defi || 0,
        nfts: creditData?.scores?.onchain?.nfts || 0
      },
      description: 'Your blockchain transaction history and DeFi participation'
    },
    identity: {
      label: 'Identity Verification',
      weight: 10,
      score: creditData?.scores?.identity?.score || 0,
      maxScore: 100,
      color: '#f59e0b',
      icon: IdentificationIcon,
      details: {
        verified: creditData?.scores?.identity?.verified || false,
        consistency: creditData?.scores?.identity?.consistency || 0,
        age: creditData?.scores?.identity?.age || 0,
        connections: creditData?.scores?.identity?.connections || 0
      },
      description: 'Cross-platform identity consistency and verification status'
    }
  };

  return breakdown;
};

// Individual score component
const ScoreComponent = ({ 
  component, 
  isActive, 
  onHover, 
  onLeave,
  animated = true 
}) => {
  const weightedScore = (component.score * component.weight) / 100;
  const IconComponent = component.icon;

  return (
    <div
      className={`
        p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer
        ${isActive 
          ? 'border-primary-500 bg-primary-50 shadow-md scale-105' 
          : 'border-transparent bg-surface hover:bg-surface-secondary hover:shadow-sm'
        }
      `}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${component.color}20` }}
          >
            <IconComponent 
              className="h-5 w-5"
              style={{ color: component.color }}
            />
          </div>
          <div>
            <h3 className="font-medium text-primary">{component.label}</h3>
            <p className="text-xs text-secondary">{component.weight}% weight</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">
            {Math.round(component.score)}
          </div>
          <div className="text-xs text-secondary">
            /{component.maxScore}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-secondary mb-1">
          <span>Score</span>
          <span>{Math.round(weightedScore)} pts</span>
        </div>
        <div className="w-full bg-background-secondary rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-1000 ease-out"
            style={{
              backgroundColor: component.color,
              width: animated ? `${(component.score / component.maxScore) * 100}%` : '0%'
            }}
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-secondary leading-relaxed">
        {component.description}
      </p>

      {/* Detailed breakdown */}
      {isActive && (
        <div className="mt-4 pt-4 border-t border-border-secondary">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(component.details).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-sm font-medium text-primary">
                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value.toLocaleString()}
                </div>
                <div className="text-xs text-secondary capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main score breakdown component
export const ScoreBreakdown = ({ 
  creditData, 
  totalScore = 0,
  animated = true,
  showCircular = true,
  className = '' 
}) => {
  const [activeComponent, setActiveComponent] = useState(null);
  const breakdown = getScoreBreakdown(creditData);
  
  // Prepare segments for circular visualization
  const segments = Object.values(breakdown).map(component => ({
    label: component.label,
    value: (component.score * component.weight) / 100,
    color: component.color
  }));

  const handleComponentHover = (componentKey) => {
    setActiveComponent(componentKey);
  };

  const handleComponentLeave = () => {
    setActiveComponent(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with circular visualization */}
      {showCircular && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Credit Score Breakdown</span>
              <div className="group relative">
                <InformationCircleIcon className="h-4 w-4 text-text-tertiary cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-surface border border-default rounded-lg shadow-lg text-xs text-secondary w-64 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  Your credit score is calculated based on multiple factors with different weights. 
                  Hover over each component to see detailed breakdown.
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center justify-center space-y-6 lg:space-y-0 lg:space-x-12">
              {/* Circular visualization */}
              <div className="relative">
                <MultiSegmentCircular
                  segments={segments}
                  size="xl"
                  animated={animated}
                  showLabels={false}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-primary">
                    {Math.round(totalScore)}
                  </div>
                  <div className="text-sm text-secondary">
                    Total Score
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(breakdown).map(([key, component]) => (
                  <div 
                    key={key}
                    className={`
                      flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 cursor-pointer
                      ${activeComponent === key ? 'bg-primary-50 scale-105' : 'hover:bg-surface-secondary'}
                    `}
                    onMouseEnter={() => handleComponentHover(key)}
                    onMouseLeave={handleComponentLeave}
                  >
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: component.color }}
                    />
                    <div>
                      <div className="text-sm font-medium text-primary">
                        {component.label}
                      </div>
                      <div className="text-xs text-secondary">
                        {Math.round((component.score * component.weight) / 100)} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed component breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(breakdown).map(([key, component]) => (
          <ScoreComponent
            key={key}
            component={component}
            isActive={activeComponent === key}
            onHover={() => handleComponentHover(key)}
            onLeave={handleComponentLeave}
            animated={animated}
          />
        ))}
      </div>

      {/* Score improvement tips */}
      <Card>
        <CardHeader>
          <CardTitle>Improve Your Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(breakdown)
              .filter(([_, component]) => component.score < 80)
              .map(([key, component]) => (
                <div key={key} className="p-4 bg-surface-secondary rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <component.icon className="h-4 w-4" style={{ color: component.color }} />
                    <span className="font-medium text-primary">{component.label}</span>
                  </div>
                  <div className="text-sm text-secondary">
                    {getImprovementTip(key, component)}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to get improvement tips
const getImprovementTip = (componentKey, component) => {
  const tips = {
    github: 'Increase your coding activity by making regular commits, contributing to open source projects, and maintaining active repositories.',
    social: 'Build your social presence on Farcaster and Lens by sharing development insights and engaging with the developer community.',
    onchain: 'Increase your on-chain activity through DeFi participation, NFT interactions, and regular blockchain transactions.',
    identity: 'Verify your identity across platforms and maintain consistent profiles to improve your verification score.'
  };

  return tips[componentKey] || 'Continue building your developer reputation across all platforms.';
};

export default ScoreBreakdown;
