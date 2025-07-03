/**
 * Farcaster Integration Service
 * Fetches user data from Farcaster protocol for reputation scoring
 */

export class FarcasterService {
  constructor() {
    this.baseUrl = 'https://api.neynar.com/v2';
    this.apiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || process.env.NEYNAR_API_KEY;
  }

  /**
   * Get user profile by username or FID
   */
  async getUserProfile(identifier) {
    try {
      const isNumeric = /^\d+$/.test(identifier);
      const endpoint = isNumeric 
        ? `${this.baseUrl}/farcaster/user?fid=${identifier}`
        : `${this.baseUrl}/farcaster/user-by-username?username=${identifier}`;

      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'api_key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Farcaster API error: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeUserProfile(data.result?.user || data.result);
    } catch (error) {
      console.error('Error fetching Farcaster profile:', error);
      return null;
    }
  }

  /**
   * Get user's casts (posts) for activity analysis
   */
  async getUserCasts(fid, limit = 100) {
    try {
      const response = await fetch(
        `${this.baseUrl}/farcaster/casts?fid=${fid}&limit=${limit}`,
        {
          headers: {
            'Accept': 'application/json',
            'api_key': this.apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Farcaster API error: ${response.status}`);
      }

      const data = await response.json();
      return data.result?.casts || [];
    } catch (error) {
      console.error('Error fetching Farcaster casts:', error);
      return [];
    }
  }

  /**
   * Get user's followers and following for network analysis
   */
  async getUserConnections(fid) {
    try {
      const [followersResponse, followingResponse] = await Promise.all([
        fetch(`${this.baseUrl}/farcaster/followers?fid=${fid}&limit=1000`, {
          headers: {
            'Accept': 'application/json',
            'api_key': this.apiKey
          }
        }),
        fetch(`${this.baseUrl}/farcaster/following?fid=${fid}&limit=1000`, {
          headers: {
            'Accept': 'application/json',
            'api_key': this.apiKey
          }
        })
      ]);

      const followersData = followersResponse.ok ? await followersResponse.json() : { result: { users: [] } };
      const followingData = followingResponse.ok ? await followingResponse.json() : { result: { users: [] } };

      return {
        followers: followersData.result?.users || [],
        following: followingData.result?.users || [],
        followerCount: followersData.result?.users?.length || 0,
        followingCount: followingData.result?.users?.length || 0
      };
    } catch (error) {
      console.error('Error fetching Farcaster connections:', error);
      return {
        followers: [],
        following: [],
        followerCount: 0,
        followingCount: 0
      };
    }
  }

  /**
   * Calculate Farcaster reputation score
   */
  async calculateReputationScore(identifier) {
    try {
      const profile = await this.getUserProfile(identifier);
      if (!profile) return { score: 0, breakdown: {}, error: 'Profile not found' };

      const casts = await this.getUserCasts(profile.fid);
      const connections = await this.getUserConnections(profile.fid);

      // Calculate various metrics
      const metrics = {
        // Profile completeness (0-100)
        profileCompleteness: this.calculateProfileCompleteness(profile),
        
        // Activity level (0-100)
        activityLevel: this.calculateActivityLevel(casts, profile),
        
        // Network strength (0-100)
        networkStrength: this.calculateNetworkStrength(connections),
        
        // Content quality (0-100)
        contentQuality: this.calculateContentQuality(casts),
        
        // Account age factor (0-100)
        accountAge: this.calculateAccountAge(profile),
        
        // Verification status (0-100)
        verification: profile.verified ? 100 : 0
      };

      // Weighted score calculation
      const weights = {
        profileCompleteness: 0.15,
        activityLevel: 0.25,
        networkStrength: 0.20,
        contentQuality: 0.20,
        accountAge: 0.15,
        verification: 0.05
      };

      const totalScore = Object.keys(metrics).reduce((sum, key) => {
        return sum + (metrics[key] * weights[key]);
      }, 0);

      return {
        score: Math.round(totalScore),
        breakdown: metrics,
        profile: profile,
        rawData: {
          castsCount: casts.length,
          followerCount: connections.followerCount,
          followingCount: connections.followingCount
        }
      };
    } catch (error) {
      console.error('Error calculating Farcaster reputation:', error);
      return { score: 0, breakdown: {}, error: error.message };
    }
  }

  /**
   * Normalize user profile data
   */
  normalizeUserProfile(rawProfile) {
    if (!rawProfile) return null;

    return {
      fid: rawProfile.fid,
      username: rawProfile.username,
      displayName: rawProfile.display_name || rawProfile.displayName,
      bio: rawProfile.profile?.bio?.text || rawProfile.bio,
      pfpUrl: rawProfile.pfp_url || rawProfile.pfp?.url,
      verified: rawProfile.verified || false,
      followerCount: rawProfile.follower_count || 0,
      followingCount: rawProfile.following_count || 0,
      registeredAt: rawProfile.registered_at,
      location: rawProfile.profile?.location?.description,
      website: rawProfile.profile?.website,
      custody: rawProfile.custody_address,
      verifications: rawProfile.verifications || [],
      activeStatus: rawProfile.active_status
    };
  }

  /**
   * Calculate profile completeness score
   */
  calculateProfileCompleteness(profile) {
    let score = 0;
    const checks = [
      profile.displayName ? 20 : 0,
      profile.bio ? 20 : 0,
      profile.pfpUrl ? 20 : 0,
      profile.location ? 15 : 0,
      profile.website ? 15 : 0,
      profile.verifications?.length > 0 ? 10 : 0
    ];
    
    return checks.reduce((sum, points) => sum + points, 0);
  }

  /**
   * Calculate activity level score
   */
  calculateActivityLevel(casts, profile) {
    if (!casts.length) return 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentCasts = casts.filter(cast => 
      new Date(cast.timestamp) > thirtyDaysAgo
    );

    // Score based on recent activity
    const recentActivity = Math.min(recentCasts.length * 2, 60); // Max 60 points
    
    // Consistency bonus (posting regularly)
    const consistency = this.calculateConsistency(casts);
    
    // Engagement factor (likes, recasts, replies)
    const engagement = this.calculateEngagement(casts);
    
    return Math.min(recentActivity + consistency + engagement, 100);
  }

  /**
   * Calculate network strength score
   */
  calculateNetworkStrength(connections) {
    const { followerCount, followingCount } = connections;
    
    // Follower score (logarithmic scale)
    const followerScore = Math.min(Math.log10(followerCount + 1) * 20, 50);
    
    // Following ratio (not following too many compared to followers)
    const ratio = followerCount > 0 ? followingCount / followerCount : 1;
    const ratioScore = ratio < 2 ? 25 : Math.max(25 - (ratio - 2) * 5, 0);
    
    // Network quality (mutual connections, verified followers, etc.)
    const qualityScore = Math.min(followerCount / 10, 25);
    
    return Math.min(followerScore + ratioScore + qualityScore, 100);
  }

  /**
   * Calculate content quality score
   */
  calculateContentQuality(casts) {
    if (!casts.length) return 0;

    let totalScore = 0;
    let validCasts = 0;

    casts.forEach(cast => {
      let castScore = 0;
      
      // Length and substance
      const textLength = cast.text?.length || 0;
      if (textLength > 50) castScore += 20;
      if (textLength > 200) castScore += 10;
      
      // Engagement received
      const likes = cast.reactions?.likes_count || 0;
      const recasts = cast.reactions?.recasts_count || 0;
      const replies = cast.replies?.count || 0;
      
      castScore += Math.min(likes * 2, 30);
      castScore += Math.min(recasts * 5, 25);
      castScore += Math.min(replies * 3, 15);
      
      totalScore += Math.min(castScore, 100);
      validCasts++;
    });

    return validCasts > 0 ? totalScore / validCasts : 0;
  }

  /**
   * Calculate account age score
   */
  calculateAccountAge(profile) {
    if (!profile.registeredAt) return 50; // Default for unknown age
    
    const registrationDate = new Date(profile.registeredAt);
    const now = new Date();
    const ageInDays = (now - registrationDate) / (1000 * 60 * 60 * 24);
    
    // Score increases with age, maxing out at 1 year
    return Math.min((ageInDays / 365) * 100, 100);
  }

  /**
   * Calculate posting consistency
   */
  calculateConsistency(casts) {
    if (casts.length < 7) return 0;
    
    const dates = casts.map(cast => new Date(cast.timestamp).toDateString());
    const uniqueDates = new Set(dates);
    
    // Consistency based on posting on different days
    return Math.min((uniqueDates.size / 30) * 20, 20);
  }

  /**
   * Calculate engagement metrics
   */
  calculateEngagement(casts) {
    if (!casts.length) return 0;
    
    const totalEngagement = casts.reduce((sum, cast) => {
      const likes = cast.reactions?.likes_count || 0;
      const recasts = cast.reactions?.recasts_count || 0;
      const replies = cast.replies?.count || 0;
      return sum + likes + recasts + replies;
    }, 0);
    
    const avgEngagement = totalEngagement / casts.length;
    return Math.min(avgEngagement * 2, 20);
  }

  /**
   * Search for developers by keywords (useful for finding crypto/web3 developers)
   */
  async searchDevelopers(keywords = ['ethereum', 'solidity', 'web3', 'crypto', 'blockchain']) {
    try {
      const results = [];
      
      for (const keyword of keywords) {
        const response = await fetch(
          `${this.baseUrl}/farcaster/casts/search?q=${encodeURIComponent(keyword)}&limit=50`,
          {
            headers: {
              'Accept': 'application/json',
              'api_key': this.apiKey
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const casts = data.result?.casts || [];
          
          // Extract unique users from search results
          const users = casts.map(cast => cast.author).filter(Boolean);
          results.push(...users);
        }
      }

      // Remove duplicates and return top developers
      const uniqueUsers = Array.from(
        new Map(results.map(user => [user.fid, user])).values()
      );

      return uniqueUsers.slice(0, 100);
    } catch (error) {
      console.error('Error searching Farcaster developers:', error);
      return [];
    }
  }
}

export const farcasterService = new FarcasterService();
