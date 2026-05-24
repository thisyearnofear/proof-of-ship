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
  signInAnonymously,
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

interface LinkedWallet {
  address: string;
  chainFamily: 'evm' | 'solana';
  signature: string;
  message: string;
  linkedAt: string;
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
  signInWithWallet: (walletAddress: string, signature: string, message: string, chainFamily?: 'evm' | 'solana') => Promise<void>;
  
  // Role
  userRole: 'builder' | 'backer' | null;
  
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
  
  // Wallet Linking
  linkedWallets: LinkedWallet[];
  linkWallet: (walletAddress: string, signature: string, message: string, chainFamily?: 'evm' | 'solana') => Promise<void>;
  unlinkWallet: (walletAddress: string) => Promise<void>;
  
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
  hasProjectPermission: (projectSlug: string) => boolean;
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
  const [linkedWallets, setLinkedWallets] = useState<LinkedWallet[]>([]);
  const [userRole, setUserRole] = useState<'builder' | 'backer' | null>(null);
  
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
      const githubUsername = (user as any).reloadUserInfo?.screenName
        || user.providerData.find(
        (p: any) => p.providerId === 'github.com'
      )?.displayName?.toLowerCase().replace(/\s/g, '') || null;
      
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
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      setCurrentUser(user);
      setLoading(true);
      
