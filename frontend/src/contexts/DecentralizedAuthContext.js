import React, { createContext, useContext, useState, useEffect } from 'react';
import { decentralizedAuth } from '../lib/auth/DecentralizedAuth';
import { useMetaMask } from './MetaMaskContext';

const DecentralizedAuthContext = createContext();

export const useDecentralizedAuth = () => {
  const context = useContext(DecentralizedAuthContext);
  if (!context) {
    throw new Error('useDecentralizedAuth must be used within a DecentralizedAuthProvider');
  }
  return context;
};

export const DecentralizedAuthProvider = ({ children }) => {
  const { account, provider, connected } = useMetaMask();
  const [userProfile, setUserProfile] = useState(null);
  const [creditData, setCreditData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Handle wallet connection changes
  useEffect(() => {
    if (connected && account && !isAuthenticated) {
      handleWalletConnection();
    } else if (!connected && isAuthenticated) {
      handleWalletDisconnection();
    }
  }, [connected, account, isAuthenticated]);

  const initializeAuth = async () => {
    setLoading(true);
    
    try {
      // Try to load existing profile from local storage
      const existingProfile = await decentralizedAuth.loadProfileLocally();
      
      if (existingProfile) {
        setUserProfile(existingProfile);
        setCreditData(existingProfile.creditData);
        setIsAuthenticated(true);
        setOnboardingComplete(true);
        
        // Validate profile is still fresh (less than 24 hours)
        const lastUpdated = new Date(existingProfile.lastUpdated);
        const now = new Date();
        const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
          // Profile is stale, refresh in background
          refreshProfile(existingProfile);
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnection = async () => {
    if (!account || !provider) return;

    try {
      setLoading(true);
      
      // Check if we have an existing profile for this wallet
      const existingProfile = await decentralizedAuth.loadProfileLocally();
      
      if (existingProfile && existingProfile.address?.toLowerCase() === account.toLowerCase()) {
        // Same wallet, use existing profile
        setUserProfile(existingProfile);
        setCreditData(existingProfile.creditData);
        setIsAuthenticated(true);
        setOnboardingComplete(true);
      } else {
        // New wallet or no existing profile, start fresh
        const newProfile = await decentralizedAuth.connectWallet(provider);
        await decentralizedAuth.verifyIdentity(provider, account);
        
        setUserProfile(newProfile);
        setIsAuthenticated(true);
        setOnboardingComplete(false); // Need to complete onboarding
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletDisconnection = () => {
    setUserProfile(null);
    setCreditData(null);
    setIsAuthenticated(false);
    setOnboardingComplete(false);
    
    // Clear local storage
    localStorage.removeItem('pos_user_profile');
  };

  const refreshProfile = async (currentProfile) => {
    try {
      // Refresh GitHub data if connected
      if (currentProfile.profiles?.github) {
        await decentralizedAuth.connectGitHub();
      }
      
      // Refresh Farcaster data if connected
      if (currentProfile.profiles?.farcaster) {
        await decentralizedAuth.connectFarcaster(currentProfile.profiles.farcaster.username);
      }
      
      // Refresh Lens data if connected
      if (currentProfile.profiles?.lens) {
        await decentralizedAuth.connectLens(currentProfile.profiles.lens.handle);
      }
      
      // Recalculate credit score
      const newCreditData = await decentralizedAuth.calculateCreditScore();
      
      // Save updated profile
      await decentralizedAuth.saveProfileLocally();
      
      // Update state
      setUserProfile(decentralizedAuth.userProfile);
      setCreditData(newCreditData);
      
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const completeOnboarding = async (profile, creditData) => {
    setUserProfile(profile);
    setCreditData(creditData);
    setOnboardingComplete(true);
    
    // Save to local storage
    await decentralizedAuth.saveProfileLocally();
  };

  const updateProfile = async (updates) => {
    if (!userProfile) return;

    try {
      // Update profile
      const updatedProfile = { ...userProfile, ...updates };
      setUserProfile(updatedProfile);
      
      // Recalculate credit if needed
      if (updates.profiles) {
        const newCreditData = await decentralizedAuth.calculateCreditScore();
        setCreditData(newCreditData);
      }
      
      // Save locally
      await decentralizedAuth.saveProfileLocally();
      
      return updatedProfile;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const connectSocialProfile = async (platform, identifier) => {
    if (!userProfile) throw new Error('No user profile found');

    try {
      setLoading(true);
      
      let result;
      switch (platform) {
        case 'github':
          result = await decentralizedAuth.connectGitHub();
          break;
        case 'farcaster':
          result = await decentralizedAuth.connectFarcaster(identifier);
          break;
        case 'lens':
          result = await decentralizedAuth.connectLens(identifier);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      if (result) {
        // Recalculate credit score
        const newCreditData = await decentralizedAuth.calculateCreditScore();
        
        // Update state
        setUserProfile(decentralizedAuth.userProfile);
        setCreditData(newCreditData);
        
        // Save locally
        await decentralizedAuth.saveProfileLocally();
        
        return result;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const disconnectSocialProfile = async (platform) => {
    if (!userProfile) return;

    try {
      // Remove platform from profile
      const updatedProfile = { ...userProfile };
      delete updatedProfile.profiles[platform];
      updatedProfile.completionStatus[platform] = false;
      
      // Update decentralizedAuth instance
      decentralizedAuth.userProfile = updatedProfile;
      
      // Recalculate credit score
      const newCreditData = await decentralizedAuth.calculateCreditScore();
      
      // Update state
      setUserProfile(updatedProfile);
      setCreditData(newCreditData);
      
      // Save locally
      await decentralizedAuth.saveProfileLocally();
      
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error);
      throw error;
    }
  };

  const recalculateCredit = async () => {
    if (!userProfile) return null;

    try {
      setLoading(true);
      
      const newCreditData = await decentralizedAuth.calculateCreditScore();
      setCreditData(newCreditData);
      
      // Save locally
      await decentralizedAuth.saveProfileLocally();
      
      return newCreditData;
    } catch (error) {
      console.error('Failed to recalculate credit:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearProfile = () => {
    setUserProfile(null);
    setCreditData(null);
    setIsAuthenticated(false);
    setOnboardingComplete(false);
    
    // Clear local storage
    localStorage.removeItem('pos_user_profile');
    
    // Clear IndexedDB
    try {
      const request = indexedDB.deleteDatabase('ProofOfShipDB');
      request.onsuccess = () => {};
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
    }
  };

  const getCompletionPercentage = () => {
    if (!userProfile?.completionStatus) return 0;
    
    const completed = Object.values(userProfile.completionStatus).filter(Boolean).length;
    const total = Object.keys(userProfile.completionStatus).length;
    return Math.round((completed / total) * 100);
  };

  const getFundingEligibility = () => {
    if (!creditData) return { eligible: false, amount: 0, reason: 'No credit data' };
    
    return {
      eligible: creditData.fundingEligible,
      amount: creditData.fundingAmount,
      reason: creditData.fundingEligible 
        ? `Credit score of ${creditData.totalScore} qualifies for funding`
        : `Credit score of ${creditData.totalScore} is below minimum requirement of 400`
    };
  };

  const value = {
    // State
    userProfile,
    creditData,
    isAuthenticated,
    loading,
    onboardingComplete,
    
    // Computed values
    completionPercentage: getCompletionPercentage(),
    fundingEligibility: getFundingEligibility(),
    
    // Actions
    completeOnboarding,
    updateProfile,
    connectSocialProfile,
    disconnectSocialProfile,
    recalculateCredit,
    refreshProfile: () => refreshProfile(userProfile),
    clearProfile,
    
    // Utilities
    isProfileComplete: () => getCompletionPercentage() === 100,
    hasMinimumProfile: () => userProfile?.completionStatus?.wallet && userProfile?.completionStatus?.github,
    getRecommendations: () => creditData?.recommendations || []
  };

  return (
    <DecentralizedAuthContext.Provider value={value}>
      {children}
    </DecentralizedAuthContext.Provider>
  );
};
