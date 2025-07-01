/**
 * Credit Dashboard - Main interface for developer credit scoring
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import StatCard from '@/components/common/cards/StatCard';
import { useCreditScore } from '@/services/CreditScoringService';
import { useSocialReputation } from '@/services/SocialProtocolService';
import { LoadingSpinner, ErrorState } from '@/components/common/LoadingStates';

const CreditDashboard = ({ developer, onCreditScoreUpdate }) => {
  const [profiles, setProfiles] = useState({
    github: developer?.github,
    farcaster: developer?.farcaster,
    lens: developer?.lens,
    wallet: developer?.wallet
  });

  const creditData = useCreditScore(profiles);
  const socialReputation = useSocialReputation(profiles);

  // Call the callback when credit data is available
  useEffect(() => {
    if (creditData && !creditData.loading && !creditData.error && onCreditScoreUpdate) {
      onCreditScoreUpdate(creditData.totalScore, creditData);
    }
  }, [creditData, onCreditScoreUpdate]);

  if (creditData.loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Analyzing your developer reputation...</p>
        </div>
      </div>
    );
  }

  if (creditData.error) {
    return (
      <ErrorState 
        error={creditData.error}
        title="Credit Analysis Failed"
        description="We couldn't analyze your credit score. Please try again."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Developer Credit Score</h1>
            <p className="text-blue-100">
              AI-powered creditworthiness based on your development activity
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{creditData.totalScore}</div>
            <div className="text-lg text-blue-100">out of 100</div>
          </div>
        </div>
      </div>

      {/* Credit Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Credit Score"
          value={`${creditData.totalScore}/100`}
          icon={<CreditCardIcon />}
          trend={creditData.totalScore >= 70 ? `${creditData.creditTier} Tier` : ""}
        />
        
        <StatCard 
          title="Eligible Funding"
          value={creditData.loanEligibility.eligible 
            ? `$${creditData.loanEligibility.amount.toLocaleString()} USDC`
            : "Not Eligible"
          }
          icon={<BanknotesIcon />}
          link={creditData.loanEligibility.eligible ? "/request-funding" : null}
          placeholder={!creditData.loanEligibility.eligible}
        />
        
        <StatCard 
          title="Credit Tier"
          value={creditData.creditTier}
          icon={<ChartBarIcon />}
          trend={creditData.loanEligibility.interestRate ? `${creditData.loanEligibility.interestRate}% APR` : ""}
        />
        
        <StatCard 
          title="Identity Verified"
          value={creditData.scores.identity?.score > 80 ? "Verified" : "Pending"}
          icon={creditData.scores.identity?.score > 80 ? <CheckCircleIcon /> : <ClockIcon />}
          placeholder={creditData.scores.identity?.score <= 80}
        />
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CreditScoreBreakdown creditData={creditData} />
        <SocialReputationCard socialReputation={socialReputation} />
      </div>

      {/* Loan Eligibility Details */}
      {creditData.loanEligibility.eligible && (
        <LoanEligibilityCard loanData={creditData.loanEligibility} />
      )}

      {/* Improvement Recommendations */}
      {creditData.recommendations && creditData.recommendations.length > 0 && (
        <RecommendationsCard recommendations={creditData.recommendations} />
      )}

      {/* Platform Integration Status */}
      <PlatformIntegrationStatus profiles={profiles} />
    </div>
  );
};

