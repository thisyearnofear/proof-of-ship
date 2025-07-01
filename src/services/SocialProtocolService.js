/**
 * Social Protocol Integration Service
 * Handles Farcaster and Lens protocol data fetching and reputation scoring
 */

import { errorHandler } from '@/middleware/errorHandler';

class SocialProtocolService {
  constructor() {
    this.farcasterApiUrl = 'https://api.warpcast.com/v2';
    this.lensApiUrl = 'https://api-v2.lens.dev';
    this.cache = new Map();
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * FARCASTER INTEGRATION
   */
  
  async getFarcasterProfile(username) {
    const cacheKey = `farcaster:${username}`;
    
    try {
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const { data, timestamp } = this.cache.get(cacheKey);
        if (Date.now() - timestamp < this.cacheTTL) {
          return data;
        }
      }

      // Fetch user profile
      const userResponse = await fetch(`${this.farcasterApiUrl}/user-by-username?username=${username}`);
      if (!userResponse.ok) {
        throw new Error(`Farcaster API error: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      
      if (!userData.result?.user) {
        throw new Error('Farcaster user not found');
      }

      const user = userData.result.user;
      
      // Fetch user's casts and engagement
      const castsResponse = await fetch(`${this.farcasterApiUrl}/casts?fid=${user.fid}&limit=100`);
      const castsData = castsResponse.ok ? await castsResponse.json() : { result: { casts: [] } };
      
      // Fetch followers
      const followersResponse = await fetch(`${this.farcasterApiUrl}/followers?fid=${user.fid}&limit=100`);
      const followersData = followersResponse.ok ? await followersResponse.json() : { result: { users: [] } };

      const profile = {
        fid: user.fid,
        username: user.username,
        displayName: user.displayName,
        bio: user.profile?.bio?.text || '',
        followerCount: user.followerCount || 0,
        followingCount: user.followingCount || 0,
        verifications: user.verifications || [],
        pfpUrl: user.pfp?.url,
        casts: castsData.result?.casts || [],
        followers: followersData.result?.users || [],
        fetchedAt: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, { data: profile, timestamp: Date.now() });
      
      return profile;
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'getFarcasterProfile',
        metadata: { username }
      });
      return null;
    }
  }

  async analyzeFarcasterReputation(username) {
    try {
      const profile = await this.getFarcasterProfile(username);
      if (!profile) return { score: 0, details: null };

      const analysis = {
        // Follower quality (30% weight)
        followerScore: this.calculateFollowerScore(profile),
        
        // Engagement rate (25% weight) 
        engagementScore: this.calculateEngagementScore(profile),
        
        // Content quality (20% weight)
        contentScore: this.calculateContentScore(profile),
        
        // Network connections (15% weight)
        networkScore: this.calculateNetworkScore(profile),
        
        // Account authenticity (10% weight)
        authenticityScore: this.calculateAuthenticityScore(profile)
      };

      const totalScore = (
        analysis.followerScore * 0.3 +
        analysis.engagementScore * 0.25 +
        analysis.contentScore * 0.2 +
        analysis.networkScore * 0.15 +
        analysis.authenticityScore * 0.1
      );

      return {
        score: Math.round(totalScore),
        details: analysis,
        profile: {
          username: profile.username,
          displayName: profile.displayName,
          followerCount: profile.followerCount,
          verifications: profile.verifications
        }
      };
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'analyzeFarcasterReputation',
        metadata: { username }
      });
      return { score: 0, details: null };
    }
  }

  /**
   * LENS PROTOCOL INTEGRATION
   */
  
  async getLensProfile(handle) {
    const cacheKey = `lens:${handle}`;
    
    try {
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const { data, timestamp } = this.cache.get(cacheKey);
        if (Date.now() - timestamp < this.cacheTTL) {
          return data;
        }
      }

      // GraphQL query for Lens profile
      const query = `
        query Profile($handle: Handle!) {
          profile(request: { handle: $handle }) {
            id
            handle
            name
            bio
            stats {
              followers
              following
              posts
              comments
              mirrors
              publications
            }
            picture {
              ... on NftImage {
                contractAddress
                tokenId
                uri
                verified
              }
              ... on MediaSet {
                original {
                  url
                  mimeType
                }
              }
            }
            coverPicture {
              ... on MediaSet {
                original {
                  url
                  mimeType
                }
              }
            }
            ownedBy
            isFollowedByMe
            attributes {
              key
              value
            }
          }
        }
      `;

      const response = await fetch(this.lensApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { handle }
        })
      });

      if (!response.ok) {
        throw new Error(`Lens API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`Lens GraphQL error: ${data.errors[0].message}`);
      }

      const profile = data.data?.profile;
      if (!profile) {
        throw new Error('Lens profile not found');
      }

      // Fetch recent publications
      const publicationsQuery = `
        query Publications($profileId: ProfileId!) {
          publications(request: { profileId: $profileId, limit: 50 }) {
            items {
              ... on Post {
                id
                stats {
                  totalAmountOfMirrors
                  totalAmountOfCollects
                  totalAmountOfComments
                  totalUpvotes
                }
                createdAt
                metadata {
                  content
                  attributes {
                    key
                    value
                  }
                }
              }
            }
          }
        }
      `;

      const publicationsResponse = await fetch(this.lensApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: publicationsQuery,
          variables: { profileId: profile.id }
        })
      });

      const publicationsData = publicationsResponse.ok ? 
        await publicationsResponse.json() : { data: { publications: { items: [] } } };

      const enrichedProfile = {
        ...profile,
        publications: publicationsData.data?.publications?.items || [],
        fetchedAt: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, { data: enrichedProfile, timestamp: Date.now() });
      
      return enrichedProfile;
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'getLensProfile',
        metadata: { handle }
      });
      return null;
    }
  }

  async analyzeLensReputation(handle) {
    try {
      const profile = await this.getLensProfile(handle);
      if (!profile) return { score: 0, details: null };

      const analysis = {
        // Professional network (35% weight)
        networkScore: this.calculateLensNetworkScore(profile),
        
        // Content quality and engagement (30% weight)
        contentScore: this.calculateLensContentScore(profile),
        
        // Profile completeness (20% weight)
        profileScore: this.calculateLensProfileScore(profile),
        
        // Community contributions (15% weight)
        contributionScore: this.calculateLensContributionScore(profile)
      };

      const totalScore = (
        analysis.networkScore * 0.35 +
        analysis.contentScore * 0.3 +
        analysis.profileScore * 0.2 +
        analysis.contributionScore * 0.15
      );

      return {
        score: Math.round(totalScore),
        details: analysis,
        profile: {
          handle: profile.handle,
          name: profile.name,
          stats: profile.stats,
          ownedBy: profile.ownedBy
        }
      };
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'analyzeLensReputation',
        metadata: { handle }
      });
      return { score: 0, details: null };
    }
  }

  /**
   * FARCASTER SCORING METHODS
   */
  
  calculateFollowerScore(profile) {
    const followerCount = profile.followerCount || 0;
    const followingCount = profile.followingCount || 1; // Avoid division by zero
    
    // Quality over quantity - ratio matters
    const ratio = followerCount / followingCount;
    const baseScore = Math.min(followerCount / 1000 * 50, 50); // Max 50 for 1k+ followers
    const ratioBonus = Math.min(ratio * 10, 30); // Max 30 bonus for good ratio
    
    return Math.min(baseScore + ratioBonus, 100);
  }

  calculateEngagementScore(profile) {
    if (!profile.casts || profile.casts.length === 0) return 0;
    
    const totalEngagement = profile.casts.reduce((sum, cast) => {
      const likes = cast.reactions?.count || 0;
      const recasts = cast.replies?.count || 0;
      const replies = cast.recasts?.count || 0;
      return sum + likes + recasts + replies;
    }, 0);
    
    const avgEngagement = totalEngagement / profile.casts.length;
    return Math.min(avgEngagement * 5, 100); // Scale engagement
  }

  calculateContentScore(profile) {
    if (!profile.casts || profile.casts.length === 0) return 0;
    
    let qualityScore = 0;
    const devKeywords = ['code', 'developer', 'programming', 'blockchain', 'smart contract', 'web3', 'defi'];
    
    profile.casts.forEach(cast => {
      const text = cast.text?.toLowerCase() || '';
      const hasDevContent = devKeywords.some(keyword => text.includes(keyword));
      const hasLinks = text.includes('http') || text.includes('github');
      const isLongForm = text.length > 100;
      
      if (hasDevContent) qualityScore += 20;
      if (hasLinks) qualityScore += 15;
      if (isLongForm) qualityScore += 10;
    });
    
    return Math.min(qualityScore / profile.casts.length * 2, 100);
  }

  calculateNetworkScore(profile) {
    // Verified accounts and connections to known developers
    let score = 0;
    
    if (profile.verifications && profile.verifications.length > 0) {
      score += 30; // Verified accounts get bonus
    }
    
    // Network quality based on follower/following ratio
    const ratio = (profile.followerCount || 0) / Math.max(profile.followingCount || 1, 1);
    if (ratio > 2) score += 20;
    else if (ratio > 1) score += 10;
    
    return Math.min(score, 100);
  }

  calculateAuthenticityScore(profile) {
    let score = 50; // Base score
    
    // Account age (if available)
    if (profile.verifications && profile.verifications.length > 0) {
      score += 25;
    }
    
    // Profile completeness
    if (profile.bio && profile.bio.length > 20) score += 15;
    if (profile.pfpUrl) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * LENS SCORING METHODS
   */
  
  calculateLensNetworkScore(profile) {
    const stats = profile.stats || {};
    const followers = stats.followers || 0;
    const following = stats.following || 1;
    
    const ratio = followers / following;
    const baseScore = Math.min(followers / 500 * 40, 40); // Max 40 for 500+ followers
    const ratioBonus = Math.min(ratio * 15, 35); // Max 35 for good ratio
    
    return Math.min(baseScore + ratioBonus, 100);
  }

  calculateLensContentScore(profile) {
    const stats = profile.stats || {};
    const publications = stats.publications || 0;
    const posts = stats.posts || 0;
    
    if (publications === 0) return 0;
    
    let score = 0;
    
    // Content volume
    score += Math.min(publications * 2, 40);
    
    // Engagement analysis from recent publications
    if (profile.publications && profile.publications.length > 0) {
      const avgEngagement = profile.publications.reduce((sum, pub) => {
        const pubStats = pub.stats || {};
        return sum + (pubStats.totalAmountOfMirrors || 0) + 
                     (pubStats.totalAmountOfCollects || 0) + 
                     (pubStats.totalAmountOfComments || 0) +
                     (pubStats.totalUpvotes || 0);
      }, 0) / profile.publications.length;
      
      score += Math.min(avgEngagement * 3, 40);
    }
    
    return Math.min(score, 100);
  }

  calculateLensProfileScore(profile) {
    let score = 0;
    
    // Profile completeness
    if (profile.name && profile.name.length > 2) score += 20;
    if (profile.bio && profile.bio.length > 50) score += 25;
    if (profile.picture) score += 15;
    if (profile.coverPicture) score += 10;
    
    // Attributes and metadata
    if (profile.attributes && profile.attributes.length > 0) {
      score += Math.min(profile.attributes.length * 5, 30);
    }
    
    return Math.min(score, 100);
  }

  calculateLensContributionScore(profile) {
    const stats = profile.stats || {};
    const comments = stats.comments || 0;
    const mirrors = stats.mirrors || 0;
    
    // Community engagement
    let score = 0;
    score += Math.min(comments * 1.5, 50);
    score += Math.min(mirrors * 2, 30);
    
    // Quality engagement from publications analysis
    if (profile.publications) {
      const techContent = profile.publications.filter(pub => {
        const content = pub.metadata?.content?.toLowerCase() || '';
        return content.includes('developer') || 
               content.includes('code') || 
               content.includes('blockchain') ||
               content.includes('web3');
      }).length;
      
      score += Math.min(techContent * 4, 20);
    }
    
    return Math.min(score, 100);
  }

  /**
   * CROSS-PLATFORM IDENTITY VERIFICATION
   */
  
  async verifyIdentityConsistency(profiles) {
    const { github, farcaster, lens, wallet } = profiles;
    
    let consistencyScore = 0;
    const verifications = [];
    
    // Name/username consistency
    if (github && farcaster) {
      const nameMatch = this.fuzzyMatch(github.name || github.login, farcaster.displayName || farcaster.username);
      if (nameMatch > 0.7) {
        consistencyScore += 25;
        verifications.push('github_farcaster_name_match');
      }
    }
    
    if (github && lens) {
      const nameMatch = this.fuzzyMatch(github.name || github.login, lens.name || lens.handle);
      if (nameMatch > 0.7) {
        consistencyScore += 25;
        verifications.push('github_lens_name_match');
      }
    }
    
    // Bio/description consistency
    if (farcaster && lens) {
      const bioMatch = this.fuzzyMatch(farcaster.bio || '', lens.bio || '');
      if (bioMatch > 0.5) {
        consistencyScore += 20;
        verifications.push('farcaster_lens_bio_match');
      }
    }
    
    // Wallet verification
    if (wallet && lens && lens.ownedBy.toLowerCase() === wallet.toLowerCase()) {
      consistencyScore += 30;
      verifications.push('lens_wallet_verified');
    }
    
    return {
      consistencyScore: Math.min(consistencyScore, 100),
      verifications,
      identityRisk: consistencyScore < 50 ? 'high' : consistencyScore < 80 ? 'medium' : 'low'
    };
  }

  fuzzyMatch(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    // Simple similarity check
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * UTILITY METHODS
   */
  
  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
export const socialProtocolService = new SocialProtocolService();

// React hook for using the social protocol service
import { useState, useEffect } from 'react';

export const useSocialReputation = (profiles) => {
  const [reputation, setReputation] = useState({
    farcaster: { score: 0, loading: false, error: null },
    lens: { score: 0, loading: false, error: null },
    identity: { score: 0, loading: false, error: null }
  });

  useEffect(() => {
    async function loadReputation() {
      if (!profiles) return;

      // Load Farcaster reputation
      if (profiles.farcaster) {
        setReputation(prev => ({ 
          ...prev, 
          farcaster: { ...prev.farcaster, loading: true } 
        }));
        
        try {
          const farcasterRep = await socialProtocolService.analyzeFarcasterReputation(profiles.farcaster);
          setReputation(prev => ({ 
            ...prev, 
            farcaster: { score: farcasterRep.score, loading: false, error: null, details: farcasterRep.details } 
          }));
        } catch (error) {
          setReputation(prev => ({ 
            ...prev, 
            farcaster: { score: 0, loading: false, error: error.message } 
          }));
        }
      }

      // Load Lens reputation
      if (profiles.lens) {
        setReputation(prev => ({ 
          ...prev, 
          lens: { ...prev.lens, loading: true } 
        }));
        
        try {
          const lensRep = await socialProtocolService.analyzeLensReputation(profiles.lens);
          setReputation(prev => ({ 
            ...prev, 
            lens: { score: lensRep.score, loading: false, error: null, details: lensRep.details } 
          }));
        } catch (error) {
          setReputation(prev => ({ 
            ...prev, 
            lens: { score: 0, loading: false, error: error.message } 
          }));
        }
      }

      // Verify identity consistency
      if (profiles.github || profiles.farcaster || profiles.lens) {
        setReputation(prev => ({ 
          ...prev, 
          identity: { ...prev.identity, loading: true } 
        }));
        
        try {
          const identityVerification = await socialProtocolService.verifyIdentityConsistency(profiles);
          setReputation(prev => ({ 
            ...prev, 
            identity: { 
              score: identityVerification.consistencyScore, 
              loading: false, 
              error: null, 
              details: identityVerification 
            } 
          }));
        } catch (error) {
          setReputation(prev => ({ 
            ...prev, 
            identity: { score: 0, loading: false, error: error.message } 
          }));
        }
      }
    }

    loadReputation();
  }, [profiles]);

  return reputation;
};

export default SocialProtocolService;
