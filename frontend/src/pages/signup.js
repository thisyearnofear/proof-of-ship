import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDecentralizedAuth } from "../contexts/DecentralizedAuthContext";
import { useMetaMask } from "../contexts/MetaMaskContext";

import OnboardingFlow from "../components/onboarding/OnboardingFlow";
import { Card } from "../components/common/Card";
import Button from "../components/common/Button";
import { LoadingSpinner } from "../components/common/LoadingStates";
import {
  WalletIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function SignUpPage() {
  const router = useRouter();
  const { connected } = useMetaMask();
  const {
    isAuthenticated,
    onboardingComplete,
    userProfile,
    creditData,
    loading,
    completeOnboarding,
  } = useDecentralizedAuth();

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Redirect if already fully set up
    if (isAuthenticated && onboardingComplete && creditData) {
      const redirectTo = router.query.redirect || "/credit";
      router.push(redirectTo);
    }
  }, [isAuthenticated, onboardingComplete, creditData, router]);

  useEffect(() => {
    // Show onboarding if wallet is connected but onboarding not complete
    if (connected && isAuthenticated && !onboardingComplete) {
      setShowOnboarding(true);
    }
  }, [connected, isAuthenticated, onboardingComplete]);

  const handleOnboardingComplete = async (profile, creditData) => {
    await completeOnboarding(profile, creditData);

    // Redirect to intended destination
    const redirectTo = router.query.redirect || "/credit";
    router.push(redirectTo);
  };

  const handleGetStarted = () => {
    setShowOnboarding(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              <ShieldCheckIcon className="w-4 h-4" />
              <span>Decentralized Identity Verification</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Build Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Developer Credit
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect your wallet and social profiles to build a comprehensive
            developer credit score. No emails, no passwords - just your on-chain
            and social reputation.
          </p>
        </div>

        {/* Process Overview */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <ProcessStep
            icon={WalletIcon}
            title="Connect Wallet"
            description="Your MetaMask wallet is your primary identity. Sign a message to verify ownership."
            step={1}
          />
          <ProcessStep
            icon={SparklesIcon}
            title="Link Profiles"
            description="Connect GitHub, Farcaster, and Lens to showcase your development and social activity."
            step={2}
          />
          <ProcessStep
            icon={CheckCircleIcon}
            title="Get Credit Score"
            description="Receive your developer credit score and unlock funding opportunities up to $5,000 USDC."
            step={3}
          />
        </div>

        {/* Benefits */}
        <Card className="p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Choose Decentralized Identity?
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <BenefitItem
                title="Privacy First"
                description="Your data stays with you. We analyze publicly available information without storing personal details."
              />
              <BenefitItem
                title="Wallet-Based Auth"
                description="No passwords to remember. Your wallet signature is your authentication."
              />
              <BenefitItem
                title="Portable Reputation"
                description="Your credit score is calculated from your actual contributions and activity across platforms."
              />
            </div>

            <div className="space-y-4">
              <BenefitItem
                title="Real-Time Updates"
                description="Your credit score updates as you contribute more to open source and engage with the community."
              />
              <BenefitItem
                title="Multi-Chain Support"
                description="Works across Ethereum, Base, Celo, and other EVM-compatible networks."
              />
              <BenefitItem
                title="Instant Funding"
                description="Qualified developers can access funding immediately without lengthy approval processes."
              />
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Build Your Developer Credit?
            </h3>
            <p className="text-gray-600 mb-6">
              Join hundreds of developers who are already leveraging their
              reputation for instant funding access.
            </p>

            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 text-lg font-semibold"
            >
              Get Started Now
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-sm text-gray-500 mt-4">
              Takes less than 5 minutes • No email required • Fully
              decentralized
            </p>
          </Card>
        </div>

        {/* Security Notice */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>
              Your private keys never leave your wallet. We only read public
              data.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessStep({ icon: Icon, title, description, step }) {
  return (
    <div className="text-center">
      <div className="relative mb-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
          {step}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function BenefitItem({ title, description }) {
  return (
    <div className="flex items-start space-x-3">
      <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  );
}
