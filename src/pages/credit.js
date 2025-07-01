/**
 * Credit Dashboard Page
 * Main page for developer credit scoring and loan eligibility
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { CreditDashboard } from '@/components/credit';
import { Navbar, Footer } from '@/components/common/layout';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import { MetaMaskProviderWrapper } from '../contexts/MetaMaskContext';
import MetaMaskWallet from '../components/MetaMaskWallet';
import FundingInterface from '../components/FundingInterface';

export default function CreditPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [developer, setDeveloper] = useState(null);
  const [creditScore, setCreditScore] = useState(null);
  const [creditData, setCreditData] = useState(null);

  useEffect(() => {
    // For demo purposes, we'll use mock developer data
    // In production, this would fetch from user profile/database
    if (currentUser) {
      setDeveloper({
        id: currentUser.uid,
        name: currentUser.displayName || 'Developer',
        email: currentUser.email,
        github: 'developerdemo', // This would come from user's connected accounts
        farcaster: 'developerdemo.eth', // This would come from user's connected accounts
        lens: 'developerdemo.lens', // This would come from user's connected accounts
        wallet: '0x1234567890123456789012345678901234567890' // This would come from connected wallet
      });
    }
  }, [currentUser]);

  const handleCreditScoreUpdate = (score, data) => {
    setCreditScore(score);
    setCreditData(data);
  };

  const handleFundingComplete = (result) => {
    console.log('Funding completed:', result);
    // Handle successful funding (e.g., show notification, update UI)
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Access Your Credit Dashboard
            </h1>
            <p className="text-gray-600 mb-8">
              Sign in to view your developer credit score and loan eligibility
            </p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In with GitHub
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <MetaMaskProviderWrapper>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Credit Dashboard */}
            <div className="lg:col-span-2">
              <CreditDashboard 
                developer={developer} 
                onCreditScoreUpdate={handleCreditScoreUpdate}
              />
            </div>
            
            {/* Sidebar with MetaMask and Funding */}
            <div className="space-y-6">
              {/* MetaMask Wallet Connection */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Wallet Connection</h2>
                <MetaMaskWallet />
              </div>
              
              {/* Funding Interface */}
              {creditScore && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Developer Funding</h2>
                  <FundingInterface
                    creditScore={creditScore}
                    creditData={creditData}
                    onFundingComplete={handleFundingComplete}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </MetaMaskProviderWrapper>
  );
}
