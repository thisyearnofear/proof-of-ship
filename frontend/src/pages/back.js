/**
 * Back Page — unified project marketplace + portfolio + agents hub
 */

import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useUser } from "@/stores/authStore";
import { normalizeBackTab } from "@/config/navigation";
import TabBar from "@/components/common/TabBar";
import Modal from "@/components/common/Modal";
import ErrorBoundary from "@/components/ErrorBoundary";
import DiscoverTab from "@/components/back/DiscoverTab";
import PortfolioTab from "@/components/back/PortfolioTab";
import AgentsTab from "@/components/back/AgentsTab";
import { PrivacyOnboarding, PrivacyBadge } from "@/components/common/PrivacyShield";

const PRIVACY_STORAGE_KEY = "pos_privacy_onboarding_dismissed";

export default function BackPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const [tab, setTabState] = useState("discover");
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(PRIVACY_STORAGE_KEY);
      if (!dismissed && userRole === "backer") {
        setShowPrivacy(true);
      }
    }
  }, [userRole]);

  useEffect(() => {
    if (!router.isReady) return;
    const rawTab = Array.isArray(router.query.tab) ? router.query.tab[0] : router.query.tab;
    if (rawTab === "economy") {
      const query = { tab: "agents" };
      if (router.query.mode) query.mode = router.query.mode;
      router.replace({ pathname: "/back", query }, undefined, { shallow: true });
      return;
    }
    const normalized = normalizeBackTab(router.query.tab);
    if (normalized && normalized !== tab) {
      setTabState(normalized);
    } else if (!normalized && tab !== "discover") {
      setTabState("discover");
    }
  }, [router.isReady, router.query.tab, tab]);

  const setTab = (t) => {
    setTabState(t);
    const query = t === "discover" ? {} : { tab: t };
    if (t === "agents" && router.query.mode) {
      query.mode = router.query.mode;
    }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

  const dismissPrivacy = () => {
    setShowPrivacy(false);
    localStorage.setItem(PRIVACY_STORAGE_KEY, "1");
  };

  const tabs = [
    { id: "discover", label: "Discover" },
    { id: "portfolio", label: "My Positions" },
    { id: "agents", label: "Agents" },
  ];

  return (
    <ErrorBoundary name="BackPage" errorMessage="Failed to load. Please refresh.">
      <Head><title>Back | Builder Credit</title></Head>
      <div className="min-h-screen bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Modal
            isOpen={showPrivacy}
            onClose={dismissPrivacy}
            showCloseButton={false}
            size="md"
            className="p-0 overflow-hidden"
          >
            <PrivacyOnboarding onDismiss={dismissPrivacy} />
          </Modal>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Back Builders</h1>
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
            <ErrorBoundary name="AgentsTab" errorMessage="Failed to load AI agents. Please try again.">
              <AgentsTab />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
