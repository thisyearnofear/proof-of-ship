/**
 * AppProviders — Consolidated Provider Composition
 */

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider } from 'connectkit';
import { wagmiConfig } from '@/config/wagmi';
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

const queryClient = new QueryClient();

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
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <ConnectKitProvider>
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
            </ConnectKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </NoSSR>
    </BoundProvider>
  );
}
