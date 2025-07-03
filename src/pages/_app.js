import React from "react";
import localFont from "next/font/local";
import { EnhancedGithubProvider } from "@/providers/Github/EnhancedGithubProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { MetaMaskProviderWrapper as MetaMaskProvider } from "@/contexts/MetaMaskContext";
import { DecentralizedAuthProvider } from "@/contexts/DecentralizedAuthContext";
import { CircleWalletProvider } from "@/contexts/CircleWalletContext";
import { UserBehaviorProvider } from "@/contexts/UserBehaviorContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/components/common/Toast";
import { Navbar, Footer } from "@/components/common/layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { errorHandler } from "@/middleware/errorHandler";
import "@/styles/globals.css";

import NoSSR from "@/providers/NoSSR/NoSSR";
import useNoSSR from "@/providers/NoSSR/useNoSSR";

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

  // Initialize global error handling
  React.useEffect(() => {
    // Global error handler is automatically initialized
    if (process.env.NODE_ENV === "development") {
      console.log("Error handling initialized");
    }
  }, []);

  return (
    <ErrorBoundary
      name="App Root"
      errorMessage="The application failed to load. Please refresh the page."
    >
      <NoSSR>
        <ErrorBoundary
          name="Theme Provider"
          errorMessage="Theme system is unavailable."
        >
          <ThemeProvider>
            <ErrorBoundary
              name="Toast Provider"
              errorMessage="Notification system is unavailable."
            >
              <ToastProvider position="top-right" maxToasts={5}>
                <ErrorBoundary
                  name="Auth Provider"
                  errorMessage="Authentication service is unavailable."
                >
                  <MetaMaskProvider demand={false}>
                    <CircleWalletProvider>
                      <DecentralizedAuthProvider>
                        <UserBehaviorProvider>
                          <AuthProvider>
                            <div
                              className={`${geistSans.variable} ${geistMono.variable} min-h-screen min-w-[768px] font-[family-name:var(--font-geist-sans)] flex flex-col bg-background text-primary transition-colors`}
                            >
                              <ErrorBoundary
                                name="Enhanced Github Provider"
                                errorMessage="GitHub data service is unavailable."
                            >
                              <EnhancedGithubProvider>
                                <Navbar />
                                <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 flex-grow">
                                  <ErrorBoundary name="Page Component">
                                    <Component {...pageProps} />
                                  </ErrorBoundary>
                              </main>
                              <Footer />
                            </EnhancedGithubProvider>
                          </ErrorBoundary>
                        </div>
                      </AuthProvider>
                    </UserBehaviorProvider>
                  </DecentralizedAuthProvider>
                </CircleWalletProvider>
              </MetaMaskProvider>
            </ErrorBoundary>
            </ToastProvider>
          </ErrorBoundary>
          </ThemeProvider>
        </ErrorBoundary>
      </NoSSR>
    </ErrorBoundary>
  );
}
