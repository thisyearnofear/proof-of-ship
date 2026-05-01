/**
 * Back Page — unified Expedition marketplace + Portfolio tracker
 */

import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import TabBar from "@/components/common/TabBar";
import ErrorBoundary from "@/components/ErrorBoundary";
import DiscoverTab from "@/components/back/DiscoverTab";
import PortfolioTab from "@/components/back/PortfolioTab";
import EconomyTab from "@/components/back/EconomyTab";

export default function BackPage() {
  const router = useRouter();
  // Use state + useEffect to ensure proper re-render when tab changes
  const [tab, setTabState] = useState("discover");

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
