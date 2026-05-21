/**
 * AppProviders — Consolidated Provider Composition (Phase 3C)
 * 
 * Consolidated from 10 contexts into 5 focused providers:
 * - WalletProvider: MetaMask + Circle Wallet + Nanopayment
 * - UserProvider: Firebase Auth + Decentralized Reputation
 * - AppProvider: Theme + User Behavior Tracking
 * - FinancialProvider: LiFi + Builder Credit
 * - EnhancedGithubProvider: GitHub data fetching
 */

import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import NoSSR from '@/providers/NoSSR/NoSSR';

import { WalletProvider } from '@/contexts/WalletContext';
import { CircleProvider } from '@/contexts/CircleContext';
import { CreditProvider } from '@/contexts/CreditContext';
import { NanopaymentProvider } from '@/contexts/NanopaymentContext';
import { UserProvider } from '@/contexts/UserContext';
import { AppProvider } from '@/contexts/AppContext';
import { FinancialProvider } from '@/contexts/FinancialContext';
import { ToastProvider } from '@/components/common/Toast';
import { EnhancedGithubProvider } from '@/providers/Github/EnhancedGithubProvider';

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
    <BoundProvider name='App Root'>
      <NoSSR>
        <AppProvider>
          <ToastProvider position='top-right' maxToasts={5}>
            <UserProvider>
              <WalletProvider demand={false}>
                <CircleProvider>
                  <CreditProvider>
                    <NanopaymentProvider>
                      <FinancialProvider>
                        <EnhancedGithubProvider>
                          {children}
                        </EnhancedGithubProvider>
                      </FinancialProvider>
                    </NanopaymentProvider>
                  </CreditProvider>
                </CircleProvider>
              </WalletProvider>
            </UserProvider>
          </ToastProvider>
        </AppProvider>
      </NoSSR>
    </BoundProvider>
  );
}