      if (user) {
        await checkPendingPermissions(user);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserPermissions(data.permissions || []);
          
          // Load linked wallets — migrate from old single-wallet format if needed
          if (data.wallets && Array.isArray(data.wallets)) {
            setLinkedWallets(data.wallets);
          } else if (data.wallet?.address) {
            // Migrate legacy single wallet to array format
            const migrated = [data.wallet];
            setLinkedWallets(migrated);
            await setDoc(doc(db, 'users', user.uid), { wallets: migrated }, { merge: true });
          } else {
            setLinkedWallets([]);
          }
          setUserRole(data.userRole || (data.githubUsername ? 'builder' : null));

          // If stored as 'builder' but no GitHub, treat as incomplete — clear the role
          // so the user is prompted to complete setup instead of being a phantom builder.
          if (data.userRole === 'builder' && !data.githubUsername) {
            setUserRole(null);
            // Persist the correction so we don't re-correct every load
            await setDoc(doc(db, 'users', user.uid), { userRole: null }, { merge: true });
          }
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
        setLinkedWallets([]);
        setUserRole(null);
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
        const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        
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
  
  const signInWithWallet = async (walletAddress: string, signature: string, message: string, chainFamily: 'evm' | 'solana' = 'evm') => {
    // Sign in anonymously to get a Firebase session for Firestore rules
    const credential = await signInAnonymously(auth);
    const uid = credential.user.uid;

    const entry: LinkedWallet = {
      address: walletAddress,
      chainFamily,
      signature,
      message,
      linkedAt: new Date().toISOString(),
    };

    // Look up existing account via wallet_index (not collection query on users)
    const walletKey = walletAddress.toLowerCase();
    const indexRef = doc(db, 'wallet_index', walletKey);
    const indexDoc = await getDoc(indexRef);

    let existingData: any = {};
    let existingWallets: LinkedWallet[] = [];

    if (indexDoc.exists()) {
      const existingUid = indexDoc.data().uid;
      const existingDocRef = doc(db, 'users', existingUid);
      const existingUserDoc = await getDoc(existingDocRef);

      if (existingUserDoc.exists()) {
        existingData = existingUserDoc.data();
        existingWallets = existingData.wallets || [];
      }

      // If the existing doc is under a different UID, migrate it to the new anonymous UID
      if (existingUid !== uid && existingUserDoc.exists()) {
        await setDoc(doc(db, 'users', uid), { ...existingData, uid }, { merge: true });
      }
    }

    // Deduplicate
    const updated = [...existingWallets.filter(w => w.address.toLowerCase() !== walletAddress.toLowerCase()), entry];

    const userDocRef = doc(db, 'users', uid);
    // Resolve .sol name for Solana wallets
    let displayName = existingData.displayName;
    if (!displayName) {
      if (chainFamily === 'solana') {
        try {
          const { snsService } = await import('@/services/SnsService');
          const snsName = await snsService.resolveAddressToName(walletAddress);
          displayName = snsName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        } catch {
          displayName = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        }
      } else {
        displayName = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
      }
    }

    await setDoc(userDocRef, {
      wallets: updated,
      walletAddress,
      userRole: 'backer',
      displayName,
    }, { merge: true });

    // Write wallet_index so future logins can find this account
    await setDoc(doc(db, 'wallet_index', walletKey), {
      uid,
      walletAddress,
      chainFamily,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    setLinkedWallets(updated);
    setUserRole('backer');
  };
  
  const logout = async () => {
    await signOut(auth);
    clearProfile();
  };
  
  const linkWallet = async (walletAddress: string, signature: string, message: string, chainFamily: 'evm' | 'solana' = 'evm') => {
    if (!currentUser) throw new Error('Must be authenticated to link wallet');
    
    const entry: LinkedWallet = {
      address: walletAddress,
      chainFamily,
      signature,
      message,
      linkedAt: new Date().toISOString(),
    };
    
    // Deduplicate: replace if same address exists, otherwise append
    const updated = [...linkedWallets.filter(w => w.address.toLowerCase() !== walletAddress.toLowerCase()), entry];
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    // Write wallets array + legacy walletAddress for backward compat with portfolio/API readers
    await setDoc(userDocRef, { wallets: updated, walletAddress: walletAddress }, { merge: true });

    // Write wallet_index for wallet login lookups
    await setDoc(doc(db, 'wallet_index', walletAddress.toLowerCase()), {
      uid: currentUser.uid,
      walletAddress,
      chainFamily,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    setLinkedWallets(updated);
  };
  
  const unlinkWallet = async (walletAddress: string) => {
    if (!currentUser) throw new Error('Must be authenticated');
    
    const updated = linkedWallets.filter(w => w.address.toLowerCase() !== walletAddress.toLowerCase());
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    // Update wallets array + legacy walletAddress (use next available or null)
    await setDoc(userDocRef, { wallets: updated, walletAddress: updated[0]?.address || null }, { merge: true });
    setLinkedWallets(updated);
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
  
  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (!userProfile) throw new Error('No user profile');
    
    const updatedProfile: UserProfile = { ...userProfile, ...updates };
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
        case 'github': {
          const githubData = currentUser?.providerData?.find((p: any) => p.providerId === 'github.com');
          result = await decentralizedAuth.connectGitHub({
            login: githubData?.uid || currentUser?.displayName,
            name: githubData?.displayName || currentUser?.displayName,
            photoURL: githubData?.photoURL || currentUser?.photoURL,
          });
          break;
        }
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
    
    const currentProfiles = (userProfile.profiles as Record<string, any>) || {};
    const currentStatus = (userProfile.completionStatus as Record<string, boolean>) || {};
    const updatedProfile: UserProfile = { 
      ...userProfile, 
      profiles: { ...currentProfiles },
      completionStatus: { ...currentStatus }
    };
    if (updatedProfile.profiles) {
      delete (updatedProfile.profiles as Record<string, any>)[platform];
    }
    if (updatedProfile.completionStatus) {
      (updatedProfile.completionStatus as Record<string, boolean>)[platform] = false;
    }
    
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
        const farcasterProfile = userProfile.profiles.farcaster as any;
        await decentralizedAuth.connectFarcaster(farcasterProfile?.username || '');
      }
      if (userProfile.profiles?.lens) {
        const lensProfile = userProfile.profiles.lens as any;
        await decentralizedAuth.connectLens(lensProfile?.handle || '');
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
    setLinkedWallets([]);
    setUserRole(null);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pos_user_profile');
      try {
        indexedDB.deleteDatabase('ProofOfShipDB');
      } catch {}
    }
  };
  
  // Computed values
  const getCompletionPercentage = () => {
    const status = userProfile?.completionStatus as Record<string, boolean> | undefined;
    if (!status) return 0;
    const statusValues = Object.values(status) as boolean[];
    const completed = statusValues.filter(Boolean).length;
    const total = statusValues.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };
  
  const getFundingEligibility = () => {
    if (!creditData) return { eligible: false, amount: 0, reason: 'No credit data' };
    
    const totalScore = typeof creditData.totalScore === 'number' ? creditData.totalScore : 0;
    const fundingEligible = !!creditData.fundingEligible;
    const fundingAmount = typeof creditData.fundingAmount === 'number' ? creditData.fundingAmount : 0;
    
    return {
      eligible: fundingEligible,
      amount: fundingAmount,
      reason: fundingEligible
        ? `Credit score of ${totalScore} qualifies for funding`
        : `Credit score of ${totalScore} is below minimum requirement of 400`,
    };
  };
  
  const isProfileComplete = () => getCompletionPercentage() === 100;
  
  const hasMinimumProfile = () => {
    const status = userProfile?.completionStatus;
    return !!(status?.wallet && status?.github);
  };
  
  const getRecommendations = () => creditData?.recommendations || [];

  const hasProjectPermission = (projectSlug: string): boolean => {
    if (!currentUser) return false;
    return userPermissions.some(p => p.projectSlug === projectSlug);
  };
  
  const value: UserContextType = {
    // Firebase Auth
    currentUser,
    loading,
    logout,
    signInWithGithub,
    signInWithWallet,
    userRole,
    linkedWallets,
    linkWallet,
    unlinkWallet,
    
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
    hasProjectPermission,
  };
  
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;