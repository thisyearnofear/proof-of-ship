import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/common';
import { 
  BanknotesIcon,
  CalendarIcon,
  ChartBarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Funding tier configuration
const FUNDING_TIERS = [
  { min: 500, max: 999, name: 'Starter', color: '#ef4444', description: 'Perfect for small projects' },
  { min: 1000, max: 1999, name: 'Growth', color: '#f97316', description: 'Scale your development' },
  { min: 2000, max: 3499, name: 'Professional', color: '#f59e0b', description: 'Professional projects' },
  { min: 3500, max: 4999, name: 'Enterprise', color: '#3b82f6', description: 'Large-scale development' },
  { min: 5000, max: 5000, name: 'Maximum', color: '#22c55e', description: 'Full funding potential' }
];

// Get tier info for amount
const getTierForAmount = (amount) => {
  return FUNDING_TIERS.find(tier => amount >= tier.min && amount <= tier.max) || FUNDING_TIERS[0];
};

// Calculate project timeline based on amount
const calculateProjectTimeline = (amount) => {
  if (amount >= 5000) return { months: 12, milestones: 4 };
  if (amount >= 3500) return { months: 9, milestones: 3 };
  if (amount >= 2000) return { months: 6, milestones: 3 };
  if (amount >= 1000) return { months: 4, milestones: 2 };
  return { months: 3, milestones: 1 };
};

// Funding impact calculator
const calculateFundingImpact = (amount) => {
  const baseImpact = {
    developmentHours: Math.round(amount / 50), // $50/hour equivalent
    teamSize: Math.min(Math.ceil(amount / 2000), 5),
    features: Math.ceil(amount / 500),
    marketingBudget: Math.round(amount * 0.1)
  };

  return baseImpact;
};

export const FundingSlider = ({
  minAmount = 500,
  maxAmount = 5000,
  initialAmount = 1000,
  step = 100,
  creditScore = 0,
  onAmountChange,
  showImpactCalculator = true,
  showPresets = true,
  className = ''
}) => {
  const [amount, setAmount] = useState(initialAmount);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const tier = getTierForAmount(amount);
  const timeline = calculateProjectTimeline(amount);
  const impact = calculateFundingImpact(amount);

  // Preset amounts based on common funding needs
  const presetAmounts = [
    { amount: 500, label: 'MVP', description: 'Minimum viable product' },
    { amount: 1000, label: 'Prototype', description: 'Working prototype' },
    { amount: 2000, label: 'Beta', description: 'Beta version' },
    { amount: 3500, label: 'Launch', description: 'Production ready' },
    { amount: maxAmount, label: 'Scale', description: 'Full scale project' }
  ].filter(preset => preset.amount <= maxAmount);

  useEffect(() => {
    onAmountChange?.(amount);
  }, [amount, onAmountChange]);

  const handleSliderChange = (e) => {
    const newAmount = parseInt(e.target.value);
    setAmount(newAmount);
  };

  const handlePresetClick = (presetAmount) => {
    setAmount(presetAmount);
  };

  const percentage = ((amount - minAmount) / (maxAmount - minAmount)) * 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Slider Card */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary flex items-center">
                <BanknotesIcon className="h-5 w-5 mr-2" />
                Funding Amount
              </h3>
              <div className="text-right">
                <div 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: `${tier.color}20`, 
                    color: tier.color 
                  }}
                >
                  {tier.name} Tier
                </div>
              </div>
            </div>

            {/* Amount Display */}
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-primary mb-2">
                ${amount.toLocaleString()}
              </div>
              <div className="text-sm text-secondary">
                {tier.description}
              </div>
            </div>

            {/* Custom Slider */}
            <div className="relative mb-4">
              <input
                ref={sliderRef}
                type="range"
                min={minAmount}
                max={maxAmount}
                step={step}
                value={amount}
                onChange={handleSliderChange}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                className="w-full h-3 bg-background-secondary rounded-lg appearance-none cursor-pointer slider-custom"
                style={{
                  background: `linear-gradient(to right, ${tier.color} 0%, ${tier.color} ${percentage}%, #f3f4f6 ${percentage}%, #f3f4f6 100%)`
                }}
              />
              
              {/* Tier markers */}
              <div className="absolute top-4 left-0 right-0 flex justify-between text-xs text-secondary">
                {FUNDING_TIERS.map((tierMarker, index) => {
                  const markerPosition = ((tierMarker.min - minAmount) / (maxAmount - minAmount)) * 100;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center"
                      style={{ left: `${markerPosition}%`, position: 'absolute', transform: 'translateX(-50%)' }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full mb-1"
                        style={{ backgroundColor: tierMarker.color }}
                      />
                      <span className="whitespace-nowrap">{tierMarker.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Range Labels */}
            <div className="flex justify-between text-sm text-secondary mb-6">
              <span>${minAmount.toLocaleString()}</span>
              <span>${maxAmount.toLocaleString()}</span>
            </div>

            {/* Preset Buttons */}
            {showPresets && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset.amount}
                    onClick={() => handlePresetClick(preset.amount)}
                    className={`
                      p-3 rounded-lg border-2 transition-all duration-200 text-center
                      ${amount === preset.amount
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-border-secondary bg-surface hover:border-primary-300 hover:bg-primary-50'
                      }
                    `}
                  >
                    <div className="font-semibold text-sm">{preset.label}</div>
                    <div className="text-xs text-secondary">${preset.amount.toLocaleString()}</div>
                    <div className="text-xs text-tertiary mt-1">{preset.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Timeline */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-semibold text-primary mb-4 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Project Timeline
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-surface-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">{timeline.months}</div>
              <div className="text-sm text-secondary">Months</div>
              <div className="text-xs text-tertiary mt-1">Development period</div>
            </div>
            
            <div className="text-center p-4 bg-surface-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">{timeline.milestones}</div>
              <div className="text-sm text-secondary">Milestones</div>
              <div className="text-xs text-tertiary mt-1">Progress checkpoints</div>
            </div>
            
            <div className="text-center p-4 bg-surface-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">0%</div>
              <div className="text-sm text-secondary">Interest</div>
              <div className="text-xs text-tertiary mt-1">No interest charges</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact Calculator */}
      {showImpactCalculator && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold text-primary mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Funding Impact Calculator
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-surface-secondary rounded-lg">
                <div className="text-xl font-bold text-primary">{impact.developmentHours}</div>
                <div className="text-sm text-secondary">Dev Hours</div>
                <div className="text-xs text-tertiary mt-1">Equivalent work</div>
              </div>
              
              <div className="text-center p-4 bg-surface-secondary rounded-lg">
                <div className="text-xl font-bold text-primary">{impact.teamSize}</div>
                <div className="text-sm text-secondary">Team Size</div>
                <div className="text-xs text-tertiary mt-1">Recommended</div>
              </div>
              
              <div className="text-center p-4 bg-surface-secondary rounded-lg">
                <div className="text-xl font-bold text-primary">{impact.features}</div>
                <div className="text-sm text-secondary">Features</div>
                <div className="text-xs text-tertiary mt-1">Estimated scope</div>
              </div>
              
              <div className="text-center p-4 bg-surface-secondary rounded-lg">
                <div className="text-xl font-bold text-primary">${impact.marketingBudget}</div>
                <div className="text-sm text-secondary">Marketing</div>
                <div className="text-xs text-tertiary mt-1">Suggested budget</div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-primary-800 mb-1">Funding Optimization Tip</h5>
                  <p className="text-primary-700 text-sm">
                    Based on your credit score of {creditScore}, you're eligible for up to ${maxAmount.toLocaleString()} USDC. 
                    Consider requesting the full amount to maximize your project's potential and build a stronger credit history.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funding Breakdown */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-semibold text-primary mb-4">Funding Breakdown</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-secondary">Requested Amount:</span>
              <span className="font-semibold text-primary">${amount.toLocaleString()} USDC</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-secondary">Processing Fee:</span>
              <span className="font-semibold text-success-600">$0 (Free)</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-secondary">Interest Rate:</span>
              <span className="font-semibold text-success-600">0% APR</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-secondary">Repayment Required:</span>
              <span className="font-semibold text-success-600">Only if milestones not met</span>
            </div>
            
            <div className="border-t border-border-secondary pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">You'll Receive:</span>
                <span className="text-2xl font-bold text-primary">${amount.toLocaleString()} USDC</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FundingSlider;
