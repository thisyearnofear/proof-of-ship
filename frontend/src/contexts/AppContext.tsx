/**
 * App Context - Consolidated (Phase 3C)
 * 
 * Combines functionality from:
 * - ThemeContext.tsx (light/dark/high-contrast themes)
 * - UserBehaviorContext.js (user preferences, tracking, smart defaults)
 * 
 * Provides unified UI preferences, theming, and user behavior tracking.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/router';

// ============================================================================
// Types
// ============================================================================

type Theme = 'light' | 'dark' | 'high-contrast';

interface AdaptiveSettings {
  showAdvancedFilters: boolean;
  showHealthScores: boolean;
  showDetailedStats: boolean;
  defaultComplexity: string;
  autoExpandSections: boolean;
  showHints: boolean;
  enableCompactMode: boolean;
}

interface PersonalizedRecommendation {
  type: string;
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

interface UserPreferences {
  theme?: Theme;
  defaultViewMode?: string;
  lastVisitedEcosystem?: string;
  lastActiveDate?: string;
  favoriteEcosystems?: string[];
  /**
   * User-pinned primary ecosystem (e.g. 'solana', 'arc', 'celo').
   * When set, this overrides wallet/activity inference for ranking purposes.
   * Set via onboarding "Pick your ecosystems" step or profile settings.
   */
  primaryEcosystem?: string;
  /**
   * Has the user completed (or dismissed) the ecosystem-preference onboarding step?
   */
  ecosystemOnboardingComplete?: boolean;
  recentProjects?: Record<string, any>;
  rememberFilters?: boolean;
  commonFilters?: Record<string, any>;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredComplexity?: 'simple' | 'detailed' | 'advanced';
  totalInteractions?: number;
  featureUsage?: Record<string, number>;
}

interface AppContextType {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLightTheme: () => void;
  setDarkTheme: () => void;
  setHighContrastTheme: () => void;
  themeMounted: boolean;
  
  // User Preferences
  preferences: UserPreferences;
  isLoaded: boolean;
  updatePreference: (key: string, value: any) => void;
  updateNestedPreference: (path: string, key: string, value: any) => void;
  getPreference: (key: string, defaultValue?: any) => any;
  
  // Behavior Tracking
  trackViewModeChange: (viewMode: string, context?: string) => void;
  trackFilterUsage: (filterType: string, value: any, context?: string) => void;
  trackEcosystemInteraction: (ecosystem: string, action?: string) => void;
  trackProjectInteraction: (projectSlug: string, ecosystem: string, action?: string) => void;
  trackFeatureUsage: (feature: string, context?: string) => void;
  trackInteraction: (event: string, type?: string) => void;
  
  // Smart Features
  getPersonalizedRecommendations: () => PersonalizedRecommendation[];
  getAdaptiveSettings: () => AdaptiveSettings;
  applySmartDefaults: () => void;
  isExperiencedWith: (feature: string) => boolean;
  smartDefaults: any;
  usageStats: any;
  personalizedRecommendations: PersonalizedRecommendation[];
  adaptiveSettings: AdaptiveSettings;
}

interface StoredPreferences {
  theme?: Theme;
  defaultViewMode?: string;
  lastVisitedEcosystem?: string;
  lastActiveDate?: string;
  favoriteEcosystems?: string[];
  primaryEcosystem?: string;
  ecosystemOnboardingComplete?: boolean;
  recentProjects?: Record<string, any>;
  rememberFilters?: boolean;
  commonFilters?: Record<string, any>;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredComplexity?: 'simple' | 'detailed' | 'advanced';
  totalInteractions?: number;
  featureUsage?: Record<string, number>;
}

// ============================================================================
// Backward Compatibility Hooks
// ============================================================================

// useTheme - maps to AppContext theme functionality
export const useTheme = () => {
  const app = useApp();
  return {
    theme: app.theme,
    setTheme: app.setTheme,
    toggleTheme: app.toggleTheme,
    setLightTheme: app.setLightTheme,
    setDarkTheme: app.setDarkTheme,
    setHighContrastTheme: app.setHighContrastTheme,
    themeMounted: app.themeMounted,
  };
};

