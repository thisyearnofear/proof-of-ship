/**
 * @deprecated AuthContext.tsx - Merged into UserContext.tsx
 * 
 * Use: import { useUser } from '@/contexts/UserContext';
 * 
 * Re-exports from UserContext with backward compatibility additions.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useUser } from './UserContext';

interface Permission {
  projectSlug: string;
  projectName: string;
  role: string;
  grantedAt: any;
}

interface AuthContextType {
  currentUser: any;
  loading: boolean;
  userPermissions: Permission[];
  logout: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  hasProjectPermission: (slug: string, requiredRole?: string) => boolean;
  linkWallet: (walletAddress: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  userPermissions: [],
  logout: async () => {},
  signInWithGithub: async () => {},
  hasProjectPermission: () => false,
  linkWallet: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const userContext = useUser();
  
  const hasProjectPermission = (slug: string, requiredRole = 'viewer') => {
    const permission = userContext.userPermissions.find(p => p.projectSlug === slug);
    if (!permission) return false;
    
    const roleHierarchy = ['viewer', 'editor', 'admin', 'owner'];
    const userRoleIndex = roleHierarchy.indexOf(permission.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    return userRoleIndex >= requiredRoleIndex;
  };
  
  const linkWallet = async (walletAddress: string) => {
    // Wallet linking is handled through UserContext profile updates
    console.log('Wallet linking not yet implemented:', walletAddress);
  };

  const value: AuthContextType = {
    currentUser: userContext.currentUser,
    loading: userContext.loading,
    userPermissions: userContext.userPermissions,
    logout: userContext.logout,
    signInWithGithub: userContext.signInWithGithub,
    hasProjectPermission,
    linkWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;