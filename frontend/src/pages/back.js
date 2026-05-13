/**
 * Back Page — unified Expedition marketplace + Portfolio tracker
 */

import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import TabBar from "@/components/common/TabBar";
import ErrorBoundary from "@/components/ErrorBoundary";
import DiscoverTab from "@/components/back/DiscoverTab";
import PortfolioTab from "@/components/back/PortfolioTab";
import EconomyTab from "@/components/back/EconomyTab";
import { PrivacyOnboarding, PrivacyBadge } from "@/components/common/PrivacyShield";

const PRIVACY_STORAGE_KEY = 'pos_privacy_onboarding_dismissed';

export default function BackPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const [tab, setTabState] = useState("discover");
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Show privacy onboarding for first-time backers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(PRIVACY_STORAGE_KEY);
      if (!dismissed && userRole === 'backer') {
        setShowPrivacy(true);
      }
    }
  }, [userRole]);

  // Sync state with router query on mount and when router changes
  useEffect(() => {
    const queryTab = router.query.tab;
    if (queryTab && queryTab !== tab) {
      setTabState(queryTab);
    } else if (!queryTab && tab !== "discover") {
      setTabState("discover");
    }
  }, [router.query.tab, tab]);

  const setTab = (t) => {
    setTabState(t); // Update state immediately
    router.replace({ pathname: router.pathname, query: t === "discover" ? {} : { tab: t } }, undefined, { shallow: true });
  };

  const dismissPrivacy = () => {
    setShowPrivacy(false);
    localStorage.setItem(PRIVACY_STORAGE_KEY, '1');
  };

  const tabs = [
    { id: 'discover', label: 'Discover' },
    { id: 'portfolio', label: 'My Positions' },
    { id: 'economy', label: 'AI Agents' },
  ];

  return (
    <ErrorBoundary name="BackPage" errorMessage="Failed to load. Please refresh.">
      <Head><title>Back | Builder Credit</title></Head>
      <div className="min-h-screen bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Privacy onboarding — shown to first-time backers */}
          {showPrivacy && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={dismissPrivacy} />
              <div className="relative max-w-lg w-full">
                <PrivacyOnboarding onDismiss={dismissPrivacy} />
              </div>
            </div>
          )}

          {/* Page header with privacy badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Back Builders</h1>
              <PrivacyBadge />
            </div>
          </div>

          <TabBar
            tabs={tabs}
            activeTab={tab}
            onChange={setTab}
            variant="pill"
            className="mb-6"
          />

          {tab === "discover" ? (
            <ErrorBoundary name="DiscoverTab" errorMessage="Failed to load projects. Please try again.">
              <DiscoverTab />
            </ErrorBoundary>
          ) : tab === "portfolio" ? (
            <ErrorBoundary name="PortfolioTab" errorMessage="Failed to load positions. Please try again.">
              <PortfolioTab setTab={setTab} />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary name="EconomyTab" errorMessage="Failed to load AI agents. Please try again.">
              <EconomyTab />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