// useUserBehavior - maps to AppContext behavior tracking functionality
export const useUserBehavior = () => {
  const app = useApp();
  return {
    // Map AppContext tracking to UserBehavior API
    trackViewModeChange: app.trackViewModeChange,
    trackFilterUsage: app.trackFilterUsage,
    trackEcosystemInteraction: app.trackEcosystemInteraction,
    trackProjectInteraction: app.trackProjectInteraction,
    trackFeatureUsage: app.trackFeatureUsage,
    trackInteraction: app.trackInteraction,
    // Expose preferences and smart defaults
    preferences: app.preferences,
    smartDefaults: app.smartDefaults,
    usageStats: app.usageStats,
    personalizedRecommendations: app.personalizedRecommendations,
    adaptiveSettings: app.adaptiveSettings,
    getAdaptiveSettings: app.getAdaptiveSettings,
    isExperiencedWith: app.isExperiencedWith,
    applySmartDefaults: app.applySmartDefaults,
    // Utility methods
    getPreference: app.getPreference,
    updatePreference: app.updatePreference,
  };
};

// ============================================================================
// Context
// ============================================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// ============================================================================
// Provider
// ============================================================================

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  
  // Theme state
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  
  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    experienceLevel: 'beginner',
    totalInteractions: 0,
    featureUsage: {},
  });
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Save to localStorage helper
  const savePreferencesToStorage = useCallback((prefs: StoredPreferences) => {
    try {
      localStorage.setItem('pos-user-preferences', JSON.stringify(prefs));
      localStorage.setItem('pos-dashboard-theme', prefs.theme || 'light');
    } catch (err) {
      console.warn('Failed to save preferences:', err);
    }
  }, []);
  
  // Preference methods
  const updatePreference = useCallback((key: string, value: any) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      savePreferencesToStorage(updated as StoredPreferences);
      return updated;
    });
  }, [savePreferencesToStorage]);
  
  const updateNestedPreference = useCallback((path: string, key: string, value: any) => {
    setPreferences(prev => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current: any = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = current[keys[i]] || {};
        current = current[keys[i]];
      }
      
      current[key] = value;
      savePreferencesToStorage(updated as StoredPreferences);
      return updated;
    });
  }, [savePreferencesToStorage]);
  
  // Ref to access current preferences without creating dependency cycles
  const preferencesRef = useRef(preferences);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);
  
  // Theme methods
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    savePreferencesToStorage({ ...preferencesRef.current, theme: newTheme });
  }, [savePreferencesToStorage]);
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };
  
  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');
  const setHighContrastTheme = () => setTheme('high-contrast');
  
  // Track interaction helper — stable callback (no deps on preferences)
  const trackInteraction = useCallback((event: string, _type: string = 'use') => {
    setPreferences(prev => {
      const featureUsage = { ...prev.featureUsage };
      featureUsage[event] = (featureUsage[event] || 0) + 1;
      
      const updated = {
        ...prev,
        totalInteractions: (prev.totalInteractions || 0) + 1,
        featureUsage,
      };
      
      // Persist to localStorage using the updated state (not stale closure)
      try {
        localStorage.setItem('pos-user-preferences', JSON.stringify(updated));
      } catch (err) {
        // Ignore storage errors
      }
      
      return updated;
    });
  }, []);
  
  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pos-user-preferences');
      if (saved) {
        const parsed: StoredPreferences = JSON.parse(saved);
        setPreferences({
          theme: parsed.theme || 'light',
          defaultViewMode: parsed.defaultViewMode,
          lastVisitedEcosystem: parsed.lastVisitedEcosystem,
          lastActiveDate: parsed.lastActiveDate,
          favoriteEcosystems: parsed.favoriteEcosystems || [],
          recentProjects: parsed.recentProjects || {},
          rememberFilters: parsed.rememberFilters ?? true,
          commonFilters: parsed.commonFilters || {},
          experienceLevel: parsed.experienceLevel || 'beginner',
          preferredComplexity: parsed.preferredComplexity || 'simple',
          totalInteractions: parsed.totalInteractions || 0,
          featureUsage: parsed.featureUsage || {},
        });
        setThemeState(parsed.theme || 'light');
      }
    } catch (err) {
      console.warn('Failed to load preferences:', err);
    }
    setIsLoaded(true);
  }, []);
  
  // Apply theme to document
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme, mounted]);
  
  // Initialize
  useEffect(() => {
    // Apply system theme or saved theme
    const savedTheme = localStorage.getItem('pos-dashboard-theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = (savedTheme as Theme) || systemTheme;
    
    setThemeState(initialTheme);
    setMounted(true);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('pos-dashboard-theme')) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Stable ref for updatePreference to avoid re-subscriptions
  const updatePreferenceRef = useRef(updatePreference);
  useEffect(() => {
    updatePreferenceRef.current = updatePreference;
  }, [updatePreference]);
  
  // Track page visits — stable effect that only re-subscribes when router/isLoaded change
  useEffect(() => {
    if (!isLoaded) return;
    
    const handleRouteChange = (url: string) => {
      const pathSegments = url.split('/').filter(Boolean);
      const page = pathSegments[0] || 'home';
      const section = pathSegments[1];
      
      trackInteraction(`page_${page}`, 'visit');
      
      if (section) {
        trackInteraction(`section_${section}`, 'visit');
      }
      
      if (page === 'ecosystems' && section) {
        trackInteraction(`ecosystem_${section}`, 'visit');
        updatePreferenceRef.current('lastVisitedEcosystem', section);
      }
      
      updatePreferenceRef.current('lastActiveDate', new Date().toISOString());
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    handleRouteChange(router.asPath);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  // trackInteraction is now stable (no deps), so this effect won't re-run on every preference change
  }, [router, isLoaded, trackInteraction]);
  
  // Smart features
  const applySmartDefaults = useCallback(() => {
    if (preferencesRef.current.experienceLevel === 'beginner') {
      updatePreference('showHints', true);
      updatePreference('defaultComplexity', 'simple');
    } else if (preferencesRef.current.experienceLevel === 'intermediate') {
      updatePreference('showAdvancedFilters', true);
      updatePreference('defaultComplexity', 'detailed');
    } else {
      updatePreference('enableCompactMode', true);
      updatePreference('defaultComplexity', 'advanced');
    }
  }, [updatePreference]);

  // Auto-apply smart defaults at milestones
  useEffect(() => {
    if (!isLoaded) return;
    
    const { totalInteractions } = preferences;
    
    if (totalInteractions === 10 || totalInteractions === 25 || totalInteractions === 50) {
      applySmartDefaults();
    }
  }, [preferences.totalInteractions, isLoaded, applySmartDefaults]);
  
  const getPreference = useCallback((key: string, defaultValue?: any) => {
    return (preferences as any)[key] ?? defaultValue;
  }, [preferences]);
  
  // Tracking methods
  const trackViewModeChange = (viewMode: string, context = 'dashboard') => {
    trackInteraction(`viewMode_${viewMode}`, 'select');
    trackInteraction(`${context}_viewMode`, 'change');
    updatePreference('defaultViewMode', viewMode);
  };
  
  const trackFilterUsage = (filterType: string, value: any, context = 'general') => {
    trackInteraction(`filter_${filterType}`, 'use');
    trackInteraction(`${context}_filter`, 'use');
    
    if (preferences.rememberFilters) {
      updateNestedPreference('commonFilters', `${context}_${filterType}`, value);
    }
  };
  
  const trackEcosystemInteraction = (ecosystem: string, action = 'view') => {
    trackInteraction(`ecosystem_${ecosystem}`, action);
    
    const currentFavorites = preferences.favoriteEcosystems || [];
    if (!currentFavorites.includes(ecosystem)) {
      const ecosystemUsage = preferences.featureUsage?.[`ecosystem_${ecosystem}_view`] || 0;
      
      if (ecosystemUsage >= 3) {
        const newFavorites = [ecosystem, ...currentFavorites.slice(0, 2)];
        updatePreference('favoriteEcosystems', newFavorites);
      }
    }
  };
  
  const trackProjectInteraction = (projectSlug: string, ecosystem: string, action = 'view') => {
    trackInteraction(`project_${action}`, 'use');
    trackInteraction(`${ecosystem}_project`, action);
    
    if (action === 'view') {
      updateNestedPreference('recentProjects', projectSlug, {
        ecosystem,
        lastViewed: new Date().toISOString(),
        viewCount: (preferences.recentProjects?.[projectSlug]?.viewCount || 0) + 1,
      });
    }
  };
  
  const trackFeatureUsage = (feature: string, context?: string) => {
    const featureKey = context ? `${context}_${feature}` : feature;
    trackInteraction(featureKey, 'use');
    
    // Update experience level based on usage
    const currentLevel = preferences.experienceLevel;
    const totalUsage = Object.values(preferences.featureUsage || {}).reduce((sum, count) => sum + count, 0);
    
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
  

  
  const isExperiencedWith = (feature: string) => {
    return (preferences.featureUsage?.[feature] || 0) >= 3;
  };
  
  const getPersonalizedRecommendations = (): PersonalizedRecommendation[] => {
    const { experienceLevel, favoriteEcosystems, featureUsage } = preferences;
    const recommendations: PersonalizedRecommendation[] = [];
    
    if (experienceLevel === 'beginner') {
      recommendations.push({
        type: 'feature',
        title: 'Try the Credit Dashboard',
        description: 'Get your developer credit score and unlock funding opportunities',
        action: '/credit',
        priority: 'high',
      });
    } else if (experienceLevel === 'intermediate') {
      recommendations.push({
        type: 'feature',
        title: 'Explore Ecosystem Deep Dives',
        description: 'Check out dedicated pages for detailed project analysis',
        action: `/ecosystems/${favoriteEcosystems?.[0] || 'celo'}`,
        priority: 'medium',
      });
    }
    
    const creditUsage = featureUsage?.['page_credit_visit'] || 0;
    const fundingUsage = featureUsage?.['funding_request_use'] || 0;
    
    if (creditUsage > 0 && fundingUsage === 0) {
      recommendations.push({
        type: 'action',
        title: 'Request Developer Funding',
        description: 'You have a credit score - time to get funded!',
        action: '/credit#funding',
        priority: 'high',
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };
  
  const getAdaptiveSettings = (): AdaptiveSettings => {
    const { experienceLevel, preferredComplexity, totalInteractions } = preferences;
    
    return {
      showAdvancedFilters: experienceLevel !== 'beginner',
      showHealthScores: (totalInteractions || 0) > 5,
      showDetailedStats: experienceLevel === 'advanced',
      defaultComplexity: preferredComplexity || 'simple',
      autoExpandSections: experienceLevel !== 'beginner',
      showHints: (totalInteractions || 0) < 10,
      enableCompactMode: experienceLevel === 'advanced' && (totalInteractions || 0) > 50,
    };
  };
  
  const value: AppContextType = {
    // Theme
    theme,
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setHighContrastTheme,
    themeMounted: mounted,
    
    // User Preferences
    preferences,
    isLoaded,
    updatePreference,
    updateNestedPreference,
    getPreference,
    
    // Behavior Tracking
    trackViewModeChange,
    trackFilterUsage,
    trackEcosystemInteraction,
    trackProjectInteraction,
    trackFeatureUsage,
    trackInteraction,
    
    // Smart Features
    getPersonalizedRecommendations,
    getAdaptiveSettings,
    applySmartDefaults,
    isExperiencedWith,
    smartDefaults: applySmartDefaults,
    usageStats: {
      totalInteractions: preferences.totalInteractions || 0,
      featureUsage: preferences.featureUsage || {},
    },
    personalizedRecommendations: getPersonalizedRecommendations(),
    adaptiveSettings: getAdaptiveSettings(),
  };
  
  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;