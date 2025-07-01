import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common';
import { 
  LightBulbIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  StarIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline';

// Generate improvement suggestions based on credit data
const generateSuggestions = (creditData) => {
  const suggestions = [];
  const scores = creditData?.scores || {};

  // GitHub suggestions
  if ((scores.github?.score || 0) < 80) {
    suggestions.push({
      id: 'github-commits',
      category: 'GitHub Activity',
      priority: 'high',
      title: 'Increase Commit Frequency',
      description: 'Make regular commits to show consistent development activity',
      impact: '+15-25 points',
      timeframe: '2-4 weeks',
      difficulty: 'easy',
      icon: '📈',
      color: '#3b82f6',
      actions: [
        'Set up a daily coding routine',
        'Contribute to open source projects',
        'Work on personal projects regularly',
        'Use GitHub\'s contribution graph as motivation'
      ],
      resources: [
        { title: 'GitHub Flow Guide', url: '#', type: 'guide' },
        { title: 'Open Source Projects', url: '#', type: 'external' }
      ]
    });

    suggestions.push({
      id: 'github-repos',
      category: 'GitHub Activity',
      priority: 'medium',
      title: 'Create Quality Repositories',
      description: 'Build well-documented repositories with clear README files',
      impact: '+10-20 points',
      timeframe: '1-2 weeks',
      difficulty: 'medium',
      icon: '📚',
      color: '#3b82f6',
      actions: [
        'Add comprehensive README files',
        'Include proper documentation',
        'Add license and contribution guidelines',
        'Use meaningful commit messages'
      ],
      resources: [
        { title: 'README Best Practices', url: '#', type: 'guide' },
        { title: 'Documentation Templates', url: '#', type: 'template' }
      ]
    });
  }

  // Social suggestions
  if ((scores.social?.score || 0) < 70) {
    suggestions.push({
      id: 'social-farcaster',
      category: 'Social Reputation',
      priority: 'high',
      title: 'Build Farcaster Presence',
      description: 'Share development insights and engage with the developer community',
      impact: '+20-30 points',
      timeframe: '3-6 weeks',
      difficulty: 'medium',
      icon: '🌐',
      color: '#8b5cf6',
      actions: [
        'Share daily development updates',
        'Engage with other developers\' posts',
        'Share technical insights and learnings',
        'Participate in developer discussions'
      ],
      resources: [
        { title: 'Farcaster for Developers', url: '#', type: 'guide' },
        { title: 'Content Ideas', url: '#', type: 'template' }
      ]
    });

    suggestions.push({
      id: 'social-lens',
      category: 'Social Reputation',
      priority: 'medium',
      title: 'Establish Lens Protocol Profile',
      description: 'Create a professional presence on Lens Protocol',
      impact: '+15-25 points',
      timeframe: '2-4 weeks',
      difficulty: 'easy',
      icon: '🔍',
      color: '#8b5cf6',
      actions: [
        'Set up a complete Lens profile',
        'Share technical content regularly',
        'Follow and interact with other developers',
        'Mirror interesting technical posts'
      ],
      resources: [
        { title: 'Lens Protocol Guide', url: '#', type: 'guide' },
        { title: 'Profile Optimization', url: '#', type: 'checklist' }
      ]
    });
  }

  // On-chain suggestions
  if ((scores.onchain?.score || 0) < 60) {
    suggestions.push({
      id: 'onchain-defi',
      category: 'On-Chain Activity',
      priority: 'medium',
      title: 'Explore DeFi Protocols',
      description: 'Participate in decentralized finance to show blockchain engagement',
      impact: '+10-20 points',
      timeframe: '1-3 weeks',
      difficulty: 'medium',
      icon: '💰',
      color: '#10b981',
      actions: [
        'Try liquidity providing on Uniswap',
        'Stake tokens on various protocols',
        'Use lending/borrowing platforms',
        'Participate in governance voting'
      ],
      resources: [
        { title: 'DeFi Safety Guide', url: '#', type: 'guide' },
        { title: 'Protocol Comparison', url: '#', type: 'comparison' }
      ]
    });

    suggestions.push({
      id: 'onchain-nfts',
      category: 'On-Chain Activity',
      priority: 'low',
      title: 'NFT Ecosystem Participation',
      description: 'Engage with NFT marketplaces and collections',
      impact: '+5-15 points',
      timeframe: '1-2 weeks',
      difficulty: 'easy',
      icon: '🎨',
      color: '#10b981',
      actions: [
        'Mint or purchase NFTs from reputable collections',
        'Participate in NFT communities',
        'Create your own NFT collection',
        'Trade on established marketplaces'
      ],
      resources: [
        { title: 'NFT Marketplace Guide', url: '#', type: 'guide' },
        { title: 'Collection Analysis', url: '#', type: 'tool' }
      ]
    });
  }

  // Identity suggestions
  if ((scores.identity?.score || 0) < 90) {
    suggestions.push({
      id: 'identity-verification',
      category: 'Identity Verification',
      priority: 'high',
      title: 'Complete Identity Verification',
      description: 'Verify your identity across all connected platforms',
      impact: '+5-10 points',
      timeframe: '1 week',
      difficulty: 'easy',
      icon: '✅',
      color: '#f59e0b',
      actions: [
        'Verify GitHub account with email',
        'Connect social media profiles',
        'Ensure consistent usernames across platforms',
        'Add profile pictures and bio information'
      ],
      resources: [
        { title: 'Verification Checklist', url: '#', type: 'checklist' },
        { title: 'Profile Optimization', url: '#', type: 'guide' }
      ]
    });
  }

  // Sort by priority and impact
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

// Priority badge component
const PriorityBadge = ({ priority }) => {
  const config = {
    high: { color: 'bg-error-100 text-error-700', icon: FireIcon, label: 'High Priority' },
    medium: { color: 'bg-warning-100 text-warning-700', icon: ClockIcon, label: 'Medium Priority' },
    low: { color: 'bg-success-100 text-success-700', icon: StarIcon, label: 'Low Priority' }
  };

  const { color, icon: Icon, label } = config[priority];

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </div>
  );
};

// Difficulty badge component
const DifficultyBadge = ({ difficulty }) => {
  const config = {
    easy: { color: 'bg-success-100 text-success-700', label: 'Easy' },
    medium: { color: 'bg-warning-100 text-warning-700', label: 'Medium' },
    hard: { color: 'bg-error-100 text-error-700', label: 'Hard' }
  };

  const { color, label } = config[difficulty];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

// Individual suggestion card
const SuggestionCard = ({ suggestion, onMarkComplete, onStartAction, isCompleted = false }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`transition-all duration-200 ${isCompleted ? 'opacity-60' : 'hover:shadow-md'}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div 
              className="text-2xl p-2 rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${suggestion.color}20` }}
            >
              {suggestion.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className={`font-semibold ${isCompleted ? 'line-through text-secondary' : 'text-primary'}`}>
                  {suggestion.title}
                </h3>
                {isCompleted && <CheckCircleIcon className="h-4 w-4 text-success-500" />}
              </div>
              <p className="text-secondary text-sm mb-3">{suggestion.description}</p>
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={suggestion.priority} />
                <DifficultyBadge difficulty={suggestion.difficulty} />
                <span className="text-xs text-secondary">
                  Impact: <span className="font-medium text-success-600">{suggestion.impact}</span>
                </span>
                <span className="text-xs text-secondary">
                  Time: <span className="font-medium">{suggestion.timeframe}</span>
                </span>
              </div>
            </div>
          </div>
          
          {!isCompleted && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Less' : 'More'}
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onStartAction(suggestion)}
              >
                Start
              </Button>
            </div>
          )}
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t border-border-secondary">
            {/* Action steps */}
            <div>
              <h4 className="font-medium text-primary mb-2">Action Steps:</h4>
              <ul className="space-y-1">
                {suggestion.actions.map((action, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-secondary">
                    <ArrowRightIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            {suggestion.resources && suggestion.resources.length > 0 && (
              <div>
                <h4 className="font-medium text-primary mb-2">Helpful Resources:</h4>
                <div className="flex flex-wrap gap-2">
                  {suggestion.resources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      className="inline-flex items-center px-3 py-1 bg-surface-secondary hover:bg-surface-hover rounded-full text-xs text-secondary hover:text-primary transition-colors"
                    >
                      {resource.title}
                      <ArrowRightIcon className="h-3 w-3 ml-1" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Mark as complete */}
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                variant="success"
                onClick={() => onMarkComplete(suggestion.id)}
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main improvement suggestions component
export const ImprovementSuggestions = ({ 
  creditData, 
  className = '',
  maxSuggestions = 6 
}) => {
  const [completedSuggestions, setCompletedSuggestions] = useState(new Set());
  const [filter, setFilter] = useState('all');
  
  const allSuggestions = generateSuggestions(creditData);
  const suggestions = allSuggestions.slice(0, maxSuggestions);

  const handleMarkComplete = (suggestionId) => {
    setCompletedSuggestions(prev => new Set([...prev, suggestionId]));
  };

  const handleStartAction = (suggestion) => {
    // In a real app, this would navigate to the relevant section or open a modal
    console.log('Starting action for:', suggestion.title);
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (filter === 'all') return true;
    if (filter === 'completed') return completedSuggestions.has(suggestion.id);
    if (filter === 'pending') return !completedSuggestions.has(suggestion.id);
    return suggestion.priority === filter;
  });

  const completionRate = Math.round((completedSuggestions.size / suggestions.length) * 100);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <LightBulbIcon className="h-5 w-5" />
                <span>Improvement Suggestions</span>
              </CardTitle>
              <p className="text-sm text-secondary mt-1">
                Personalized recommendations to boost your credit score
              </p>
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-primary">
                  {completedSuggestions.size} of {suggestions.length} completed
                </div>
                <div className="text-xs text-secondary">
                  {completionRate}% progress
                </div>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-background-secondary"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-success-500"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${completionRate}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">{completionRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'completed', label: 'Completed' },
              { key: 'high', label: 'High Priority' },
              { key: 'medium', label: 'Medium Priority' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`
                  px-3 py-1 text-sm font-medium rounded-full transition-colors
                  ${filter === tab.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface text-secondary hover:text-primary hover:bg-surface-hover'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Suggestions grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onMarkComplete={handleMarkComplete}
                onStartAction={handleStartAction}
                isCompleted={completedSuggestions.has(suggestion.id)}
              />
            ))}
          </div>
          
          {filteredSuggestions.length === 0 && (
            <div className="text-center py-8">
              <TrophyIcon className="h-12 w-12 text-success-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">
                {filter === 'completed' ? 'No completed suggestions yet' : 'No suggestions found'}
              </h3>
              <p className="text-secondary">
                {filter === 'completed' 
                  ? 'Start working on suggestions to see your progress here.'
                  : 'Try adjusting your filter or check back later for new suggestions.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovementSuggestions;
