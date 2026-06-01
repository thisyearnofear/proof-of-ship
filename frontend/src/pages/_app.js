import React from "react";
import { useRouter } from "next/router";
import localFont from "next/font/local";
import dynamic from "next/dynamic";
import AppProviders from "@/providers/AppProviders";
import { Navbar, Footer } from "@/components/common/layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import "@/styles/globals.css";
import "@/styles/nautical.css";
import "@/styles/themes.css";

import useNoSSR from "@/providers/NoSSR/useNoSSR";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";

const AIAnalysisModal = dynamic(() => import("@/components/common/AIAnalysisModal"), { ssr: false });
const OnboardingBanner = dynamic(() => import("@/components/common/OnboardingBanner"), { ssr: false });
const AIChatWidget = dynamic(() => import("@/components/common/AIChatWidget"), { ssr: false });

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

function RouteLoadingBar() {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const start = () => setLoading(true);
    const end = () => setLoading(false);

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", end);
    router.events.on("routeChangeError", end);

    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", end);
      router.events.off("routeChangeError", end);
    };
  }, [router]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1">
      <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 animate-pulse" />
    </div>
  );
}

export default function App({ Component, pageProps }) {
  useNoSSR(() => {});
  useKeyboardShortcuts();

  // Initialize global error handling
  React.useEffect(() => {
    const init = async () => {
      try {
        const { initObservability } = await import("@/lib/observability");
        initObservability();
      } catch (err) {
        console.warn("Observability init failed:", err);
      }

      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        await sdk.actions.ready();
      } catch (error) {
        if (error?.message?.includes('sdk')) {
          console.warn("Farcaster miniapp-sdk not available (expected outside Warpcast)");
        } else {
          console.error("Farcaster SDK initialization failed", error);
        }
      }
    };
    init();
  }, []);

  return (
    <AppProviders>
      <RouteLoadingBar />
      <div
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-[family-name:var(--font-geist-sans)] flex flex-col bg-background text-primary transition-colors`}
      >
        <Navbar />
        <OnboardingBanner />
        {Component.fullWidth ? (
          <ErrorBoundary name="Page Component">
            <Component {...pageProps} />
          </ErrorBoundary>
        ) : (
          <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 flex-grow">
            <ErrorBoundary name="Page Component">
              <Component {...pageProps} />
            </ErrorBoundary>
          </main>
        )}
        <Footer />
        <AIAnalysisModal />
        <AIChatWidget />
      </div>
    </AppProviders>
  );
}
