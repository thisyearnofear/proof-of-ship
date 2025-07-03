/**
 * Credit Dashboard Page
 * Decentralized credit scoring and funding interface
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDecentralizedAuth } from "@/contexts/DecentralizedAuthContext";
import { useMetaMask } from "@/contexts/MetaMaskContext";
import { CreditDashboard } from "@/components/credit";
import { Navbar, Footer } from "@/components/common/layout";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import CrossChainFunding from "@/components/CrossChainFunding";
import { NetworkSwitcher } from "../components/wallet/NetworkSwitcher";
import { USDCBalanceDisplay } from "../components/wallet/USDCBalanceDisplay";
import { Modal } from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  CreditCardIcon
} from "@heroicons/react/24/outline";

export default function CreditPage() {
  const router = useRouter();
  const { account, connected } = useMetaMask();
  const { 
    userProfile, 
    creditData, 
    isAuthenticated, 
    onboardingComplete,
    loading,
    completionPercentage,
    fundingEligibility,
    connectSocialProfile,
    recalculateCredit
  } = useDecentralizedAuth();

  const [showFundingModal, setShowFundingModal] = useState(false);
  const [fundingResult, setFundingResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Redirect to signup if not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/signup?redirect=/credit');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    // Redirect to onboarding if authenticated but not complete
    if (isAuthenticated && !onboardingComplete) {
      router.push('/signup');
    }
  }, [isAuthenticated, onboardingComplete, router]);

  const handleRefreshCredit = async () => {
    setRefreshing(true);
    try {
      await recalculateCredit();
    } catch (error) {
      console.error('Failed to refresh credit:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnectProfile = async (platform) => {
    try {
      let identifier;
      
      if (platform === 'farcaster') {
        identifier = prompt('Enter your Farcaster username:');
      } else if (platform === 'lens') {
        identifier = prompt('Enter your Lens handle (without .lens):');
      }
      
      if (identifier || platform === 'github') {
        await connectSocialProfile(platform, identifier);
      }
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
    }
  };

  const handleFundingComplete = (result) => {
    setFundingResult(result);
    setShowFundingModal(false);
    
    // Show success/error message
    if (result.success) {
      // You could show a toast notification here
      console.log('Funding completed successfully:', result);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !onboardingComplete) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Developer Credit Dashboard
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Your decentralized reputation and funding eligibility
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleRefreshCredit}
                disabled={refreshing}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>{refreshing ? 'Refreshing...' : 'Refresh Score'}</span>
              </Button>
              
              {fundingEligibility.eligible && (
                <Button
                  onClick={() => setShowFundingModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center space-x-2"
                >
                  <CreditCardIcon className="w-4 h-4" />
                  <span>Get Funding</span>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <SparklesIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Credit Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {creditData?.totalScore || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <CreditCardIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Funding Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${fundingEligibility.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <div className="text-purple-600 font-bold text-lg">
                    {completionPercentage}%
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Profile Complete</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {completionPercentage === 100 ? 'Complete' : 'In Progress'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                  fundingEligibility.eligible ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    fundingEligibility.eligible ? 'bg-green-600' : 'bg-red-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Funding Status</p>
                  <p className={`text-lg font-semibold ${
                    fundingEligibility.eligible ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {fundingEligibility.eligible ? 'Eligible' : 'Not Eligible'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Profile Completion Alert */}
        {completionPercentage < 100 && (
          <Card className="p-6 mb-8 border-l-4 border-yellow-400 bg-yellow-50">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-900 mb-2">
                  Boost Your Credit Score
                </h3>
                <p className="text-yellow-800 mb-4">
                  Your profile is {completionPercentage}% complete. Connect more platforms to increase your credit score and funding eligibility.
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {!userProfile?.completionStatus?.github && (
                    <Button
                      onClick={() => handleConnectProfile('github')}
                      size="sm"
                      className="bg-gray-900 text-white"
                    >
                      Connect GitHub
                    </Button>
                  )}
                  {!userProfile?.completionStatus?.farcaster && (
                    <Button
                      onClick={() => handleConnectProfile('farcaster')}
                      size="sm"
                      className="bg-purple-600 text-white"
                    >
                      Connect Farcaster
                    </Button>
                  )}
                  {!userProfile?.completionStatus?.lens && (
                    <Button
                      onClick={() => handleConnectProfile('lens')}
                      size="sm"
                      className="bg-green-600 text-white"
                    >
                      Connect Lens
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Credit Dashboard */}
          <div className="lg:col-span-2">
            <CreditDashboard 
              developer={userProfile}
              creditData={creditData}
              onScoreUpdate={() => {}} // Handled by context
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Wallet Connection
              </h3>
              
              {connected && account ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Connected Address</p>
                    <p className="font-mono text-sm text-gray-900">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </p>
                  </div>
                  
                  <NetworkSwitcher />
                  <USDCBalanceDisplay />
                </div>
              ) : (
                <div className="text-center py-4">
                  <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-gray-600">Wallet not connected</p>
                </div>
              )}
            </Card>

            {/* Funding Eligibility */}
            {fundingEligibility.eligible && (
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🎉 Funding Available!
                </h3>
                <p className="text-gray-700 mb-4">
                  You qualify for up to <span className="font-bold text-blue-600">
                    ${fundingEligibility.amount.toLocaleString()} USDC
                  </span> in instant funding.
                </p>
                
                <Button
                  onClick={() => setShowFundingModal(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  Request Funding
                </Button>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Profile Summary
              </h3>
              
              <div className="space-y-3 text-sm">
                {Object.entries(userProfile?.completionStatus || {}).map(([platform, completed]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <span className="capitalize text-gray-600">{platform}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {completed ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Funding Modal */}
      <Modal
        isOpen={showFundingModal}
        onClose={() => setShowFundingModal(false)}
        title="Cross-Chain USDC Funding"
        size="lg"
      >
        <CrossChainFunding
          creditScore={creditData?.totalScore || 0}
          developerAddress={account}
          onFundingComplete={handleFundingComplete}
        />
      </Modal>

      <Footer />
    </div>
  );
}
        lens: "developerdemo.lens", // This would come from user's connected accounts
        wallet: "0x1234567890123456789012345678901234567890", // This would come from connected wallet
      });

      // Mock registered projects data
      setRegisteredProjects([
        {
          slug: "my-awesome-project",
          name: "My Awesome Project",
          contracts: [{ address: "0x123...", label: "Main" }],
          founders: [{ name: "Builder" }],
          socials: { twitter: "#" },
          loanStatus: "Active",
          milestones: [
            { name: "Deploy Contract", completed: true },
            { name: "Get 100 Users", completed: false },
          ],
        },
        {
          slug: "another-cool-thing",
          name: "Another Cool Thing",
          contracts: [{ address: "0x456...", label: "V2" }],
          founders: [{ name: "Builder" }],
          socials: { discord: "#" },
          loanStatus: "Repaid",
          milestones: [
            { name: "Launch on Mainnet", completed: true },
            { name: "Integrate LI.FI", completed: true },
          ],
        },
      ]);
    }
  }, [currentUser]);

  const handleCreditScoreUpdate = (score, data) => {
    setCreditScore(score);
    setCreditData(data);
  };

  const handleFundingComplete = (result) => {
    console.log("Funding completed:", result);
    // Handle successful funding (e.g., show notification, update UI)
  };

  const handleRegisterProject = () => {
    console.log("Registering project with URL:", githubUrl);
    // TODO: Implement smart contract interaction
    setIsRegisterModalOpen(false);
    setGithubUrl("");
  };

  const handleWidgetAction = (widgetId, action) => {
    setWidgets((prevWidgets) => {
      const widgetIndex = prevWidgets.findIndex((w) => w.id === widgetId);
      const newWidgets = [...prevWidgets];

      if (action === "hide") {
        newWidgets[widgetIndex].isVisible = false;
      } else if (action === "moveUp" && widgetIndex > 0) {
        [newWidgets[widgetIndex - 1], newWidgets[widgetIndex]] = [
          newWidgets[widgetIndex],
          newWidgets[widgetIndex - 1],
        ];
      } else if (action === "moveDown" && widgetIndex < newWidgets.length - 1) {
        [newWidgets[widgetIndex + 1], newWidgets[widgetIndex]] = [
          newWidgets[widgetIndex],
          newWidgets[widgetIndex + 1],
        ];
      }

      return newWidgets;
    });
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
              onClick={() => router.push("/login")}
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Builder Dashboard
            </h1>
          </div>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow space-y-8">
              {widgets
                .filter((w) => w.isVisible)
                .map((widget) => {
                  if (widget.id === "creditDashboard") {
                    return (
                      <DashboardWidget
                        key={widget.id}
                        title={widget.title}
                        onHide={() => handleWidgetAction(widget.id, "hide")}
                        onMoveUp={() => handleWidgetAction(widget.id, "moveUp")}
                        onMoveDown={() =>
                          handleWidgetAction(widget.id, "moveDown")
                        }
                      >
                        <CreditDashboard
                          developer={developer}
                          onCreditScoreUpdate={handleCreditScoreUpdate}
                        />
                      </DashboardWidget>
                    );
                  }
                  if (widget.id === "myProjects") {
                    return (
                      <DashboardWidget
                        key={widget.id}
                        title={widget.title}
                        onHide={() => handleWidgetAction(widget.id, "hide")}
                        onMoveUp={() => handleWidgetAction(widget.id, "moveUp")}
                        onMoveDown={() =>
                          handleWidgetAction(widget.id, "moveDown")
                        }
                      >
                        {registeredProjects.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {registeredProjects.map((project) => (
                              <ProjectCard
                                key={project.slug}
                                project={project}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 bg-gray-100 p-8 rounded-lg">
                            You haven't registered any projects yet.
                          </div>
                        )}
                      </DashboardWidget>
                    );
                  }
                  return null;
                })}
            </div>

            <div className="lg:w-1/3 lg:flex-shrink-0 space-y-8">
              {widgets
                .filter((w) => w.isVisible)
                .map((widget) => {
                  if (widget.id === "wallet") {
                    return (
                      <DashboardWidget
                        key={widget.id}
                        title={widget.title}
                        onHide={() => handleWidgetAction(widget.id, "hide")}
                        onMoveUp={() => handleWidgetAction(widget.id, "moveUp")}
                        onMoveDown={() =>
                          handleWidgetAction(widget.id, "moveDown")
                        }
                      >
                        <MetaMaskWallet />
                        <div className="mt-4">
                          <NetworkSwitcher />
                        </div>
                        <div className="mt-4">
                          <USDCBalanceDisplay />
                        </div>
                      </DashboardWidget>
                    );
                  }
                  if (widget.id === "funding" && creditScore) {
                    return (
                      <DashboardWidget
                        key={widget.id}
                        title={widget.title}
                        onHide={() => handleWidgetAction(widget.id, "hide")}
                        onMoveUp={() => handleWidgetAction(widget.id, "moveUp")}
                        onMoveDown={() =>
                          handleWidgetAction(widget.id, "moveDown")
                        }
                      >
                        <FundingInterface
                          creditScore={creditScore}
                          creditData={creditData}
                          onFundingComplete={handleFundingComplete}
                        />
                      </DashboardWidget>
                    );
                  }
                  return null;
                })}
            </div>
          </div>
        </div>
        <Footer />
      </div>

      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register a New Project"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsRegisterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRegisterProject}>Register & Stake</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-secondary">
            Register your project to start building your on-chain reputation. A
            nominal stake is required to prevent spam.
          </p>
          <Input
            label="GitHub Repository URL"
            placeholder="https://github.com/user/repo"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
        </div>
      </Modal>

      <FloatingActionButton
        onClick={() => setIsRegisterModalOpen(true)}
        aria-label="Register New Project"
      />
    </MetaMaskProviderWrapper>
  );
}
