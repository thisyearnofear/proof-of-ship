import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common';
import { CreditScoreCircular } from '@/components/common/CircularProgress';
import { CreditTierBadge } from '@/components/credit/CreditTierBadge';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// Funding wizard steps configuration
const FUNDING_STEPS = [
  {
    id: 'eligibility',
    title: 'Check Eligibility',
    description: 'Verify your credit score and funding eligibility',
    icon: ShieldCheckIcon,
    component: 'EligibilityStep'
  },
  {
    id: 'amount',
    title: 'Select Amount',
    description: 'Choose your funding amount based on your credit tier',
    icon: BanknotesIcon,
    component: 'AmountStep'
  },
  {
    id: 'terms',
    title: 'Review Terms',
    description: 'Review funding terms and conditions',
    icon: DocumentTextIcon,
    component: 'TermsStep'
  },
  {
    id: 'wallet',
    title: 'Connect Wallet',
    description: 'Connect your MetaMask wallet for funding',
    icon: CreditCardIcon,
    component: 'WalletStep'
  },
  {
    id: 'confirmation',
    title: 'Confirmation',
    description: 'Confirm your funding request',
    icon: CheckCircleIcon,
    component: 'ConfirmationStep'
  }
];

// Step progress indicator
const StepProgress = ({ currentStep, steps, onStepClick }) => {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = index < currentIndex;
        const isClickable = index <= currentIndex;
        const IconComponent = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                ${isActive 
                  ? 'border-primary-500 bg-primary-500 text-white shadow-lg scale-110' 
                  : isCompleted 
                    ? 'border-success-500 bg-success-500 text-white' 
                    : 'border-border-secondary bg-surface text-text-tertiary'
                }
                ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
              `}
              onClick={() => isClickable && onStepClick(step.id)}
            >
              {isCompleted ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <IconComponent className="h-5 w-5" />
              )}
              
              {isActive && (
                <div className="absolute -inset-1 rounded-full border-2 border-primary-300 animate-ping" />
              )}
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={`
                  w-16 h-0.5 mx-2 transition-colors duration-300
                  ${isCompleted ? 'bg-success-500' : 'bg-border-secondary'}
                `} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Eligibility check step
const EligibilityStep = ({ creditData, onNext, onBack }) => {
  const totalScore = creditData?.totalScore || 0;
  const isEligible = totalScore >= 400;
  const maxFunding = calculateFundingAmount(totalScore);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">Check Your Eligibility</h2>
        <p className="text-secondary">
          Your credit score determines your funding eligibility and amount
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center space-y-6 lg:space-y-0 lg:space-x-12">
        <CreditScoreCircular
          score={totalScore}
          size="xl"
          animated={true}
          showTier={true}
        />
        
        <div className="text-center lg:text-left">
          <div className="mb-4">
            <CreditTierBadge score={totalScore} size="lg" variant="gradient" />
          </div>
          
          {isEligible ? (
            <div className="space-y-3">
              <div className="flex items-center text-success-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">You're eligible for funding!</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                Up to ${maxFunding.toLocaleString()} USDC
              </div>
              <p className="text-secondary">
                Based on your {getCreditTier(totalScore).tier.toLowerCase()} credit tier
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center text-error-600">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Not eligible for funding</span>
              </div>
              <p className="text-secondary">
                Minimum credit score of 400 required
              </p>
              <p className="text-sm text-tertiary">
                Improve your score by connecting more accounts and increasing activity
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!isEligible}
          variant="primary"
          size="lg"
        >
          Continue to Amount Selection
        </Button>
      </div>
    </div>
  );
};

// Amount selection step
const AmountStep = ({ creditData, selectedAmount, onAmountChange, onNext, onBack }) => {
  const totalScore = creditData?.totalScore || 0;
  const maxFunding = calculateFundingAmount(totalScore);
  const minFunding = 500;

  const presetAmounts = [
    minFunding,
    Math.round(maxFunding * 0.25),
    Math.round(maxFunding * 0.5),
    Math.round(maxFunding * 0.75),
    maxFunding
  ].filter((amount, index, arr) => arr.indexOf(amount) === index);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">Select Funding Amount</h2>
        <p className="text-secondary">
          Choose how much USDC funding you need for your projects
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-primary mb-2">
              Funding Amount (USDC)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">$</span>
              <input
                type="range"
                min={minFunding}
                max={maxFunding}
                step={100}
                value={selectedAmount}
                onChange={(e) => onAmountChange(parseInt(e.target.value))}
                className="w-full h-2 bg-background-secondary rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div className="flex justify-between text-xs text-secondary mt-2">
              <span>${minFunding.toLocaleString()}</span>
              <span>${maxFunding.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-primary mb-2">
              ${selectedAmount.toLocaleString()}
            </div>
            <div className="text-sm text-secondary">
              {((selectedAmount / maxFunding) * 100).toFixed(0)}% of maximum eligible amount
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => onAmountChange(amount)}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${selectedAmount === amount
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-secondary text-secondary hover:bg-surface-hover hover:text-primary'
                  }
                `}
              >
                ${amount.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="bg-background-secondary rounded-lg p-4">
            <h4 className="font-medium text-primary mb-2">Funding Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Requested Amount:</span>
                <span className="font-medium text-primary">${selectedAmount.toLocaleString()} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Processing Fee:</span>
                <span className="font-medium text-primary">$0 (Free)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Interest Rate:</span>
                <span className="font-medium text-primary">0% APR</span>
              </div>
              <div className="border-t border-border-secondary pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-primary">You'll Receive:</span>
                  <span className="font-bold text-primary">${selectedAmount.toLocaleString()} USDC</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="ghost">
          Back
        </Button>
        <Button onClick={onNext} variant="primary" size="lg">
          Review Terms
        </Button>
      </div>
    </div>
  );
};

