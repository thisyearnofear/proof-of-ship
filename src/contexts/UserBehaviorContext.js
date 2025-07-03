/**
 * User Behavior Context
 * Tracks user interactions and provides smart defaults based on behavior patterns
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useRouter } from 'next/router';

const UserBehaviorContext = createContext();

export const useUserBehavior = () => {
  const context = useContext(UserBehaviorContext);
  if (!context) {
    throw new Error('useUserBehavior must be used within a UserBehaviorProvider');
  }
  return context;
};

export const UserBehaviorProvider = ({ children }) => {
  const router = useRouter();
  const {
    preferences,
    isLoaded,
    updatePreference,
    updateNestedPreference,
    trackInteraction,
    applySmartDefaults,
    getPreference,
    smartDefaults,
    usageStats,
    isExperiencedWith
  } = useUserPreferences();

  // Track page visits
  useEffect(() => {
    if (!isLoaded) return;

    const handleRouteChange = (url) => {
      // Extract page/section from URL
      const pathSegments = url.split('/').filter(Boolean);
      const page = pathSegments[0] || 'home';
      const section = pathSegments[1];

      trackInteraction(`page_${page}`, 'visit');
      
      if (section) {
        trackInteraction(`section_${section}`, 'visit');
      }

      // Track ecosystem visits
      if (page === 'ecosystems' && section) {
        trackInteraction(`ecosystem_${section}`, 'visit');
        updatePreference('lastVisitedEcosystem', section);
      }

      // Update last active date
      updatePreference('lastActiveDate', new Date().toISOString());
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    // Track initial page load
    handleRouteChange(router.asPath);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, isLoaded, trackInteraction, updatePreference]);

  // Auto-apply smart defaults based on usage patterns
  useEffect(() => {
    if (!isLoaded) return;

    const { totalInteractions } = preferences;
    
    // Apply smart defaults at interaction milestones
    if (totalInteractions === 10 || totalInteractions === 25 || totalInteractions === 50) {
      applySmartDefaults();
    }
  }, [preferences.totalInteractions, isLoaded, applySmartDefaults]);

  // Track view mode changes
  const trackViewModeChange = (viewMode, context = 'dashboard') => {
    trackInteraction(`viewMode_${viewMode}`, 'select');
    trackInteraction(`${context}_viewMode`, 'change');
    updatePreference('defaultViewMode', viewMode);
  };

  // Track filter usage
  const trackFilterUsage = (filterType, value, context = 'general') => {
    trackInteraction(`filter_${filterType}`, 'use');
    trackInteraction(`${context}_filter`, 'use');
    
    // Remember commonly used filters
    if (preferences.rememberFilters) {
      updateNestedPreference('commonFilters', `${context}_${filterType}`, value);
    }
  };

  // Track ecosystem interaction
  const trackEcosystemInteraction = (ecosystem, action = 'view') => {
    trackInteraction(`ecosystem_${ecosystem}`, action);
    
    // Update favorite ecosystems based on usage
    const currentFavorites = preferences.favoriteEcosystems || [];
    if (!currentFavorites.includes(ecosystem)) {
      const ecosystemUsage = preferences.featureUsage[`ecosystem_${ecosystem}_view`] || 0;
      
      // Add to favorites if used frequently
      if (ecosystemUsage >= 3) {
        const newFavorites = [ecosystem, ...currentFavorites.slice(0, 2)];
        updatePreference('favoriteEcosystems', newFavorites);
      }
    }
  };

  // Track project interaction
  const trackProjectInteraction = (projectSlug, ecosystem, action = 'view') => {
    trackInteraction(`project_${action}`, 'use');
    trackInteraction(`${ecosystem}_project`, action);
    
    // Track project preferences
    if (action === 'view') {
      updateNestedPreference('recentProjects', projectSlug, {
        ecosystem,
        lastViewed: new Date().toISOString(),
        viewCount: (preferences.recentProjects?.[projectSlug]?.viewCount || 0) + 1
      });
    }
  };

  // Track feature usage
  const trackFeatureUsage = (feature, context = null) => {
    const featureKey = context ? `${context}_${feature}` : feature;
    trackInteraction(featureKey, 'use');
    
    // Update experience level based on feature usage
    const currentLevel = preferences.experienceLevel;
    const totalUsage = Object.values(preferences.featureUsage).reduce((sum, count) => sum + count, 0);
    
    let newLevel = currentLevel;
    if (totalUsage > 100 && currentLevel !== 'advanced') {
      newLevel = 'advanced';
    } else if (totalUsage > 30 && currentLevel === 'beginner') {
      newLevel = 'intermediate';
    }
    
    if (newLevel !== currentLevel) {
      updatePreference('experienceLevel', newLevel);
      updatePreference('preferredComplexity', 
        newLevel === 'advanced' ? 'advanced' : 
        newLevel === 'intermediate' ? 'detailed' : 'simple'
      );
    }
  };

  // Get personalized recommendations
  const getPersonalizedRecommendations = () => {
    const { experienceLevel, favoriteEcosystems, featureUsage } = preferences;
    const recommendations = [];

    // Recommend based on experience level
    if (experienceLevel === 'beginner') {
      recommendations.push({
        type: 'feature',
        title: 'Try the Credit Dashboard',
        description: 'Get your developer credit score and unlock funding opportunities',
        action: '/credit',
        priority: 'high'
      });
    } else if (experienceLevel === 'intermediate') {
      recommendations.push({
        type: 'feature',
        title: 'Explore Ecosystem Deep Dives',
        description: 'Check out dedicated pages for detailed project analysis',
        action: `/ecosystems/${favoriteEcosystems[0]}`,
        priority: 'medium'
      });
    }

    // Recommend based on usage patterns
    const creditUsage = featureUsage['page_credit_visit'] || 0;
    const fundingUsage = featureUsage['funding_request_use'] || 0;
    
    if (creditUsage > 0 && fundingUsage === 0) {
      recommendations.push({
        type: 'action',
        title: 'Request Developer Funding',
        description: 'You have a credit score - time to get funded!',
        action: '/credit#funding',
        priority: 'high'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  // Get adaptive UI settings
  const getAdaptiveSettings = () => {
    const { experienceLevel, preferredComplexity, totalInteractions } = preferences;
    
    return {
      // Show advanced features based on experience
      showAdvancedFilters: experienceLevel !== 'beginner',
      showHealthScores: totalInteractions > 5,
      showDetailedStats: experienceLevel === 'advanced',
      
      // Default view complexity
      defaultComplexity: preferredComplexity,
      
      // Auto-expand sections for experienced users
      autoExpandSections: experienceLevel !== 'beginner',
      
      // Show onboarding hints
      showHints: totalInteractions < 10,
      
      // Compact mode for power users
      enableCompactMode: experienceLevel === 'advanced' && totalInteractions > 50
    };
  };

  const value = {
    // Preferences state
    preferences,
    isLoaded,
    smartDefaults,
    usageStats,
    
    // Preference management
    updatePreference,
    updateNestedPreference,
    getPreference,
    
    // Behavior tracking
    trackViewModeChange,
    trackFilterUsage,
    trackEcosystemInteraction,
    trackProjectInteraction,
    trackFeatureUsage,
    
    // Smart features
    getPersonalizedRecommendations,
    getAdaptiveSettings,
    isExperiencedWith,
    
    // Computed values
    personalizedRecommendations: getPersonalizedRecommendations(),
    adaptiveSettings: getAdaptiveSettings()
  };

  return (
    <UserBehaviorContext.Provider value={value}>
      {children}
    </UserBehaviorContext.Provider>
  );
};