const CreditScoreBreakdown = ({ creditData }) => {
  const scoreComponents = [
    {
      name: 'GitHub Activity',
      score: creditData.scores.github?.score || 0,
      weight: creditData.scores.github?.weight || 0.4,
      color: 'bg-green-500',
      icon: '👨‍💻'
    },
    {
      name: 'Social Reputation',
      score: creditData.scores.social?.score || 0,
      weight: creditData.scores.social?.weight || 0.3,
      color: 'bg-blue-500',
      icon: '🌟'
    },
    {
      name: 'On-Chain Activity',
      score: creditData.scores.onchain?.score || 0,
      weight: creditData.scores.onchain?.weight || 0.2,
      color: 'bg-purple-500',
      icon: '⛓️'
    },
    {
      name: 'Identity Verification',
      score: creditData.scores.identity?.score || 0,
      weight: creditData.scores.identity?.weight || 0.1,
      color: 'bg-yellow-500',
      icon: '🔐'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-6">Credit Score Breakdown</h3>
      
      <div className="space-y-4">
        {scoreComponents.map((component, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{component.icon}</span>
                <span className="font-medium">{component.name}</span>
                <span className="text-sm text-gray-500">
                  ({Math.round(component.weight * 100)}% weight)
                </span>
              </div>
              <span className="font-semibold">{component.score}/100</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${component.color}`}
                style={{ width: `${component.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Weighted Score</span>
          <span className="text-2xl font-bold text-blue-600">
            {creditData.totalScore}/100
          </span>
        </div>
      </div>
    </div>
  );
};

const SocialReputationCard = ({ socialReputation }) => {
  const platforms = [
    {
      name: 'Farcaster',
      score: socialReputation.farcaster?.score || 0,
      loading: socialReputation.farcaster?.loading,
      error: socialReputation.farcaster?.error,
      icon: '🌐',
      color: 'text-purple-600'
    },
    {
      name: 'Lens Protocol',
      score: socialReputation.lens?.score || 0,
      loading: socialReputation.lens?.loading,
      error: socialReputation.lens?.error,
      icon: '🌿',
      color: 'text-green-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-6">Social Protocol Reputation</h3>
      
      <div className="space-y-6">
        {platforms.map((platform, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{platform.icon}</span>
                <span className={`font-medium ${platform.color}`}>
                  {platform.name}
                </span>
              </div>
              <div className="text-right">
                {platform.loading ? (
                  <LoadingSpinner size="small" />
                ) : platform.error ? (
                  <span className="text-red-500 text-sm">Error</span>
                ) : (
                  <span className="font-semibold">{platform.score}/100</span>
                )}
              </div>
            </div>
            
            {!platform.loading && !platform.error && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${platform.score}%` }}
                />
              </div>
            )}
          </div>
        ))}

        {/* Identity Verification */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🔒</span>
              <span className="font-medium">Cross-Platform Identity</span>
            </div>
            <span className="font-semibold">
              {socialReputation.identity?.score || 0}/100
            </span>
          </div>
          
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
              style={{ width: `${socialReputation.identity?.score || 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const LoanEligibilityCard = ({ loanData }) => {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircleIcon className="h-8 w-8 text-green-600" />
        <div>
          <h3 className="text-xl font-semibold text-green-800">
            Congratulations! You're eligible for funding
          </h3>
          <p className="text-green-600">
            Based on your developer reputation and activity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-700 mb-2">
            ${loanData.amount.toLocaleString()}
          </div>
          <div className="text-sm text-green-600">Maximum USDC Loan</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-green-700 mb-2">
            {loanData.interestRate}%
          </div>
          <div className="text-sm text-green-600">Interest Rate (APR)</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-green-700 mb-2">
            {loanData.tier}
          </div>
          <div className="text-sm text-green-600">Credit Tier</div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-green-200">
        <h4 className="font-medium text-green-800 mb-2">Loan Conditions:</h4>
        <ul className="text-sm text-green-700 space-y-1">
          {loanData.conditions?.map((condition, index) => (
            <li key={index} className="flex items-center space-x-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{condition}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors">
          Apply for Funding
        </button>
      </div>
    </div>
  );
};

const RecommendationsCard = ({ recommendations }) => {
  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-blue-200 bg-blue-50'
  };

  const priorityIcons = {
    high: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />,
    medium: <ClockIcon className="h-5 w-5 text-yellow-500" />,
    low: <ChartBarIcon className="h-5 w-5 text-blue-500" />
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-6">Improvement Recommendations</h3>
      
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div 
            key={index}
            className={`border rounded-lg p-4 ${priorityColors[rec.priority]}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {priorityIcons[rec.priority]}
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{rec.category}</h4>
                  <span className="text-sm text-gray-600">{rec.impact}</span>
                </div>
                <p className="text-sm text-gray-700">{rec.action}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PlatformIntegrationStatus = ({ profiles }) => {
  const integrations = [
    {
      name: 'GitHub',
      connected: !!profiles.github,
      icon: '📊',
      status: profiles.github ? 'Connected' : 'Not Connected',
      action: profiles.github ? 'View Profile' : 'Connect GitHub'
    },
    {
      name: 'Farcaster',
      connected: !!profiles.farcaster,
      icon: '🌐',
      status: profiles.farcaster ? 'Connected' : 'Not Connected',
      action: profiles.farcaster ? 'View Profile' : 'Connect Farcaster'
    },
    {
      name: 'Lens Protocol',
      connected: !!profiles.lens,
      icon: '🌿',
      status: profiles.lens ? 'Connected' : 'Not Connected',
      action: profiles.lens ? 'View Profile' : 'Connect Lens'
    },
    {
      name: 'Wallet',
      connected: !!profiles.wallet,
      icon: '👛',
      status: profiles.wallet ? 'Connected' : 'Not Connected',
      action: profiles.wallet ? 'View Transactions' : 'Connect Wallet'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-6">Platform Integration Status</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrations.map((integration, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{integration.icon}</span>
              <div className={`h-3 w-3 rounded-full ${
                integration.connected ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            </div>
            
            <h4 className="font-medium mb-1">{integration.name}</h4>
            <p className={`text-sm mb-3 ${
              integration.connected ? 'text-green-600' : 'text-gray-500'
            }`}>
              {integration.status}
            </p>
            
            <button className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
              integration.connected 
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
              {integration.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreditDashboard;
