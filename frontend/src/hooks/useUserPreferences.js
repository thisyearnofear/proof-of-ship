/**
 * User Preferences Hook
 * Manages user preferences with localStorage persistence and smart defaults
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pos_user_preferences';
const INTERACTION_KEY = 'pos_user_interactions';

const DEFAULT_PREFERENCES = {
  // Dashboard preferences
  defaultViewMode: 'overview',
  defaultEcosystemView: 'grid',
  autoExpandSections: true,
  
  // Filter preferences
  defaultSort: 'recent',
  defaultSortOrder: 'desc',
  rememberFilters: true,
  
  // Display preferences
  showHealthScores: true,
  showInactiveProjects: false,
  compactMode: false,
  
  // Ecosystem preferences
  favoriteEcosystems: ['celo', 'base'],
  lastVisitedEcosystem: 'celo',
  
  // Interaction tracking
  totalInteractions: 0,
  lastActiveDate: null,
  featureUsage: {},
  
  // Smart defaults
  experienceLevel: 'beginner', // beginner, intermediate, advanced
  preferredComplexity: 'simple', // simple, detailed, advanced
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Save preferences whenever they change
  useEffect(() => {
    if (isLoaded) {
      savePreferences(preferences);
    }
  }, [preferences, isLoaded]);

  const loadPreferences = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        
        // Merge with defaults to handle new preference keys
        const mergedPreferences = {
          ...DEFAULT_PREFERENCES,
          ...parsedPreferences,
          // Ensure nested objects are properly merged
          featureUsage: {
            ...DEFAULT_PREFERENCES.featureUsage,
            ...parsedPreferences.featureUsage
          }
        };
        
        setPreferences(mergedPreferences);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const savePreferences = useCallback((prefs) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }, []);

  // Update a specific preference
  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
      lastActiveDate: new Date().toISOString()
    }));
  }, []);

  // Update nested preference
  const updateNestedPreference = useCallback((parentKey, childKey, value) => {
    setPreferences(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      },
      lastActiveDate: new Date().toISOString()
    }));
  }, []);

  // Track user interaction
  const trackInteraction = useCallback((feature, action = 'use') => {
    setPreferences(prev => {
      const featureKey = `${feature}_${action}`;
      const currentCount = prev.featureUsage[featureKey] || 0;
      
      return {
        ...prev,
        totalInteractions: prev.totalInteractions + 1,
        featureUsage: {
          ...prev.featureUsage,
          [featureKey]: currentCount + 1
        },
        lastActiveDate: new Date().toISOString()
      };
    });
  }, []);

  // Get smart defaults based on user behavior
  const getSmartDefaults = useCallback(() => {
    const { totalInteractions, featureUsage } = preferences;
    
    // Determine experience level
    let experienceLevel = 'beginner';
    let preferredComplexity = 'simple';
    
    if (totalInteractions > 50) {
      experienceLevel = 'advanced';
      preferredComplexity = 'advanced';
    } else if (totalInteractions > 15) {
      experienceLevel = 'intermediate';
      preferredComplexity = 'detailed';
    }
    
    // Determine preferred view mode based on usage
    let defaultViewMode = 'overview';
    const detailedUsage = featureUsage['viewMode_detailed'] || 0;
    const ecosystemUsage = featureUsage['viewMode_ecosystem'] || 0;
    
    if (detailedUsage > ecosystemUsage && detailedUsage > 3) {
      defaultViewMode = 'detailed';
    } else if (ecosystemUsage > 3) {
      defaultViewMode = 'ecosystem';
    }
    
    // Determine favorite ecosystem
    const celoUsage = featureUsage['ecosystem_celo'] || 0;
    const baseUsage = featureUsage['ecosystem_base'] || 0;
    const papaUsage = featureUsage['ecosystem_papa'] || 0;
    
    let favoriteEcosystems = ['celo', 'base'];
    if (baseUsage > celoUsage) {
      favoriteEcosystems = ['base', 'celo'];
    }
    if (papaUsage > Math.max(celoUsage, baseUsage)) {
      favoriteEcosystems = ['papa', ...favoriteEcosystems.slice(0, 1)];
    }
    
    return {
      experienceLevel,
      preferredComplexity,
      defaultViewMode,
      favoriteEcosystems
    };
  }, [preferences]);

  // Apply smart defaults
  const applySmartDefaults = useCallback(() => {
    const smartDefaults = getSmartDefaults();
    setPreferences(prev => ({
      ...prev,
      ...smartDefaults
    }));
  }, [getSmartDefaults]);

  // Reset preferences
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get preference with fallback
  const getPreference = useCallback((key, fallback = null) => {
    return preferences[key] !== undefined ? preferences[key] : fallback;
  }, [preferences]);

  // Check if user is experienced with a feature
  const isExperiencedWith = useCallback((feature, threshold = 5) => {
    const usage = preferences.featureUsage[`${feature}_use`] || 0;
    return usage >= threshold;
  }, [preferences]);

  // Get usage stats
  const getUsageStats = useCallback(() => {
    const { totalInteractions, featureUsage, lastActiveDate } = preferences;
    
    const mostUsedFeatures = Object.entries(featureUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([feature, count]) => ({ feature, count }));
    
    const daysSinceLastActive = lastActiveDate 
      ? Math.floor((new Date() - new Date(lastActiveDate)) / (1000 * 60 * 60 * 24))
      : null;
    
    return {
      totalInteractions,
      mostUsedFeatures,
      daysSinceLastActive,
      experienceLevel: preferences.experienceLevel
    };
  }, [preferences]);

  return {
    // State
    preferences,
    isLoaded,
    
    // Actions
    updatePreference,
    updateNestedPreference,
    trackInteraction,
    applySmartDefaults,
    resetPreferences,
    
    // Getters
    getPreference,
    getSmartDefaults,
    isExperiencedWith,
    getUsageStats,
    
    // Computed values
    smartDefaults: getSmartDefaults(),
    usageStats: getUsageStats()
  };
};
