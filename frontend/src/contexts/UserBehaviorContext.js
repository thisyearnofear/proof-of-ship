/**
 * @deprecated UserBehaviorContext.js - Merged into AppContext.tsx
 * 
 * Use: import { useApp } from '@/contexts/AppContext';
 * 
 * This file is kept for backward compatibility.
 */

import { AppProvider, useApp } from './AppContext';

// Backward compatibility exports
// Old consumers expected useUserBehavior to access tracking and preferences
export const useUserBehavior = () => {
  const app = useApp();
  return {
    // Map AppContext tracking to UserBehavior API
    trackViewModeChange: app.trackViewModeChange,
    trackFilterUsage: app.trackFilterUsage,
    trackEcosystemInteraction: app.trackEcosystemInteraction,
    trackProjectInteraction: app.trackProjectInteraction,
    trackFeatureUsage: app.trackFeatureUsage,
    // Expose preferences and smart defaults
    preferences: app.preferences,
    smartDefaults: app.smartDefaults,
    usageStats: app.usageStats,
    personalizedRecommendations: app.personalizedRecommendations,
    adaptiveSettings: app.adaptiveSettings,
    getAdaptiveSettings: app.getAdaptiveSettings,
    isExperiencedWith: app.isExperiencedWith,
    applySmartDefaults: app.applySmartDefaults,
  };
};

export const UserBehaviorProvider = AppProvider;

export { AppProvider, useApp };