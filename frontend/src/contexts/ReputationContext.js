/**
 * @deprecated ReputationContext.js - Merged into UserContext.tsx
 * 
 * Use: import { useUser } from '@/contexts/UserContext';
 * 
 * This file is kept for backward compatibility.
 */

import { UserProvider, useUser } from './UserContext';

// Backward compatibility exports
// Old consumers expected useReputation for decentralized identity
const useReputation = () => {
  const user = useUser();
  return {
    // Map UserContext to Reputation API
    userProfile: user.userProfile,
    creditData: user.creditData,
    isAuthenticated: user.isAuthenticated,
    onboardingComplete: user.onboardingComplete,
    completionPercentage: user.completionPercentage,
    fundingEligibility: user.fundingEligibility,
    // Profile actions
    updateProfile: user.updateProfile,
    connectSocialProfile: user.connectSocialProfile,
    disconnectSocialProfile: user.disconnectSocialProfile,
    refreshProfile: user.refreshProfile,
    // Utilities
    isProfileComplete: user.isProfileComplete,
    hasMinimumProfile: user.hasMinimumProfile,
    getRecommendations: user.getRecommendations,
  };
};

export { UserProvider, useUser };
export { useReputation };