// Terms and conditions step
const TermsStep = ({ selectedAmount, onNext, onBack }) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">Review Terms & Conditions</h2>
        <p className="text-secondary">
          Please review the funding terms before proceeding
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funding Agreement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-primary mb-2">Funding Amount</h4>
              <p className="text-secondary">
                You will receive ${selectedAmount.toLocaleString()} USDC to your connected wallet.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-primary mb-2">Repayment Terms</h4>
              <p className="text-secondary">
                This funding is provided as a grant for developer projects. No repayment is required 
                if you successfully complete your project milestones within 6 months.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-primary mb-2">Project Requirements</h4>
              <ul className="list-disc list-inside text-secondary space-y-1">
                <li>Maintain active development on your projects</li>
                <li>Provide monthly progress updates</li>
                <li>Complete at least one significant milestone within 6 months</li>
                <li>Share your project publicly (open source preferred)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-primary mb-2">Success Criteria</h4>
              <p className="text-secondary">
                Projects are considered successful if they demonstrate meaningful progress, 
                community engagement, or technical innovation within the funding period.
              </p>
            </div>

            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-warning-800 mb-1">Important Notice</h4>
                  <p className="text-warning-700 text-sm">
                    If project milestones are not met within the specified timeframe, 
                    you may be required to repay a portion of the funding. However, we work 
                    with developers to ensure success and provide support throughout the process.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border-secondary">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary-500 border-border-secondary rounded focus:ring-primary-500"
              />
              <span className="text-sm text-secondary">
                I have read and agree to the funding terms and conditions. I understand 
                the project requirements and commit to meeting the success criteria.
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="ghost">
          Back
        </Button>
        <Button 
          onClick={onNext} 
          variant="primary" 
          size="lg"
          disabled={!agreedToTerms}
        >
          Connect Wallet
        </Button>
      </div>
    </div>
  );
};

// Main funding wizard component
export const FundingWizard = ({ 
  creditData, 
  onComplete, 
  onCancel,
  className = '' 
}) => {
  const [currentStep, setCurrentStep] = useState('eligibility');
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const handleStepClick = (stepId) => {
    if (completedSteps.has(stepId) || stepId === currentStep) {
      setCurrentStep(stepId);
    }
  };

  const handleNext = () => {
    const currentIndex = FUNDING_STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex < FUNDING_STEPS.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(FUNDING_STEPS[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = FUNDING_STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(FUNDING_STEPS[currentIndex - 1].id);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'eligibility':
        return (
          <EligibilityStep
            creditData={creditData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'amount':
        return (
          <AmountStep
            creditData={creditData}
            selectedAmount={selectedAmount}
            onAmountChange={setSelectedAmount}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'terms':
        return (
          <TermsStep
            selectedAmount={selectedAmount}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      default:
        return <div>Step not implemented</div>;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Developer Funding Application</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <StepProgress
            currentStep={currentStep}
            steps={FUNDING_STEPS}
            onStepClick={handleStepClick}
          />
          
          {renderCurrentStep()}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions
const calculateFundingAmount = (score) => {
  if (score >= 800) return 5000;
  if (score >= 700) return 3500;
  if (score >= 600) return 2000;
  if (score >= 500) return 1000;
  return 500;
};

const getCreditTier = (score) => {
  if (score >= 800) return { tier: 'Excellent', color: '#22c55e' };
  if (score >= 700) return { tier: 'Good', color: '#3b82f6' };
  if (score >= 600) return { tier: 'Fair', color: '#f59e0b' };
  if (score >= 500) return { tier: 'Poor', color: '#f97316' };
  return { tier: 'Very Poor', color: '#ef4444' };
};

export default FundingWizard;
