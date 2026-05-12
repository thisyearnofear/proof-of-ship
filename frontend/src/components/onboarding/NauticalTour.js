import React, { useState, useEffect } from 'react';
import { Card, Button, Modal } from '@/components/common';
import { 
  SparklesIcon, 
  MapIcon, 
  ShieldCheckIcon, 
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome Aboard, Captain!',
    description: 'Ready to turn your code into credit? Let us show you around the deck of Proof of Ship.',
    icon: SparklesIcon,
    image: '/illustrations/welcome-ship.svg'
  },
  {
    id: 'explore',
    title: 'Explore the Fleet',
    description: 'Discover projects across multiple ecosystems. See what other builders are shipping and find inspiration.',
    icon: MapIcon,
    image: '/illustrations/map-explore.svg'
  },
  {
    id: 'agents',
    title: 'AI Verification Agents',
    description: 'Our AI agents (Underwriter, Scout, Verifier) assess your project quality in real-time using nanopayments.',
    icon: ShieldCheckIcon,
    image: '/illustrations/ai-agent.svg'
  },
  {
    id: 'credit',
    title: 'Unlock Your Credit',
    description: 'As your reputation grows, so does your credit limit. Use it to fund your next big ship!',
    icon: ArrowRightIcon,
    image: '/illustrations/credit-unlock.svg'
  }
];

export default function NauticalTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = TOUR_STEPS[currentStep];

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      showCloseButton={false}
      className="p-0 overflow-hidden rounded-2xl"
    >
      <div className="relative">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 flex">
          {TOUR_STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 h-full transition-all duration-500 ${
                i <= currentStep ? 'bg-primary-500' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-secondary hover:text-primary hover:bg-surface-hover rounded-full transition-colors z-10"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="p-8 sm:p-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mb-8 animate-float">
              <step.icon className="w-10 h-10 text-primary-500" />
            </div>

            <h2 className="text-3xl font-extrabold text-primary mb-4">
              {step.title}
            </h2>
            
            <p className="text-lg text-secondary mb-10 max-w-md">
              {step.description}
            </p>

            <div className="flex items-center justify-between w-full mt-auto">
              <Button 
                variant="ghost" 
                onClick={handleBack}
                className={currentStep === 0 ? 'invisible' : ''}
              >
                Back
              </Button>

              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentStep ? 'w-6 bg-primary-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              <Button 
                variant="primary" 
                onClick={handleNext}
                rightIcon={currentStep === TOUR_STEPS.length - 1 ? null : <ArrowRightIcon className="w-4 h-4" />}
              >
                {currentStep === TOUR_STEPS.length - 1 ? 'Start Shipping' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
