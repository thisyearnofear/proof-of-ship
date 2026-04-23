/**
 * AppProviders — Refactored flat provider composition (Phase 2C)
 * Providers are now flattened, removing implicit dependency chains where possible.
 */

import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import NoSSR from '@/providers/NoSSR/NoSSR';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/common/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { MetaMaskProviderWrapper as MetaMaskProvider } from '@/contexts/MetaMaskContext';
import { BuilderCreditProvider } from '@/contexts/BuilderCreditContext';
import { ReputationProvider } from '@/contexts/ReputationContext';
import { NanopaymentProvider } from '@/contexts/NanopaymentContext';
import { EnhancedGithubProvider } from '@/providers/Github/EnhancedGithubProvider';
import { UserBehaviorProvider } from '@/contexts/UserBehaviorContext';

// Helper: wrap a provider with an error boundary
function BoundProvider({ name, children }) {
  return (
    <ErrorBoundary name={name} errorMessage={`${name} is currently unavailable.`}>
      {children}
    </ErrorBoundary>
  );
}

export default function AppProviders({ children }) {
  return (
    <BoundProvider name="App Root">
      <NoSSR>
        <ThemeProvider>
          <ToastProvider position="top-right" maxToasts={5}>
            <AuthProvider>
              <MetaMaskProvider demand={false}>
                <BuilderCreditProvider>
                  <NanopaymentProvider>
                    <ReputationProvider>
                      <EnhancedGithubProvider>
                        <UserBehaviorProvider>
                          {children}
                        </UserBehaviorProvider>
                      </EnhancedGithubProvider>
                  </ReputationProvider>
                  </NanopaymentProvider>
                </BuilderCreditProvider>
              </MetaMaskProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </NoSSR>
    </BoundProvider>
  );
}
