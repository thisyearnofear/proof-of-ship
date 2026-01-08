import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useMetaMask } from './MetaMaskContext';
import { decentralizedAuth } from '../lib/auth/DecentralizedAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

const IdentityContext = createContext();

export const useIdentity = () => {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
};

export const IdentityProvider = ({ children }) => {
  const { currentUser, linkWallet: linkToFirebase } = useAuth();
  const { account, provider, connected, chainId } = useMetaMask();
  
  const [identity, setIdentity] = useState({
    isFullyAuthed: false, // Both GH and Wallet
    isGitHubAuthed: false,
    isWalletConnected: false,
    primaryWallet: null,
    githubUsername: null,
    creditScore: 0,
    loading: true
  });

  const [profile, setProfile] = useState(null);

  // Sync identity state
  const syncIdentity = useCallback(async () => {
    if (!currentUser && !connected) {
      setIdentity({
        isFullyAuthed: false,
        isGitHubAuthed: false,
        isWalletConnected: false,
        primaryWallet: null,
        githubUsername: null,
        creditScore: 0,
        loading: false
      });
      return;
    }

    let githubUsername = null;
    if (currentUser) {
      githubUsername = currentUser.providerData.find(p => p.providerId === 'github.com')?.uid || null;
    }

    const isGitHubAuthed = !!currentUser;
    const isWalletConnected = !!connected && !!account;
    
    // Fetch extended profile from Firebase if we have a user
    let primaryWallet = account;
    let creditScore = 0;

    if (currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          primaryWallet = data.primaryWallet || account;
          creditScore = data.creditScore || 0;
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    }

    setIdentity({
      isFullyAuthed: isGitHubAuthed && isWalletConnected,
      isGitHubAuthed,
      isWalletConnected,
      primaryWallet,
      githubUsername,
      creditScore,
      loading: false
    });
  }, [currentUser, connected, account]);

  useEffect(() => {
    syncIdentity();
  }, [syncIdentity]);

  // SIWE and Linking
  const linkIdentity = async () => {
    if (!currentUser || !connected || !account) {
      throw new Error("GitHub and Wallet must both be connected to link identity");
    }

    try {
      const message = `Proof of Ship - Link Identity\n\nGitHub: ${identity.githubUsername}\nWallet: ${account}\nTimestamp: ${Date.now()}`;
      
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, account]
      });

      // 1. Link in Firebase (Centralized registry for ownership)
      await linkToFirebase(account, signature, message);
      
      // 2. Refresh identity
      await syncIdentity();
      
      return true;
    } catch (err) {
      console.error("Failed to link identity:", err);
      throw err;
    }
  };

  const value = {
    ...identity,
    profile,
    linkIdentity,
    refreshIdentity: syncIdentity
  };

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
};
