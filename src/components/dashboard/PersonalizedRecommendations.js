/**
 * Personalized Recommendations Component
 * Shows smart recommendations based on user behavior and preferences
 */

import React from 'react';
import { useRouter } from 'next/router';
import { useUserBehavior } from '../../contexts/UserBehaviorContext';
import { Card } from '../common/Card';
import Button from '../common/Button';
import {
  LightBulbIcon,
  SparklesIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function PersonalizedRecommendations({ className = '' }) {
  const router = useRouter();
  const { 
    personalizedRecommendations, 
    adaptiveSettings,
    usageStats,
    trackFeatureUsage 
  } = useUserBehavior();

  // Don't show recommendations if user is very experienced
  if (usageStats.experienceLevel === 'advanced' && usageStats.totalInteractions > 100) {
    return null;
  }

  // Don't show if no recommendations
  if (!personalizedRecommendations.length) {
    return null;
  }

  const handleRecommendationClick = (recommendation) => {
    trackFeatureUsage('recommendation_click', recommendation.type);
    
    if (recommendation.action.startsWith('/')) {
      router.push(recommendation.action);
    } else if (recommendation.action.startsWith('#')) {
      // Scroll to element
      const element = document.querySelector(recommendation.action);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleDismiss = (index) => {
    trackFeatureUsage('recommendation_dismiss');
    // In a real implementation, you'd update user preferences to hide this recommendation
  };

  return (
    <Card className={`p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 ${className}`}>
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <LightBulbIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Personalized for You
          </h3>
          <p className="text-gray-600 text-sm">
            Based on your activity, here are some suggestions to get the most out of the platform
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {personalizedRecommendations.slice(0, 3).map((recommendation, index) => (
          <RecommendationCard
            key={index}
            recommendation={recommendation}
            onClick={() => handleRecommendationClick(recommendation)}
            onDismiss={() => handleDismiss(index)}
          />
        ))}
      </div>

      {/* Experience Level Indicator */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">
              Experience Level: <span className="font-medium capitalize text-blue-700">
                {usageStats.experienceLevel}
              </span>
            </span>
          </div>
          <span className="text-gray-500">
            {usageStats.totalInteractions} interactions
          </span>
        </div>
      </div>
    </Card>
  );
}

function RecommendationCard({ recommendation, onClick, onDismiss }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-red-50';
      case 'medium': return 'border-l-yellow-400 bg-yellow-50';
      case 'low': return 'border-l-green-400 bg-green-50';
      default: return 'border-l-blue-400 bg-blue-50';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '⭐';
      case 'low': return '💡';
      default: return '👍';
    }
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 ${getPriorityColor(recommendation.priority)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{getPriorityIcon(recommendation.priority)}</span>
            <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
          </div>
          <p className="text-gray-700 text-sm mb-3">{recommendation.description}</p>
          
          <Button
            onClick={onClick}
            size="sm"
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <span>Take Action</span>
            <ArrowRightIcon className="w-3 h-3 ml-1" />
          </Button>
        </div>
        
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 p-1"
          title="Dismiss recommendation"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
