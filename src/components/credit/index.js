/**
 * Credit Visualization Components
 * Enhanced credit dashboard components with animations and interactivity
 */

// Core Credit Components
export { CreditDashboard } from './CreditDashboard';

// Visualization Components
export { default as ScoreBreakdown } from './ScoreBreakdown';
export { default as ScoreHistoryChart } from './ScoreHistoryChart';
export { default as ImprovementSuggestions } from './ImprovementSuggestions';
export { 
  CreditTierBadge,
  CreditTierCard,
  TierComparison
} from './CreditTierBadge';

// Re-export circular progress components for credit use
export {
  CircularProgress,
  CreditScoreCircular,
  MultiSegmentCircular
} from '../common/CircularProgress';

// Credit utilities
export const creditUtils = {
  // Calculate weighted score
  calculateWeightedScore: (scores) => {
    const weights = {
      github: 0.4,
      social: 0.3,
      onchain: 0.2,
      identity: 0.1
    };
    
    let totalScore = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      const score = scores[key]?.score || 0;
      totalScore += score * weight;
    });
    
    return Math.round(totalScore);
  },

  // Get credit tier from score
  getCreditTier: (score) => {
    if (score >= 800) return { tier: 'Excellent', color: '#22c55e', range: '800-850' };
    if (score >= 700) return { tier: 'Good', color: '#3b82f6', range: '700-799' };
    if (score >= 600) return { tier: 'Fair', color: '#f59e0b', range: '600-699' };
    if (score >= 500) return { tier: 'Poor', color: '#f97316', range: '500-599' };
    return { tier: 'Very Poor', color: '#ef4444', range: '400-499' };
  },

  // Calculate funding eligibility
  calculateFundingAmount: (score) => {
    if (score >= 800) return 5000;
    if (score >= 700) return 3500;
    if (score >= 600) return 2000;
    if (score >= 500) return 1000;
    return 500;
  },

  // Format score display
  formatScore: (score, maxScore = 850) => {
    return `${Math.round(score)}/${maxScore}`;
  },

  // Calculate score change
  calculateScoreChange: (currentScore, previousScore) => {
    if (!previousScore) return { change: 0, percentage: 0, direction: 'neutral' };
    
    const change = currentScore - previousScore;
    const percentage = ((change / previousScore) * 100).toFixed(1);
    
    return {
      change: Math.round(change),
      percentage: Math.abs(percentage),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  },

  // Get improvement priority
  getImprovementPriority: (scores) => {
    const priorities = [];
    
    Object.entries(scores).forEach(([category, data]) => {
      const score = data?.score || 0;
      if (score < 70) {
        priorities.push({
          category,
          score,
          priority: score < 50 ? 'high' : score < 70 ? 'medium' : 'low'
        });
      }
    });
    
    return priorities.sort((a, b) => a.score - b.score);
  }
};

// Credit component presets
export const creditPresets = {
  // Dashboard layouts
  dashboard: {
    compact: {
      showCircular: true,
      showBreakdown: false,
      showHistory: false,
      showSuggestions: true,
      maxSuggestions: 3
    },
    standard: {
      showCircular: true,
      showBreakdown: true,
      showHistory: true,
      showSuggestions: true,
      maxSuggestions: 6
    },
    detailed: {
      showCircular: true,
      showBreakdown: true,
      showHistory: true,
      showSuggestions: true,
      showComparison: true,
      maxSuggestions: 10
    }
  },

  // Visualization styles
  visualization: {
    minimal: {
      animated: false,
      showLabels: false,
      showProgress: false
    },
    standard: {
      animated: true,
      showLabels: true,
      showProgress: true
    },
    enhanced: {
      animated: true,
      showLabels: true,
      showProgress: true,
      interactive: true,
      showTooltips: true
    }
  }
};

export default {
  creditUtils,
  creditPresets
};
