import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { LoadingSpinner } from '../common/LoadingStates';
import { CircularProgress } from '../common/CircularProgress';
import { farcasterService } from '../../lib/farcasterIntegration';
import {
  UserIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export function CreditDashboard({ developer, onScoreUpdate }) {
  const [creditData, setCreditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [farcasterData, setFarcasterData] = useState(null);
  const [loadingFarcaster, setLoadingFarcaster] = useState(false);

  useEffect(() => {
    if (developer) {
      calculateCreditScore();
    }
  }, [developer]);

  const calculateCreditScore = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate GitHub analysis (in production, this would be real API calls)
      const githubScore = await analyzeGitHubActivity(developer.github);
      
      // Analyze Farcaster if username provided
      let farcasterScore = { score: 0, breakdown: {} };
      if (developer.farcaster) {
        setLoadingFarcaster(true);
        farcasterScore = await farcasterService.calculateReputationScore(developer.farcaster);
        setFarcasterData(farcasterScore);
        setLoadingFarcaster(false);
      }

      // Simulate Lens analysis
      const lensScore = await analyzeLensActivity(developer.lens);
      
      // Simulate on-chain analysis
      const onChainScore = await analyzeOnChainActivity(developer.wallet);

      // Calculate weighted credit score
      const weights = {
        github: 0.40,
        farcaster: 0.25,
        lens: 0.15,
        onChain: 0.20
      };

      const totalScore = Math.round(
        (githubScore.score * weights.github) +
        (farcasterScore.score * weights.farcaster) +
        (lensScore.score * weights.lens) +
        (onChainScore.score * weights.onChain)
      );

      const creditData = {
        totalScore,
        breakdown: {
          github: githubScore,
          farcaster: farcasterScore,
          lens: lensScore,
          onChain: onChainScore
        },
        fundingEligible: totalScore >= 400,
        fundingAmount: calculateFundingAmount(totalScore),
        recommendations: generateRecommendations(totalScore, {
          github: githubScore,
          farcaster: farcasterScore,
          lens: lensScore,
          onChain: onChainScore
        })
      };

      setCreditData(creditData);
      onScoreUpdate?.(totalScore, creditData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeGitHubActivity = async (username) => {
    // Mock GitHub analysis - in production, use GitHub API
    return {
      score: Math.floor(Math.random() * 400) + 400, // 400-800
      metrics: {
        totalCommits: Math.floor(Math.random() * 1000) + 100,
        publicRepos: Math.floor(Math.random() * 50) + 10,
        followers: Math.floor(Math.random() * 200) + 20,
        contributions: Math.floor(Math.random() * 365) + 100,
        accountAge: Math.floor(Math.random() * 5) + 1
      },
      strengths: ['Consistent contributor', 'Active in open source'],
      weaknesses: []
    };
  };

  const analyzeLensActivity = async (handle) => {
    // Mock Lens analysis
    return {
      score: Math.floor(Math.random() * 300) + 200, // 200-500
      metrics: {
        posts: Math.floor(Math.random() * 100) + 10,
        followers: Math.floor(Math.random() * 500) + 50,
        mirrors: Math.floor(Math.random() * 200) + 20,
        collects: Math.floor(Math.random() * 50) + 5
      },
      strengths: ['Active social presence'],
      weaknesses: handle ? [] : ['No Lens profile connected']
    };
  };

  const analyzeOnChainActivity = async (address) => {
    // Mock on-chain analysis
    return {
      score: Math.floor(Math.random() * 300) + 300, // 300-600
      metrics: {
        transactionCount: Math.floor(Math.random() * 500) + 100,
        uniqueContracts: Math.floor(Math.random() * 20) + 5,
        nftHoldings: Math.floor(Math.random() * 10) + 2,
        defiInteractions: Math.floor(Math.random() * 15) + 3
      },
      strengths: ['Active on-chain user', 'DeFi participant'],
      weaknesses: []
    };
  };

  const calculateFundingAmount = (score) => {
    if (score < 400) return 0;
    if (score >= 800) return 5000;
    
    const minFunding = 500;
    const maxFunding = 5000;
    const range = maxFunding - minFunding;
    const scoreRange = 800 - 400;
    const adjustedScore = score - 400;
    
    return Math.floor(minFunding + (range * adjustedScore) / scoreRange);
  };

  const generateRecommendations = (totalScore, breakdown) => {
    const recommendations = [];
    
    if (breakdown.github.score < 500) {
      recommendations.push({
        type: 'github',
        title: 'Increase GitHub Activity',
        description: 'Make more commits and contribute to open source projects',
        impact: '+50-100 points'
      });
    }
    
    if (breakdown.farcaster.score < 300) {
      recommendations.push({
        type: 'farcaster',
        title: 'Build Farcaster Presence',
        description: 'Post regularly and engage with the crypto community',
        impact: '+30-80 points'
      });
    }
    
    if (breakdown.lens.score < 200) {
      recommendations.push({
        type: 'lens',
        title: 'Connect Lens Protocol',
        description: 'Create a Lens profile and share your work',
        impact: '+20-60 points'
      });
    }
    
    if (breakdown.onChain.score < 400) {
      recommendations.push({
        type: 'onchain',
        title: 'Increase On-Chain Activity',
        description: 'Interact with DeFi protocols and deploy contracts',
        impact: '+40-100 points'
      });
    }
    
    return recommendations;
  };

  const getScoreColor = (score) => {
    if (score >= 700) return 'text-green-600';
    if (score >= 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score) => {
    if (score >= 750) return 'Excellent';
    if (score >= 650) return 'Good';
    if (score >= 500) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-lg">Analyzing your reputation across platforms...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="flex items-center text-red-600">
          <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
          <span>Error calculating credit score: {error}</span>
        </div>
        <Button onClick={calculateCreditScore} className="mt-4">
          Retry Analysis
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Credit Score */}
      <Card className="p-8">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Developer Credit Score
          </h3>
          <p className="text-gray-600">
            Based on your activity across GitHub, Farcaster, Lens, and on-chain behavior
          </p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <CircularProgress
              value={creditData.totalScore}
              max={850}
              size={200}
              strokeWidth={12}
              className="text-blue-600"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(creditData.totalScore)}`}>
                  {creditData.totalScore}
                </div>
                <div className="text-sm text-gray-600">
                  {getScoreGrade(creditData.totalScore)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Funding Eligibility */}
        <div className={`p-4 rounded-lg border-2 ${
          creditData.fundingEligible 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {creditData.fundingEligible ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            )}
            <div>
              <h4 className={`font-semibold ${
                creditData.fundingEligible ? 'text-green-900' : 'text-red-900'
              }`}>
                {creditData.fundingEligible ? 'Funding Eligible' : 'Not Eligible for Funding'}
              </h4>
              <p className={`text-sm ${
                creditData.fundingEligible ? 'text-green-700' : 'text-red-700'
              }`}>
                {creditData.fundingEligible 
                  ? `You qualify for up to $${creditData.fundingAmount.toLocaleString()} USDC funding`
                  : 'Minimum credit score of 400 required for funding eligibility'
                }
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Score Breakdown */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Score Breakdown
        </h4>
        
        <div className="space-y-4">
          {/* GitHub */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CodeBracketIcon className="w-6 h-6 text-gray-600" />
              <div>
                <h5 className="font-medium text-gray-900">GitHub Activity</h5>
                <p className="text-sm text-gray-600">
                  {creditData.breakdown.github.metrics.totalCommits} commits • 
                  {creditData.breakdown.github.metrics.publicRepos} repos • 
                  {creditData.breakdown.github.metrics.followers} followers
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {creditData.breakdown.github.score}
              </div>
              <div className="text-sm text-gray-500">40% weight</div>
            </div>
          </div>

          {/* Farcaster */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" />
              <div>
                <h5 className="font-medium text-gray-900">
                  Farcaster Reputation
                  {loadingFarcaster && <LoadingSpinner size="sm" className="ml-2" />}
                </h5>
                <p className="text-sm text-gray-600">
                  {farcasterData?.rawData ? (
                    `${farcasterData.rawData.castsCount} casts • ${farcasterData.rawData.followerCount} followers`
                  ) : (
                    developer.farcaster ? 'Analyzing Farcaster activity...' : 'No Farcaster profile connected'
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {creditData.breakdown.farcaster.score}
              </div>
              <div className="text-sm text-gray-500">25% weight</div>
            </div>
          </div>

          {/* Lens */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <GlobeAltIcon className="w-6 h-6 text-green-600" />
              <div>
                <h5 className="font-medium text-gray-900">Lens Protocol</h5>
                <p className="text-sm text-gray-600">
                  {creditData.breakdown.lens.metrics.posts} posts • 
                  {creditData.breakdown.lens.metrics.followers} followers
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {creditData.breakdown.lens.score}
              </div>
              <div className="text-sm text-gray-500">15% weight</div>
            </div>
          </div>

          {/* On-Chain */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <UserIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h5 className="font-medium text-gray-900">On-Chain Activity</h5>
                <p className="text-sm text-gray-600">
                  {creditData.breakdown.onChain.metrics.transactionCount} transactions • 
                  {creditData.breakdown.onChain.metrics.uniqueContracts} contracts
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {creditData.breakdown.onChain.score}
              </div>
              <div className="text-sm text-gray-500">20% weight</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      {creditData.recommendations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <SparklesIcon className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">
              Recommendations to Improve Score
            </h4>
          </div>
          
          <div className="space-y-3">
            {creditData.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-medium text-blue-900">{rec.title}</h5>
                  <p className="text-sm text-blue-700">{rec.description}</p>
                  <span className="text-xs text-blue-600 font-medium">
                    Potential impact: {rec.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Farcaster Profile Details */}
      {farcasterData?.profile && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Farcaster Profile Analysis
          </h4>
          
          <div className="flex items-start space-x-4 mb-4">
            {farcasterData.profile.pfpUrl && (
              <img 
                src={farcasterData.profile.pfpUrl} 
                alt="Profile" 
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h5 className="font-semibold text-gray-900">
                {farcasterData.profile.displayName || farcasterData.profile.username}
              </h5>
              <p className="text-gray-600">@{farcasterData.profile.username}</p>
              {farcasterData.profile.bio && (
                <p className="text-sm text-gray-700 mt-2">{farcasterData.profile.bio}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-900">Profile Score:</span>
              <span className="ml-2">{farcasterData.breakdown.profileCompleteness}/100</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Activity:</span>
              <span className="ml-2">{farcasterData.breakdown.activityLevel}/100</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Network:</span>
              <span className="ml-2">{farcasterData.breakdown.networkStrength}/100</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Content:</span>
              <span className="ml-2">{farcasterData.breakdown.contentQuality}/100</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
