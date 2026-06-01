/**
 * AppProviders — Consolidated Provider Composition
 *
 * Phase 3: collapsed 7 React contexts (User, Wallet, Circle, Credit, Financial,
 * Nanopayment, App) into 3 useSyncExternalStore stores. The 7 provider wrappers
 * are gone. `WalletHydrator` keeps the live wagmi/Solana state flowing into
 * `walletStore`. `init*()` calls are idempotent.
 */

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider } from 'connectkit';
import { wagmiConfig } from '@/config/wagmi';
import ErrorBoundary from '@/components/ErrorBoundary';
import NoSSR from '@/providers/NoSSR/NoSSR';

import { ToastProvider } from '@/components/common/Toast';
import { EnhancedGithubProvider } from '@/providers/Github/EnhancedGithubProvider';
import { WalletHydrator, initWalletStore } from '@/stores/walletStore';
import { initAuthStore } from '@/stores/authStore';
import { initProfileStore } from '@/stores/profileStore';

const queryClient = new QueryClient();

function BoundProvider({ name, children }) {
  return (
    <ErrorBoundary name={name} errorMessage={`${name} is currently unavailable.`}>
      {children}
    </ErrorBoundary>
  );
}

let initialized = false;
function initStores() {
  if (initialized) return;
  initialized = true;
  initProfileStore();
  initAuthStore();
  initWalletStore();
}

export default function AppProviders({ children }) {
  initStores();
  return (
    <BoundProvider name='App Root'>
      <NoSSR>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <ConnectKitProvider>
              <ToastProvider position='top-right' maxToasts={5}>
                <EnhancedGithubProvider>
                  <WalletHydrator />
                  {children}
                </EnhancedGithubProvider>
              </ToastProvider>
            </ConnectKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </NoSSR>
    </BoundProvider>
  );
}
