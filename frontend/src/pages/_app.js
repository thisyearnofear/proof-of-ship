import React from "react";
import localFont from "next/font/local";
import sdk from "@farcaster/frame-sdk";
import AppProviders from "@/providers/AppProviders";
import { Navbar, Footer } from "@/components/common/layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import "@/styles/globals.css";
import "@/styles/nautical.css";
import "@/styles/themes.css";

import useNoSSR from "@/providers/NoSSR/useNoSSR";
import { initObservability } from "@/lib/observability";
import AIAnalysisModal from "@/components/common/AIAnalysisModal";
import OnboardingBanner from "@/components/common/OnboardingBanner";
import AIChatWidget from "@/components/common/AIChatWidget";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function App({ Component, pageProps }) {
  useNoSSR(() => {});
  useKeyboardShortcuts();

  // Initialize global error handling
  React.useEffect(() => {
    // Initialize observability (PostHog/Sentry)
    initObservability();

    const init = async () => {
      try {
        await sdk.actions.ready();
      } catch (error) {
        console.error("Farcaster Frame SDK initialization failed", error);
      }
    };
    init();
  }, []);

  return (
    <AppProviders>
      <div
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-[family-name:var(--font-geist-sans)] flex flex-col bg-background text-primary transition-colors`}
      >
        <Navbar />
        <OnboardingBanner />
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 flex-grow">
          <ErrorBoundary name="Page Component">
            <Component {...pageProps} />
          </ErrorBoundary>
        </main>
        <Footer />
        <AIAnalysisModal />
        <AIChatWidget />
      </div>
    </AppProviders>
  );
}
