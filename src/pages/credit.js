/**
 * Credit Dashboard Page
 * Main page for developer credit scoring and loan eligibility
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { CreditDashboard } from "@/components/credit";
import { Navbar, Footer } from "@/components/common/layout";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { MetaMaskProviderWrapper } from "../contexts/MetaMaskContext";
import MetaMaskWallet from "../components/MetaMaskWallet";
import FundingInterface from "../components/FundingInterface";
import { NetworkSwitcher } from "../components/wallet/NetworkSwitcher";
import { USDCBalanceDisplay } from "../components/wallet/USDCBalanceDisplay";
import { Modal } from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import ProjectCard from "@/components/projects/ProjectCard";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import DashboardWidget from "@/components/common/DashboardWidget";
import { Card } from "@/components/common/Card";

export default function CreditPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [developer, setDeveloper] = useState(null);
  const [creditScore, setCreditScore] = useState(null);
  const [creditData, setCreditData] = useState(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [registeredProjects, setRegisteredProjects] = useState([]);
  const [widgets, setWidgets] = useState([
    { id: "creditDashboard", title: "Credit Dashboard", isVisible: true },
    { id: "myProjects", title: "My Registered Projects", isVisible: true },
    { id: "wallet", title: "Wallet Connection", isVisible: true },
    { id: "funding", title: "Developer Funding", isVisible: true },
  ]);

  useEffect(() => {
    // For demo purposes, we'll use mock developer data
    // In production, this would fetch from user profile/database
    if (currentUser) {
      setDeveloper({
        id: currentUser.uid,
        name: currentUser.displayName || "Developer",
        email: currentUser.email,
        github: "developerdemo", // This would come from user's connected accounts
        farcaster: "developerdemo.eth", // This would come from user's connected accounts
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
