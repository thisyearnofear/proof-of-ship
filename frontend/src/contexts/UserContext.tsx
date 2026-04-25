/**
 * User Context - Consolidated (Phase 3C)
 * 
 * Combines functionality from:
 * - AuthContext.tsx (Firebase auth, GitHub OAuth)
 * - ReputationContext.js (decentralized identity, credit scoring, social profiles)
 * 
 * Provides unified user identity, authentication, and reputation management.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GithubAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/clientApp';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';

// ============================================================================
// Types
// ============================================================================

interface Permission {
  projectSlug: string;
  projectName: string;
  role: string;
  grantedAt: any;
}

interface UserProfile {
  address?: string;
  profiles?: {
    github?: any;
    farcaster?: any;
    lens?: any;
  };
  creditData?: any;
  completionStatus?: Record<string, boolean>;
  lastUpdated?: string;
}

interface UserContextType {
  // Firebase Auth
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  
  // User Permissions
  userPermissions: Permission[];
  
  // Decentralized Identity / Reputation
  userProfile: UserProfile | null;
  creditData: any | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  completionPercentage: number;
  fundingEligibility: {
    eligible: boolean;
    amount: number;
    reason: string;
  };
  
  // Profile Actions
  completeOnboarding: (profile: UserProfile, creditData: any) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  connectSocialProfile: (platform: string, identifier: string) => Promise<any>;
  disconnectSocialProfile: (platform: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearProfile: () => void;
  
  // Utility Methods
  isProfileComplete: () => boolean;
  hasMinimumProfile: () => boolean;
  getRecommendations: () => any[];
}

// ============================================================================
// Context
// ============================================================================

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// ============================================================================
// Provider
// ============================================================================

export const UserProvider = ({ children }: { children: ReactNode }) => {
  // Firebase Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  
  // Reputation/User Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [creditData, setCreditData] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  
  // Decentralized auth instance (lazy loaded)
  const [decentralizedAuth, setDecentralizedAuth] = useState<any>(null);
  
  // Initialize decentralized auth
  useEffect(() => {
    const initDecentralizedAuth = async () => {
      try {
        const mod = await import('@/lib/auth/DecentralizedAuth');
        setDecentralizedAuth(mod.decentralizedAuth);
      } catch (err) {
        console.warn('DecentralizedAuth not available:', err);
      }
    };
    initDecentralizedAuth();
  }, []);
  
  // Check for pending permissions when user logs in
  const checkPendingPermissions = async (user: User) => {
    try {
      const githubUsername = user.providerData.find(
        (p) => p.providerId === 'github.com'
      )?.uid;
      
      if (!githubUsername) return;
      
      const pendingPermissionsRef = collection(db, 'pendingPermissions');
      const q = query(
        pendingPermissionsRef,
        where('githubUsername', '==', githubUsername)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : { permissions: [] };
      const currentPermissions = userData.permissions || [];
      let newPermissions = [...currentPermissions];
      
      for (const permissionDoc of querySnapshot.docs) {
        const permissionData = permissionDoc.data();
        
        if (!newPermissions.some((p) => p.projectSlug === permissionData.projectSlug)) {
          newPermissions.push({
            projectSlug: permissionData.projectSlug,
            projectName: permissionData.projectName,
            role: permissionData.role,
            grantedAt: permissionData.grantedAt,
          });
          
          const projectRef = doc(db, 'projects', permissionData.projectSlug);
          const projectDoc = await getDoc(projectRef);
          
          if (projectDoc.exists()) {
            const projectData = projectDoc.data();
            const owners = projectData.owners || [];
            if (!owners.includes(user.uid)) {
              owners.push(user.uid);
              await setDoc(projectRef, { owners }, { merge: true });
            }
          }
          await deleteDoc(permissionDoc.ref);
        }
      }
      
      if (newPermissions.length !== currentPermissions.length) {
        await setDoc(userDocRef, { permissions: newPermissions }, { merge: true });
        setUserPermissions(newPermissions);
      }
    } catch (err) {
      console.error('Error checking pending permissions:', err);
    }
  };
  
  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(true);
      
      if (user) {
        await checkPendingPermissions(user);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserPermissions(userDoc.data().permissions || []);
        }
        
        // Load decentralized profile if available
        if (decentralizedAuth) {
          await loadDecentralizedProfile();
        }
      } else {
        setUserPermissions([]);
        setUserProfile(null);
        setCreditData(null);
        setIsAuthenticated(false);
        setOnboardingComplete(false);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [decentralizedAuth]);
  
  // Load decentralized profile from localStorage
  const loadDecentralizedProfile = async () => {
    if (!decentralizedAuth) return;
    
    try {
      const existingProfile = await decentralizedAuth.loadProfileLocally();
      
      if (existingProfile) {
        setUserProfile(existingProfile);
        setCreditData(existingProfile.creditData);
        setIsAuthenticated(true);
        setOnboardingComplete(true);
        
        // Refresh if stale (>24 hours)
        const lastUpdated = new Date(existingProfile.lastUpdated);
        const now = new Date();
        const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
          await refreshProfile();
        }
      }
    } catch (err) {
      console.error('Failed to load decentralized profile:', err);
    }
  };
  
  // Auth methods
  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    await signInWithPopup(auth, provider);
  };
  
  const logout = async () => {
    await signOut(auth);
    clearProfile();
  };
  
  // Profile management
  const completeOnboarding = async (profile: UserProfile, creditDataInput: any) => {
    setUserProfile(profile);
    setCreditData(creditDataInput);
    setOnboardingComplete(true);
    
    if (decentralizedAuth) {
      await decentralizedAuth.saveProfileLocally();
    }
  };
  
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return userProfile;
    
    const updatedProfile = { ...userProfile, ...updates };
    setUserProfile(updatedProfile);
    
    if (updates.profiles && decentralizedAuth) {
      const newCreditData = await decentralizedAuth.calculateCreditScore();
      setCreditData(newCreditData);
    }
    
    if (decentralizedAuth) {
      await decentralizedAuth.saveProfileLocally();
    }
    
    return updatedProfile;
  };
  
  const connectSocialProfile = async (platform: string, identifier: string) => {
    if (!userProfile || !decentralizedAuth) throw new Error('No user profile');
    
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
        const newCreditData = await decentralizedAuth.calculateCreditScore();
        setUserProfile(decentralizedAuth.userProfile);
        setCreditData(newCreditData);
        await decentralizedAuth.saveProfileLocally();
        return result;
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const disconnectSocialProfile = async (platform: string) => {
    if (!userProfile || !decentralizedAuth) return;
    
    const updatedProfile = { ...userProfile };
    delete updatedProfile.profiles[platform];
    updatedProfile.completionStatus[platform] = false;
    
    decentralizedAuth.userProfile = updatedProfile;
    
    const newCreditData = await decentralizedAuth.calculateCreditScore();
    
    setUserProfile(updatedProfile);
    setCreditData(newCreditData);
    await decentralizedAuth.saveProfileLocally();
  };
  
  const refreshProfile = async () => {
    if (!userProfile || !decentralizedAuth) return;
    
    try {
      if (userProfile.profiles?.github) {
        await decentralizedAuth.connectGitHub();
      }
      if (userProfile.profiles?.farcaster) {
        await decentralizedAuth.connectFarcaster(userProfile.profiles.farcaster.username);
      }
      if (userProfile.profiles?.lens) {
        await decentralizedAuth.connectLens(userProfile.profiles.lens.handle);
      }
      
      const newCreditData = await decentralizedAuth.calculateCreditScore();
      await decentralizedAuth.saveProfileLocally();
      
      setUserProfile(decentralizedAuth.userProfile);
      setCreditData(newCreditData);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };
  
  const clearProfile = () => {
    setUserProfile(null);
    setCreditData(null);
    setIsAuthenticated(false);
    setOnboardingComplete(false);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pos_user_profile');
      try {
        indexedDB.deleteDatabase('ProofOfShipDB');
      } catch {}
    }
  };
  
  // Computed values
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
        : `Credit score of ${creditData.totalScore} is below minimum requirement of 400`,
    };
  };
  
  const isProfileComplete = () => getCompletionPercentage() === 100;
  
  const hasMinimumProfile = () => 
    userProfile?.completionStatus?.wallet && userProfile?.completionStatus?.github;
  
  const getRecommendations = () => creditData?.recommendations || [];
  
  const value: UserContextType = {
    // Firebase Auth
    currentUser,
    loading,
    logout,
    signInWithGithub,
    
    // User Permissions
    userPermissions,
    
    // Decentralized Identity
    userProfile,
    creditData,
    isAuthenticated,
    onboardingComplete,
    completionPercentage: getCompletionPercentage(),
    fundingEligibility: getFundingEligibility(),
    
    // Profile Actions
    completeOnboarding,
    updateProfile,
    connectSocialProfile,
    disconnectSocialProfile,
    refreshProfile,
    clearProfile,
    
    // Utilities
    isProfileComplete,
    hasMinimumProfile,
    getRecommendations,
  };
  
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;