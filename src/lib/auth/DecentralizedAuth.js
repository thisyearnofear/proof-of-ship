/**
 * Decentralized Authentication & Credit Check Flow
 * Wallet-first approach with minimal centralized dependencies
 */

import { ethers } from 'ethers';
import { farcasterService } from '../farcasterIntegration';

export class DecentralizedAuthService {
  constructor() {
    this.providers = new Map();
    this.userProfile = null;
    this.creditData = null;
  }

  /**
   * Step 1: Connect Wallet (Primary Identity)
   */
  async connectWallet(provider) {
    try {
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];
      const chainId = await provider.request({ method: 'eth_chainId' });
      
      // Create base profile from wallet
      this.userProfile = {
        address,
        chainId: parseInt(chainId, 16),
        connectedAt: new Date().toISOString(),
        profiles: {
          wallet: { address, verified: true }
        },
        creditScore: 0,
        completionStatus: {
          wallet: true,
          github: false,
          farcaster: false,
          lens: false,
          onchain: false
        }
      };

      // Start on-chain analysis immediately
      await this.analyzeOnChainActivity(address);
      
      return this.userProfile;
    } catch (error) {
      throw new Error(`Wallet connection failed: ${error.message}`);
    }
  }

  /**
   * Step 2: Sign Message for Identity Verification
   */
  async verifyIdentity(provider, address) {
    try {
      const message = this.generateVerificationMessage(address);
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address]
      });

      // Verify signature locally
      const { verifyMessage } = await import('ethers');
      const recoveredAddress = verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Signature verification failed');
      }

      this.userProfile.signature = {
        message,
        signature,
        verified: true,
        timestamp: new Date().toISOString()
      };

      return true;
    } catch (error) {
      throw new Error(`Identity verification failed: ${error.message}`);
    }
  }

  /**
   * Step 3: Connect Social Profiles (Optional but Recommended)
   */
  async connectGitHub() {
    try {
      // Use GitHub OAuth (minimal scope)
      const githubData = await this.authenticateGitHub();
      
      this.userProfile.profiles.github = {
        username: githubData.login,
        id: githubData.id,
        name: githubData.name,
        bio: githubData.bio,
        publicRepos: githubData.public_repos,
        followers: githubData.followers,
        following: githubData.following,
        createdAt: githubData.created_at,
        verified: true
      };

      this.userProfile.completionStatus.github = true;
      
      // Analyze GitHub activity
      await this.analyzeGitHubActivity(githubData.login);
      
      return this.userProfile.profiles.github;
    } catch (error) {
      console.error('GitHub connection failed:', error);
      return null;
    }
  }

  async connectFarcaster(username) {
    try {
      const farcasterData = await farcasterService.calculateReputationScore(username);
      
      if (farcasterData.profile) {
        this.userProfile.profiles.farcaster = {
          ...farcasterData.profile,
          score: farcasterData.score,
          breakdown: farcasterData.breakdown,
          verified: true
        };

        this.userProfile.completionStatus.farcaster = true;
        return this.userProfile.profiles.farcaster;
      }
      
      return null;
    } catch (error) {
      console.error('Farcaster connection failed:', error);
      return null;
    }
  }

  async connectLens(handle) {
    try {
      // Lens Protocol integration would go here
      // For now, using mock data
      const lensData = await this.analyzeLensProfile(handle);
      
      this.userProfile.profiles.lens = {
        handle,
        ...lensData,
        verified: true
      };

      this.userProfile.completionStatus.lens = true;
      return this.userProfile.profiles.lens;
    } catch (error) {
      console.error('Lens connection failed:', error);
      return null;
    }
  }

  /**
   * Step 4: Calculate Comprehensive Credit Score
   */
  async calculateCreditScore() {
    try {
      const scores = {
        github: this.getGitHubScore(),
        farcaster: this.getFarcasterScore(),
        lens: this.getLensScore(),
        onchain: this.getOnChainScore()
      };

      // Weighted calculation
      const weights = {
        github: 0.40,
        farcaster: 0.25,
        lens: 0.15,
        onchain: 0.20
      };

      const totalScore = Math.round(
        Object.keys(scores).reduce((sum, key) => {
          return sum + (scores[key] * weights[key]);
        }, 0)
      );

      this.creditData = {
        totalScore,
        breakdown: scores,
        weights,
        fundingEligible: totalScore >= 400,
        fundingAmount: this.calculateFundingAmount(totalScore),
        completionPercentage: this.getCompletionPercentage(),
        recommendations: this.generateRecommendations(scores),
        calculatedAt: new Date().toISOString()
      };

      this.userProfile.creditScore = totalScore;
      return this.creditData;
    } catch (error) {
      throw new Error(`Credit calculation failed: ${error.message}`);
    }
  }

  /**
   * Step 5: Store Profile Locally (IndexedDB)
   */
  async saveProfileLocally() {
    try {
      const profileData = {
        ...this.userProfile,
        creditData: this.creditData,
        lastUpdated: new Date().toISOString()
      };

      // Store in IndexedDB for offline access
      await this.storeInIndexedDB('userProfile', profileData);
      
      // Also store in localStorage for quick access
      localStorage.setItem('pos_user_profile', JSON.stringify(profileData));
      
      return profileData;
    } catch (error) {
      console.error('Failed to save profile locally:', error);
    }
  }

  /**
   * Load existing profile from local storage
   */
  async loadProfileLocally() {
    try {
      const stored = localStorage.getItem('pos_user_profile');
      if (stored) {
        const profileData = JSON.parse(stored);
        
        // Check if data is recent (less than 24 hours old)
        const lastUpdated = new Date(profileData.lastUpdated);
        const now = new Date();
        const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          this.userProfile = profileData;
          this.creditData = profileData.creditData;
          return profileData;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load profile locally:', error);
      return null;
    }
  }

  // Helper Methods
  generateVerificationMessage(address) {
    const timestamp = Date.now();
    return `Proof of Ship - Verify Identity\n\nAddress: ${address}\nTimestamp: ${timestamp}\n\nBy signing this message, you verify ownership of this wallet address.`;
  }

  async authenticateGitHub() {
    // This would integrate with GitHub OAuth
    // For now, returning mock data
    return new Promise((resolve) => {
      // In production, this would open GitHub OAuth popup
      setTimeout(() => {
        resolve({
          login: 'developer',
          id: 12345,
          name: 'Developer Name',
          bio: 'Building the future',
          public_repos: 25,
          followers: 100,
          following: 50,
          created_at: '2020-01-01T00:00:00Z'
        });
      }, 1000);
    });
  }

  async analyzeOnChainActivity(address) {
    try {
      // This would analyze on-chain activity
      // For now, using mock data
      const onchainData = {
        transactionCount: Math.floor(Math.random() * 500) + 100,
        uniqueContracts: Math.floor(Math.random() * 20) + 5,
        nftHoldings: Math.floor(Math.random() * 10) + 2,
        defiInteractions: Math.floor(Math.random() * 15) + 3,
        firstTransaction: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      this.userProfile.profiles.onchain = {
        address,
        ...onchainData,
        verified: true
      };

      this.userProfile.completionStatus.onchain = true;
      return onchainData;
    } catch (error) {
      console.error('On-chain analysis failed:', error);
    }
  }

  async analyzeGitHubActivity(username) {
    // GitHub API analysis would go here
    // For now, using mock data
    const githubActivity = {
      totalCommits: Math.floor(Math.random() * 1000) + 100,
      contributionStreak: Math.floor(Math.random() * 100) + 10,
      languagesUsed: ['JavaScript', 'Solidity', 'Python'],
      starredRepos: Math.floor(Math.random() * 200) + 50
    };

    this.userProfile.profiles.github = {
      ...this.userProfile.profiles.github,
      activity: githubActivity
    };

    return githubActivity;
  }

  async analyzeLensProfile(handle) {
    // Lens Protocol analysis would go here
    return {
      posts: Math.floor(Math.random() * 100) + 10,
      followers: Math.floor(Math.random() * 500) + 50,
      mirrors: Math.floor(Math.random() * 200) + 20,
      collects: Math.floor(Math.random() * 50) + 5
    };
  }

  // Scoring Methods
  getGitHubScore() {
    const github = this.userProfile?.profiles?.github;
    if (!github) return 0;

    let score = 0;
    score += Math.min(github.publicRepos * 10, 200);
    score += Math.min(github.followers * 2, 150);
    score += github.activity ? Math.min(github.activity.totalCommits * 0.5, 200) : 0;
    
    return Math.min(score, 800);
  }

  getFarcasterScore() {
    const farcaster = this.userProfile?.profiles?.farcaster;
    return farcaster?.score || 0;
  }

  getLensScore() {
    const lens = this.userProfile?.profiles?.lens;
    if (!lens) return 0;

    let score = 0;
    score += Math.min(lens.posts * 5, 150);
    score += Math.min(lens.followers * 1, 100);
    score += Math.min(lens.mirrors * 2, 100);
    
    return Math.min(score, 500);
  }

  getOnChainScore() {
    const onchain = this.userProfile?.profiles?.onchain;
    if (!onchain) return 0;

    let score = 0;
    score += Math.min(onchain.transactionCount * 0.5, 200);
    score += Math.min(onchain.uniqueContracts * 20, 150);
    score += Math.min(onchain.defiInteractions * 15, 100);
    
    return Math.min(score, 600);
  }

  calculateFundingAmount(score) {
    if (score < 400) return 0;
    if (score >= 800) return 5000;
    
    const minFunding = 500;
    const maxFunding = 5000;
    const range = maxFunding - minFunding;
    const scoreRange = 800 - 400;
    const adjustedScore = score - 400;
    
    return Math.floor(minFunding + (range * adjustedScore) / scoreRange);
  }

  getCompletionPercentage() {
    const completed = Object.values(this.userProfile.completionStatus).filter(Boolean).length;
    const total = Object.keys(this.userProfile.completionStatus).length;
    return Math.round((completed / total) * 100);
  }

  generateRecommendations(scores) {
    const recommendations = [];
    
    if (scores.github < 400) {
      recommendations.push({
        type: 'github',
        title: 'Boost GitHub Activity',
        description: 'Contribute to open source projects and maintain consistent commits',
        impact: '+50-150 points',
        priority: 'high'
      });
    }
    
    if (scores.farcaster < 200) {
      recommendations.push({
        type: 'farcaster',
        title: 'Build Farcaster Presence',
        description: 'Share your work and engage with the crypto community',
        impact: '+30-100 points',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  // IndexedDB Storage
  async storeInIndexedDB(key, data) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ProofOfShipDB', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['profiles'], 'readwrite');
        const store = transaction.objectStore('profiles');
        
        store.put({ id: key, data, timestamp: Date.now() });
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
      };
    });
  }
}

export const decentralizedAuth = new DecentralizedAuthService();
