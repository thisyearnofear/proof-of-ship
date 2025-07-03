import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { decentralizedAuth } from '../../lib/auth/DecentralizedAuth';
import { useMetaMask } from '../../contexts/MetaMaskContext';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { LoadingSpinner } from '../common/LoadingStates';
import { CircularProgress } from '../common/CircularProgress';
import {
  WalletIcon,
  CheckCircleIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  SparklesIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ONBOARDING_STEPS = [
  {
    id: 'wallet',
    title: 'Connect Wallet',
    description: 'Your primary identity on the platform',
    icon: WalletIcon,
    required: true,
    weight: 0.20
  },
  {
    id: 'github',
    title: 'Connect GitHub',
    description: 'Showcase your development activity',
    icon: CodeBracketIcon,
    required: false,
    weight: 0.40,
    impact: 'High Impact'
  },
  {
    id: 'farcaster',
    title: 'Connect Farcaster',
    description: 'Build your crypto social reputation',
    icon: ChatBubbleLeftRightIcon,
    required: false,
    weight: 0.25,
    impact: 'Medium Impact'
  },
  {
    id: 'lens',
    title: 'Connect Lens',
    description: 'Expand your decentralized social presence',
    icon: GlobeAltIcon,
    required: false,
    weight: 0.15,
    impact: 'Low Impact'
  }
];

export default function OnboardingFlow({ onComplete }) {
  const router = useRouter();
  const { connect, account, provider } = useMetaMask();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [userProfile, setUserProfile] = useState(null);
  const [creditData, setCreditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [skipOptional, setSkipOptional] = useState(false);

  useEffect(() => {
    // Try to load existing profile
    loadExistingProfile();
  }, []);

  useEffect(() => {
    if (account && !completedSteps.has('wallet')) {
      handleWalletConnected();
    }
  }, [account]);

  const loadExistingProfile = async () => {
    try {
      const existingProfile = await decentralizedAuth.loadProfileLocally();
      if (existingProfile) {
        setUserProfile(existingProfile);
        setCreditData(existingProfile.creditData);
        
        // Mark completed steps
        const completed = new Set();
        Object.entries(existingProfile.completionStatus).forEach(([key, value]) => {
          if (value) completed.add(key);
        });
        setCompletedSteps(completed);
        
        // Skip to credit calculation if all required steps are done
        if (completed.has('wallet')) {
          setCurrentStep(completed.size >= 2 ? 4 : findNextIncompleteStep(completed));
        }
      }
    } catch (error) {
      console.error('Failed to load existing profile:', error);
    }
  };

  const findNextIncompleteStep = (completed) => {
    return ONBOARDING_STEPS.findIndex(step => !completed.has(step.id));
  };

  const handleWalletConnected = async () => {
    if (!account || !provider) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Connect wallet and create profile
      const profile = await decentralizedAuth.connectWallet(provider);
      
      // Step 2: Verify identity with signature
      await decentralizedAuth.verifyIdentity(provider, account);
      
      setUserProfile(profile);
      setCompletedSteps(prev => new Set([...prev, 'wallet']));
      
      // Auto-advance to next step
      setTimeout(() => setCurrentStep(1), 1000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await connect();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGitHub = async () => {
    setLoading(true);
    setError(null);

    try {
      const githubProfile = await decentralizedAuth.connectGitHub();
      if (githubProfile) {
        setUserProfile(decentralizedAuth.userProfile);
        setCompletedSteps(prev => new Set([...prev, 'github']));
        setCurrentStep(2);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectFarcaster = async () => {
    const username = prompt('Enter your Farcaster username:');
    if (!username) return;

    setLoading(true);
    setError(null);

    try {
      const farcasterProfile = await decentralizedAuth.connectFarcaster(username);
      if (farcasterProfile) {
        setUserProfile(decentralizedAuth.userProfile);
        setCompletedSteps(prev => new Set([...prev, 'farcaster']));
        setCurrentStep(3);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectLens = async () => {
    const handle = prompt('Enter your Lens handle (without .lens):');
    if (!handle) return;

    setLoading(true);
    setError(null);

    try {
      const lensProfile = await decentralizedAuth.connectLens(handle);
      if (lensProfile) {
        setUserProfile(decentralizedAuth.userProfile);
        setCompletedSteps(prev => new Set([...prev, 'lens']));
        setCurrentStep(4);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateCredit = async () => {
    setLoading(true);
    setError(null);

    try {
      const creditResult = await decentralizedAuth.calculateCreditScore();
      setCreditData(creditResult);
      
      // Save profile locally
      await decentralizedAuth.saveProfileLocally();
      
      // Complete onboarding
      setCurrentStep(5);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipStep = () => {
    const nextStep = currentStep + 1;
    if (nextStep < ONBOARDING_STEPS.length) {
      setCurrentStep(nextStep);
    } else {
      handleCalculateCredit();
    }
  };

  const handleFinishOnboarding = () => {
    onComplete?.(userProfile, creditData);
    router.push('/credit');
  };

  const getCompletionPercentage = () => {
    if (!userProfile) return 0;
    return userProfile.completionStatus ? 
      Object.values(userProfile.completionStatus).filter(Boolean).length / Object.keys(userProfile.completionStatus).length * 100 : 0;
  };

  const renderStepContent = () => {
    const step = ONBOARDING_STEPS[currentStep];
    if (!step) return renderCreditCalculation();

    switch (step.id) {
      case 'wallet':
        return (
          <StepCard
            step={step}
            completed={completedSteps.has('wallet')}
            loading={loading}
            error={error}
            onAction={handleConnectWallet}
            actionText={account ? 'Connected' : 'Connect Wallet'}
            disabled={!!account}
          >
            <p className="text-gray-600 mb-4">
              Connect your MetaMask wallet to get started. This will be your primary identity on the platform.
            </p>
            {account && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">Wallet Connected</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              </div>
            )}
          </StepCard>
        );

      case 'github':
        return (
          <StepCard
            step={step}
            completed={completedSteps.has('github')}
            loading={loading}
            error={error}
            onAction={handleConnectGitHub}
            onSkip={handleSkipStep}
            actionText="Connect GitHub"
            skipText="Skip for now"
          >
            <p className="text-gray-600 mb-4">
              Connect your GitHub account to showcase your development activity and contributions.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">What we analyze:</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Public repositories and contributions</li>
                <li>• Commit frequency and consistency</li>
                <li>• Community engagement (stars, forks)</li>
                <li>• Programming languages and skills</li>
              </ul>
            </div>
          </StepCard>
        );

      case 'farcaster':
        return (
          <StepCard
            step={step}
            completed={completedSteps.has('farcaster')}
            loading={loading}
            error={error}
            onAction={handleConnectFarcaster}
            onSkip={handleSkipStep}
            actionText="Connect Farcaster"
            skipText="Skip for now"
          >
            <p className="text-gray-600 mb-4">
              Connect your Farcaster profile to build your crypto social reputation.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-purple-900 mb-2">Reputation factors:</h4>
              <ul className="text-purple-800 text-sm space-y-1">
                <li>• Profile completeness and verification</li>
                <li>• Posting activity and engagement</li>
                <li>• Network strength and followers</li>
                <li>• Content quality and interactions</li>
              </ul>
            </div>
          </StepCard>
        );

      case 'lens':
        return (
          <StepCard
            step={step}
            completed={completedSteps.has('lens')}
            loading={loading}
            error={error}
            onAction={handleConnectLens}
            onSkip={handleSkipStep}
            actionText="Connect Lens"
            skipText="Skip for now"
          >
            <p className="text-gray-600 mb-4">
              Connect your Lens Protocol handle to expand your decentralized social presence.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-green-900 mb-2">Social metrics:</h4>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• Posts and content creation</li>
                <li>• Followers and social reach</li>
                <li>• Mirrors and engagement</li>
                <li>• NFT collections and activity</li>
              </ul>
            </div>
          </StepCard>
        );

      default:
        return null;
    }
  };

  const renderCreditCalculation = () => {
    if (currentStep === 5) {
      return renderResults();
    }

    return (
      <Card className="p-8 text-center">
        <SparklesIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Calculate Your Credit Score
        </h3>
        <p className="text-gray-600 mb-6">
          Ready to analyze your reputation across all connected platforms and calculate your developer credit score.
        </p>
        
        {userProfile && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Connected Profiles:</h4>
            <div className="flex justify-center space-x-4">
              {Object.entries(userProfile.completionStatus).map(([key, completed]) => (
                <div key={key} className={`flex items-center space-x-2 ${completed ? 'text-green-600' : 'text-gray-400'}`}>
                  {completed ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className="capitalize text-sm">{key}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleCalculateCredit}
          disabled={loading || !completedSteps.has('wallet')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Calculating...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Calculate Credit Score
            </>
          )}
        </Button>
      </Card>
    );
  };

  const renderResults = () => {
    if (!creditData) return null;

    return (
      <Card className="p-8 text-center">
        <div className="mb-6">
          <div className="relative inline-block">
            <CircularProgress
              value={creditData.totalScore}
              max={850}
              size={120}
              strokeWidth={8}
              className="text-blue-600"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {creditData.totalScore}
                </div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Your Credit Score is Ready!
        </h3>
        
        <p className="text-gray-600 mb-6">
          {creditData.fundingEligible ? (
            <>You qualify for up to <span className="font-bold text-green-600">${creditData.fundingAmount.toLocaleString()} USDC</span> in funding!</>
          ) : (
            'Complete more profile connections to become eligible for funding.'
          )}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">Completion</div>
            <div className="text-2xl font-bold text-blue-600">{Math.round(getCompletionPercentage())}%</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">Funding Status</div>
            <div className={`text-2xl font-bold ${creditData.fundingEligible ? 'text-green-600' : 'text-red-600'}`}>
              {creditData.fundingEligible ? 'Eligible' : 'Not Eligible'}
            </div>
          </div>
        </div>

        <Button
          onClick={handleFinishOnboarding}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3"
        >
          View Full Dashboard
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </Button>
      </Card>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Build Your Developer Profile
          </h2>
          <div className="text-sm text-gray-600">
            Step {Math.min(currentStep + 1, 5)} of 5
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      {renderStepContent()}
    </div>
  );
}

// Reusable Step Card Component
function StepCard({ 
  step, 
  completed, 
  loading, 
  error, 
  onAction, 
  onSkip, 
  actionText, 
  skipText,
  disabled,
  children 
}) {
  return (
    <Card className="p-8">
      <div className="flex items-center space-x-4 mb-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          completed ? 'bg-green-100' : 'bg-blue-100'
        }`}>
          {completed ? (
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          ) : (
            <step.icon className="w-6 h-6 text-blue-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
          <p className="text-gray-600">{step.description}</p>
          {step.impact && (
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
              step.impact === 'High Impact' ? 'bg-red-100 text-red-800' :
              step.impact === 'Medium Impact' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {step.impact}
            </span>
          )}
        </div>
      </div>

      {children}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <Button
          onClick={onAction}
          disabled={loading || disabled || completed}
          className={`flex-1 ${completed ? 'bg-green-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'} text-white`}
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Connecting...
            </>
          ) : (
            actionText
          )}
        </Button>
        
        {onSkip && !step.required && !completed && (
          <Button
            onClick={onSkip}
            variant="outline"
            disabled={loading}
          >
            {skipText}
          </Button>
        )}
      </div>
    </Card>
  );
}
