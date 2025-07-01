/**
 * Funding Interface Components
 * Enhanced funding experience with step-by-step wizard and comprehensive tracking
 */

// Core Funding Components
export { default as FundingWizard } from './FundingWizard';
export { default as FundingSlider } from './FundingSlider';
export { default as FundingHistory } from './FundingHistory';
export { default as FundingStatusTracker } from './FundingStatusTracker';
export { default as FundingTermsModal } from './FundingTermsModal';

// Funding utilities
export const fundingUtils = {
  // Calculate funding amount based on credit score
  calculateFundingAmount: (creditScore) => {
    if (creditScore >= 800) return 5000;
    if (creditScore >= 700) return 3500;
    if (creditScore >= 600) return 2000;
    if (creditScore >= 500) return 1000;
    return 500;
  },

  // Get funding tier information
  getFundingTier: (amount) => {
    if (amount >= 5000) return { name: 'Maximum', color: '#22c55e', description: 'Full funding potential' };
    if (amount >= 3500) return { name: 'Enterprise', color: '#3b82f6', description: 'Large-scale development' };
    if (amount >= 2000) return { name: 'Professional', color: '#f59e0b', description: 'Professional projects' };
    if (amount >= 1000) return { name: 'Growth', color: '#f97316', description: 'Scale your development' };
    return { name: 'Starter', color: '#ef4444', description: 'Perfect for small projects' };
  },

  // Calculate project timeline
  calculateProjectTimeline: (amount) => {
    if (amount >= 5000) return { months: 12, milestones: 4 };
    if (amount >= 3500) return { months: 9, milestones: 3 };
    if (amount >= 2000) return { months: 6, milestones: 3 };
    if (amount >= 1000) return { months: 4, milestones: 2 };
    return { months: 3, milestones: 1 };
  },

  // Calculate funding impact
  calculateFundingImpact: (amount) => ({
    developmentHours: Math.round(amount / 50),
    teamSize: Math.min(Math.ceil(amount / 2000), 5),
    features: Math.ceil(amount / 500),
    marketingBudget: Math.round(amount * 0.1)
  }),

  // Format funding amount
  formatFundingAmount: (amount, currency = 'USDC') => {
    return `$${amount.toLocaleString()} ${currency}`;
  },

  // Get funding status info
  getFundingStatusInfo: (status) => {
    const statusMap = {
      draft: { label: 'Draft', color: 'text-text-tertiary', bgColor: 'bg-background-secondary' },
      submitted: { label: 'Submitted', color: 'text-warning-600', bgColor: 'bg-warning-100' },
      under_review: { label: 'Under Review', color: 'text-primary-600', bgColor: 'bg-primary-100' },
      approved: { label: 'Approved', color: 'text-success-600', bgColor: 'bg-success-100' },
      disbursed: { label: 'Disbursed', color: 'text-success-600', bgColor: 'bg-success-100' },
      active: { label: 'Active', color: 'text-primary-600', bgColor: 'bg-primary-100' },
      completed: { label: 'Completed', color: 'text-success-600', bgColor: 'bg-success-100' },
      rejected: { label: 'Rejected', color: 'text-error-600', bgColor: 'bg-error-100' },
      overdue: { label: 'Overdue', color: 'text-error-600', bgColor: 'bg-error-100' }
    };
    return statusMap[status] || statusMap.draft;
  },

  // Calculate milestone progress
  calculateMilestoneProgress: (milestones) => {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / milestones.length) * 100);
  },

  // Validate funding application
  validateFundingApplication: (application) => {
    const errors = [];
    
    if (!application.amount || application.amount < 500) {
      errors.push('Minimum funding amount is $500');
    }
    
    if (!application.projectTitle || application.projectTitle.trim().length < 10) {
      errors.push('Project title must be at least 10 characters');
    }
    
    if (!application.projectDescription || application.projectDescription.trim().length < 50) {
      errors.push('Project description must be at least 50 characters');
    }
    
    if (!application.creditScore || application.creditScore < 400) {
      errors.push('Minimum credit score of 400 required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Funding component presets
export const fundingPresets = {
  // Wizard configurations
  wizard: {
    minimal: {
      steps: ['eligibility', 'amount', 'confirmation'],
      showProgress: true,
      allowStepNavigation: false
    },
    standard: {
      steps: ['eligibility', 'amount', 'terms', 'wallet', 'confirmation'],
      showProgress: true,
      allowStepNavigation: true
    },
    comprehensive: {
      steps: ['eligibility', 'amount', 'terms', 'wallet', 'confirmation'],
      showProgress: true,
      allowStepNavigation: true,
      showImpactCalculator: true,
      showTimeline: true
    }
  },

  // Slider configurations
  slider: {
    simple: {
      showPresets: false,
      showImpactCalculator: false,
      step: 500
    },
    standard: {
      showPresets: true,
      showImpactCalculator: true,
      step: 100
    },
    advanced: {
      showPresets: true,
      showImpactCalculator: true,
      showTimeline: true,
      step: 50
    }
  },

  // History configurations
  history: {
    compact: {
      showSummary: false,
      defaultExpanded: false,
      itemsPerPage: 5
    },
    standard: {
      showSummary: true,
      defaultExpanded: false,
      itemsPerPage: 10
    },
    detailed: {
      showSummary: true,
      defaultExpanded: true,
      showTransactionDetails: true,
      itemsPerPage: 20
    }
  }
};

// Funding constants
export const fundingConstants = {
  MIN_FUNDING_AMOUNT: 500,
  MAX_FUNDING_AMOUNT: 5000,
  MIN_CREDIT_SCORE: 400,
  DEFAULT_STEP: 100,
  INTEREST_RATE: 0,
  PROCESSING_FEE: 0,
  
  // Funding tiers
  FUNDING_TIERS: [
    { min: 500, max: 999, name: 'Starter', color: '#ef4444' },
    { min: 1000, max: 1999, name: 'Growth', color: '#f97316' },
    { min: 2000, max: 3499, name: 'Professional', color: '#f59e0b' },
    { min: 3500, max: 4999, name: 'Enterprise', color: '#3b82f6' },
    { min: 5000, max: 5000, name: 'Maximum', color: '#22c55e' }
  ],

  // Status flow
  STATUS_FLOW: ['draft', 'submitted', 'under_review', 'approved', 'disbursed', 'active', 'completed'],
  
  // Milestone statuses
  MILESTONE_STATUSES: ['pending', 'in-progress', 'completed', 'overdue']
};

export default {
  fundingUtils,
  fundingPresets,
  fundingConstants
};
