/**
 * Multi-Protocol Credit Scoring Engine
 * Combines GitHub, Farcaster, Lens, and on-chain data for developer creditworthiness
 */

import { socialProtocolService } from './SocialProtocolService';
import { validateProject, validateGitHubData } from '@/schemas/project';
import { errorHandler } from '@/middleware/errorHandler';

class CreditScoringService {
  constructor() {
    this.weights = {
      github: 0.40,        // GitHub activity and code quality
      social: 0.30,        // Farcaster + Lens reputation
      onchain: 0.20,       // On-chain activity and behavior
      identity: 0.10       // Cross-platform identity verification
    };
    
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Main credit scoring method
   */
  async calculateDeveloperCreditScore(profiles) {
    const cacheKey = `credit:${JSON.stringify(profiles)}`;
    
    try {
      // Check cache
      if (this.cache.has(cacheKey)) {
        const { data, timestamp } = this.cache.get(cacheKey);
        if (Date.now() - timestamp < this.cacheTTL) {
          return data;
        }
      }

      const scores = {
        github: { score: 0, details: null, weight: this.weights.github },
        social: { score: 0, details: null, weight: this.weights.social },
        onchain: { score: 0, details: null, weight: this.weights.onchain },
        identity: { score: 0, details: null, weight: this.weights.identity }
      };

      // Calculate GitHub score
      if (profiles.github) {
        scores.github = await this.calculateGitHubScore(profiles.github);
        scores.github.weight = this.weights.github;
      }

      // Calculate social protocol scores
      if (profiles.farcaster || profiles.lens) {
        scores.social = await this.calculateSocialScore(profiles);
        scores.social.weight = this.weights.social;
      }

      // Calculate on-chain score
      if (profiles.wallet) {
        scores.onchain = await this.calculateOnChainScore(profiles.wallet);
        scores.onchain.weight = this.weights.onchain;
      }

      // Calculate identity verification score
      scores.identity = await this.calculateIdentityScore(profiles);
      scores.identity.weight = this.weights.identity;

      // Calculate weighted total
      const totalScore = Object.values(scores).reduce((sum, scoreData) => {
        return sum + (scoreData.score * scoreData.weight);
      }, 0);

      // Determine credit tier and loan eligibility
      const creditTier = this.determineCreditTier(totalScore);
      const loanEligibility = this.calculateLoanEligibility(totalScore, scores);

      const result = {
        totalScore: Math.round(totalScore),
        scores,
        creditTier,
        loanEligibility,
        timestamp: new Date().toISOString(),
        recommendations: this.generateRecommendations(scores)
      };

      // Cache the result
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'calculateDeveloperCreditScore',
        metadata: { profiles }
      });
      
      return {
        totalScore: 0,
        scores: {},
        creditTier: 'UNQUALIFIED',
        loanEligibility: { eligible: false, amount: 0 },
        error: error.message
      };
    }
  }

  /**
   * GitHub reputation scoring
   */
  async calculateGitHubScore(githubData) {
    try {
      const analysis = {
        commitConsistency: this.analyzeCommitConsistency(githubData.commits || []),
        codeQuality: this.analyzeCodeQuality(githubData.issues || [], githubData.prs || []),
        repositoryHealth: this.analyzeRepositoryHealth(githubData.repositories || []),
        openSourceContributions: this.analyzeOpenSourceContributions(githubData),
        communityEngagement: this.analyzeCommunityEngagement(githubData)
      };

      const score = (
        analysis.commitConsistency * 0.25 +
        analysis.codeQuality * 0.25 +
        analysis.repositoryHealth * 0.20 +
        analysis.openSourceContributions * 0.20 +
        analysis.communityEngagement * 0.10
      );

      return {
        score: Math.round(score),
        details: analysis
      };
    } catch (error) {
      errorHandler.handleError(error, { context: 'calculateGitHubScore' });
      return { score: 0, details: null };
    }
  }

  analyzeCommitConsistency(commits) {
    if (!commits || commits.length === 0) return 0;

    // Analyze commit frequency over time
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const recentCommits = commits.filter(commit => {
      const commitDate = new Date(commit.week * 1000);
      return commitDate >= thirtyDaysAgo;
    });

    const quarterlyCommits = commits.filter(commit => {
      const commitDate = new Date(commit.week * 1000);
      return commitDate >= ninetyDaysAgo;
    });

    // Calculate consistency metrics
    const recentTotal = recentCommits.reduce((sum, commit) => sum + commit.total, 0);
    const quarterlyTotal = quarterlyCommits.reduce((sum, commit) => sum + commit.total, 0);
    const avgWeeklyCommits = quarterlyCommits.length > 0 ? quarterlyTotal / quarterlyCommits.length : 0;

    // Score based on consistency and volume
    let score = 0;
    
    // Recent activity (40% weight)
    if (recentTotal > 50) score += 40;
    else if (recentTotal > 20) score += 30;
    else if (recentTotal > 5) score += 20;
    else if (recentTotal > 0) score += 10;

    // Long-term consistency (40% weight)
    if (avgWeeklyCommits > 10) score += 40;
    else if (avgWeeklyCommits > 5) score += 30;
    else if (avgWeeklyCommits > 2) score += 20;
    else if (avgWeeklyCommits > 0) score += 10;

    // Consistency pattern (20% weight)
    const consistency = this.calculateCommitConsistencyPattern(commits);
    score += consistency * 0.2;

    return Math.min(score, 100);
  }

  calculateCommitConsistencyPattern(commits) {
    if (commits.length < 4) return 0;

    // Calculate standard deviation of commit frequency
    const totals = commits.map(commit => commit.total);
    const mean = totals.reduce((sum, total) => sum + total, 0) / totals.length;
    const variance = totals.reduce((sum, total) => sum + Math.pow(total - mean, 2), 0) / totals.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = more consistent = higher score
    const consistencyScore = Math.max(0, 100 - (stdDev / mean * 100));
    return Math.min(consistencyScore, 100);
  }

  analyzeCodeQuality(issues, prs) {
    let score = 0;

    // Issue resolution rate (30% weight)
    const closedIssues = issues.filter(issue => issue.state === 'closed').length;
    const issueResolutionRate = issues.length > 0 ? closedIssues / issues.length : 0;
    score += issueResolutionRate * 30;

    // PR success rate (40% weight)
    const mergedPRs = prs.filter(pr => pr.merged_at).length;
    const prSuccessRate = prs.length > 0 ? mergedPRs / prs.length : 0;
    score += prSuccessRate * 40;

    // PR quality indicators (30% weight)
    let qualityScore = 0;
    prs.forEach(pr => {
      // PRs with descriptions get bonus
      if (pr.body && pr.body.length > 100) qualityScore += 2;
      
      // PRs with multiple commits show thoughtful development
      if (pr.commits > 1 && pr.commits < 20) qualityScore += 1;
      
      // Recent PRs show activity
      const prDate = new Date(pr.created_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (prDate >= thirtyDaysAgo) qualityScore += 1;
    });
    
    const avgQualityScore = prs.length > 0 ? qualityScore / prs.length : 0;
    score += Math.min(avgQualityScore * 7.5, 30); // Scale to 30 max

    return Math.min(score, 100);
  }

  analyzeRepositoryHealth(repositories) {
    if (!repositories || repositories.length === 0) return 0;

    let score = 0;
    let totalRepos = repositories.length;

    repositories.forEach(repo => {
      let repoScore = 0;

      // Repository activity
      if (repo.updated_at) {
        const lastUpdate = new Date(repo.updated_at);
        const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate < 30) repoScore += 20;
        else if (daysSinceUpdate < 90) repoScore += 15;
        else if (daysSinceUpdate < 180) repoScore += 10;
      }

      // Repository quality indicators
      if (repo.description && repo.description.length > 20) repoScore += 10;
      if (repo.has_readme) repoScore += 10;
      if (repo.license) repoScore += 10;
      if (repo.topics && repo.topics.length > 0) repoScore += 5;

      // Community engagement
      if (repo.stargazers_count > 10) repoScore += 15;
      else if (repo.stargazers_count > 5) repoScore += 10;
      else if (repo.stargazers_count > 0) repoScore += 5;

      if (repo.forks_count > 5) repoScore += 10;
      else if (repo.forks_count > 0) repoScore += 5;

      // Open source bonus
      if (!repo.private) repoScore += 20;

      score += Math.min(repoScore, 100);
    });

    return Math.min(score / totalRepos, 100);
  }

  analyzeOpenSourceContributions(githubData) {
    let score = 0;

    // Public repositories count
    const publicRepos = githubData.public_repos || 0;
    score += Math.min(publicRepos * 2, 40);

    // Contribution activity
    if (githubData.contributions) {
      const totalContributions = githubData.contributions.total || 0;
      score += Math.min(totalContributions / 10, 30);
    }

    // Follower/following ratio (community recognition)
    const followers = githubData.followers || 0;
    const following = githubData.following || 1;
    const ratio = followers / following;
    
    if (ratio > 2) score += 20;
    else if (ratio > 1) score += 15;
    else if (ratio > 0.5) score += 10;

    // Account age and activity
    if (githubData.created_at) {
      const accountAge = (Date.now() - new Date(githubData.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (accountAge > 3) score += 10;
      else if (accountAge > 1) score += 5;
    }

    return Math.min(score, 100);
  }

  analyzeCommunityEngagement(githubData) {
    let score = 0;

    // Social metrics
    const followers = githubData.followers || 0;
    score += Math.min(followers, 50);

    // Organizations membership
    if (githubData.organizations && githubData.organizations.length > 0) {
      score += Math.min(githubData.organizations.length * 10, 30);
    }

    // Gists (knowledge sharing)
    if (githubData.public_gists > 0) {
      score += Math.min(githubData.public_gists * 2, 20);
    }

    return Math.min(score, 100);
  }

  /**
   * Social protocol scoring
   */
  async calculateSocialScore(profiles) {
    try {
      let farcasterScore = 0;
      let lensScore = 0;
      let combinedWeight = 0;

      // Get Farcaster reputation
      if (profiles.farcaster) {
        const farcasterRep = await socialProtocolService.analyzeFarcasterReputation(profiles.farcaster);
        farcasterScore = farcasterRep.score;
        combinedWeight += 0.6; // Farcaster gets 60% of social weight
      }

      // Get Lens reputation
      if (profiles.lens) {
        const lensRep = await socialProtocolService.analyzeLensReputation(profiles.lens);
        lensScore = lensRep.score;
        combinedWeight += 0.4; // Lens gets 40% of social weight
      }

      // Calculate weighted average
      const totalScore = profiles.farcaster && profiles.lens 
        ? (farcasterScore * 0.6 + lensScore * 0.4)
        : profiles.farcaster 
          ? farcasterScore 
          : lensScore;

      return {
        score: Math.round(totalScore),
        details: {
          farcasterScore,
          lensScore,
          hasMultiPlatformPresence: !!(profiles.farcaster && profiles.lens)
        }
      };
    } catch (error) {
      errorHandler.handleError(error, { context: 'calculateSocialScore' });
      return { score: 0, details: null };
    }
  }

  /**
   * On-chain activity scoring
   */
  async calculateOnChainScore(walletAddress) {
    try {
      // This would integrate with various blockchain APIs
      // For now, implementing basic structure
      
      const analysis = {
        transactionHistory: await this.analyzeTransactionHistory(walletAddress),
        contractInteractions: await this.analyzeContractInteractions(walletAddress),
        defiActivity: await this.analyzeDefiActivity(walletAddress),
        nftActivity: await this.analyzeNftActivity(walletAddress),
        multiChainActivity: await this.analyzeMultiChainActivity(walletAddress)
      };

      const score = (
        analysis.transactionHistory * 0.25 +
        analysis.contractInteractions * 0.30 +
        analysis.defiActivity * 0.20 +
        analysis.nftActivity * 0.10 +
        analysis.multiChainActivity * 0.15
      );

      return {
        score: Math.round(score),
        details: analysis
      };
    } catch (error) {
      errorHandler.handleError(error, { context: 'calculateOnChainScore' });
      return { score: 0, details: null };
    }
  }

  async analyzeTransactionHistory(walletAddress) {
    // Placeholder for transaction analysis
    // Would integrate with Etherscan, Alchemy, or similar APIs
    return 50; // Base score for having a wallet
  }

  async analyzeContractInteractions(walletAddress) {
    // Placeholder for contract interaction analysis
    // Would analyze smart contract deployments and interactions
    return 60; // Base score
  }

  async analyzeDefiActivity(walletAddress) {
    // Placeholder for DeFi protocol interaction analysis
    return 40; // Base score
  }

  async analyzeNftActivity(walletAddress) {
    // Placeholder for NFT activity analysis
    return 30; // Base score
  }

  async analyzeMultiChainActivity(walletAddress) {
    // Placeholder for multi-chain activity analysis
    return 45; // Base score
  }

  /**
   * Identity verification scoring
   */
  async calculateIdentityScore(profiles) {
    try {
      const verification = await socialProtocolService.verifyIdentityConsistency(profiles);
      
      return {
        score: verification.consistencyScore,
        details: verification
      };
    } catch (error) {
      errorHandler.handleError(error, { context: 'calculateIdentityScore' });
      return { score: 0, details: null };
    }
  }

  /**
   * Credit tier determination
   */
  determineCreditTier(totalScore) {
    if (totalScore >= 85) return 'PREMIUM';
    if (totalScore >= 70) return 'EXCELLENT';
    if (totalScore >= 55) return 'GOOD';
    if (totalScore >= 40) return 'FAIR';
    if (totalScore >= 25) return 'LIMITED';
    return 'UNQUALIFIED';
  }

  /**
   * Loan eligibility calculation
   */
  calculateLoanEligibility(totalScore, scores) {
    const tiers = {
      PREMIUM: { baseAmount: 5000, multiplier: 1.0 },
      EXCELLENT: { baseAmount: 3500, multiplier: 0.9 },
      GOOD: { baseAmount: 2000, multiplier: 0.8 },
      FAIR: { baseAmount: 1000, multiplier: 0.7 },
      LIMITED: { baseAmount: 500, multiplier: 0.6 },
      UNQUALIFIED: { baseAmount: 0, multiplier: 0 }
    };

    const tier = this.determineCreditTier(totalScore);
    const tierInfo = tiers[tier];

    if (!tierInfo || tierInfo.baseAmount === 0) {
      return {
        eligible: false,
        amount: 0,
        tier,
        requirements: this.getImprovementRequirements(scores)
      };
    }

    // Apply bonuses and penalties
    let finalAmount = tierInfo.baseAmount;

    // GitHub consistency bonus
    if (scores.github?.score > 80) {
      finalAmount *= 1.1;
    }

    // Multi-platform social presence bonus
    if (scores.social?.details?.hasMultiPlatformPresence) {
      finalAmount *= 1.05;
    }

    // Identity verification bonus
    if (scores.identity?.score > 85) {
      finalAmount *= 1.05;
    }

    return {
      eligible: true,
      amount: Math.round(finalAmount),
      tier,
      interestRate: this.calculateInterestRate(tier),
      repaymentTerms: this.getRepaymentTerms(tier),
      conditions: this.getLoanConditions(tier)
    };
  }

  calculateInterestRate(tier) {
    const rates = {
      PREMIUM: 0,      // 0% interest for top tier
      EXCELLENT: 2,    // 2% APR
      GOOD: 5,         // 5% APR
      FAIR: 8,         // 8% APR
      LIMITED: 12,     // 12% APR
    };
    
    return rates[tier] || 15;
  }

  getRepaymentTerms(tier) {
    const terms = {
      PREMIUM: '6 months, hackathon may cover',
      EXCELLENT: '6 months, hackathon may cover',
      GOOD: '4 months, partial hackathon coverage',
      FAIR: '3 months, limited hackathon coverage',
      LIMITED: '2 months, no hackathon coverage'
    };
    
    return terms[tier] || 'Standard terms apply';
  }

  getLoanConditions(tier) {
    const baseConditions = [
      'Maintain open-source commitment',
      'Regular progress updates',
      'Use approved development tools'
    ];

    const tierConditions = {
      PREMIUM: [...baseConditions, 'Mentorship opportunities available'],
      EXCELLENT: [...baseConditions, 'Priority support access'],
      GOOD: [...baseConditions, 'Monthly check-ins required'],
      FAIR: [...baseConditions, 'Bi-weekly progress reports', 'Code review requirements'],
      LIMITED: [...baseConditions, 'Weekly progress reports', 'Mandatory code reviews', 'Escrow milestone releases']
    };

    return tierConditions[tier] || baseConditions;
  }

  getImprovementRequirements(scores) {
    const requirements = [];

    if (!scores.github || scores.github.score < 50) {
      requirements.push('Increase GitHub activity and code quality');
    }

    if (!scores.social || scores.social.score < 30) {
      requirements.push('Build social presence on Farcaster or Lens');
    }

    if (!scores.onchain || scores.onchain.score < 40) {
      requirements.push('Increase on-chain activity and smart contract interactions');
    }

    if (!scores.identity || scores.identity.score < 60) {
      requirements.push('Verify identity consistency across platforms');
    }

    return requirements;
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(scores) {
    const recommendations = [];

    // GitHub recommendations
    if (scores.github?.score < 70) {
      recommendations.push({
        category: 'GitHub',
        priority: 'high',
        action: 'Increase commit frequency and maintain consistent coding activity',
        impact: '+10-15 credit score points'
      });
    }

    // Social recommendations
    if (scores.social?.score < 50) {
      recommendations.push({
        category: 'Social',
        priority: 'medium',
        action: 'Build presence on Farcaster and Lens protocols',
        impact: '+8-12 credit score points'
      });
    }

    // On-chain recommendations
    if (scores.onchain?.score < 60) {
      recommendations.push({
        category: 'On-Chain',
        priority: 'medium',
        action: 'Deploy smart contracts and interact with DeFi protocols',
        impact: '+5-10 credit score points'
      });
    }

    // Identity recommendations
    if (scores.identity?.score < 80) {
      recommendations.push({
        category: 'Identity',
        priority: 'low',
        action: 'Ensure consistent naming and information across all platforms',
        impact: '+3-5 credit score points'
      });
    }

    return recommendations;
  }

  /**
   * Utility methods
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
export const creditScoringService = new CreditScoringService();

// React hook for credit scoring
import { useState, useEffect } from 'react';

export const useCreditScore = (profiles) => {
  const [creditData, setCreditData] = useState({
    loading: true,
    error: null,
    totalScore: 0,
    scores: {},
    creditTier: 'UNQUALIFIED',
    loanEligibility: { eligible: false, amount: 0 }
  });

  useEffect(() => {
    async function calculateCredit() {
      if (!profiles) return;

      setCreditData(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await creditScoringService.calculateDeveloperCreditScore(profiles);
        setCreditData({
          loading: false,
          error: null,
          ...result
        });
      } catch (error) {
        setCreditData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    }

    calculateCredit();
  }, [profiles]);

  return creditData;
};

export default CreditScoringService;
