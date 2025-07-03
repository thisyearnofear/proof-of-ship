/**
 * Circle Wallet Context Tests
 * 
 * Tests the integration between CircleWalletContext and the Circle API endpoints
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { CircleWalletProvider, useCircleWallet } from '../src/contexts/CircleWalletContext';
import fetchMock from 'jest-fetch-mock';

// Enable fetch mocking
fetchMock.enableMocks();

// Mock component that uses the CircleWalletContext
const TestComponent = () => {
  const circleWallet = useCircleWallet();
  
  return (
    <div>
      <div data-testid="loading">{circleWallet.loading.toString()}</div>
      <div data-testid="initialized">{circleWallet.isInitialized.toString()}</div>
      <div data-testid="error">{circleWallet.error || 'no-error'}</div>
      <div data-testid="wallets-count">{circleWallet.wallets.length}</div>
      <button 
        data-testid="check-api" 
        onClick={() => circleWallet.checkAPIConfiguration()}
      >
        Check API
      </button>
      <button 
        data-testid="create-wallet" 
        onClick={() => circleWallet.createWallet({
          name: 'Test Wallet',
          description: 'Created for testing'
        })}
      >
        Create Wallet
      </button>
    </div>
  );
};

describe('CircleWalletContext', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should initialize and load wallet configuration', async () => {
    // Mock configuration API response
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      data: {
        walletSetId: 'test-wallet-set-id',
        entitySecretCiphertext: 'test-entity-secret',
        environment: 'sandbox',
        supportedTokens: ['USDC', 'ETH'],
        supportedBlockchains: ['ETH', 'MATIC']
      }
    }));

    // Mock status API response
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      data: {
        apiKeyConfigured: true,
        walletSetConfigured: true,
        entitySecretConfigured: true,
        environment: 'sandbox',
        ping: 'OK'
      }
    }));

    // Mock wallets API response
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      data: {
        wallets: []
      }
    }));

    // Render the test component with the provider
    render(
      <CircleWalletProvider>
        <TestComponent />
      </CircleWalletProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true');

    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('initialized').textContent).toBe('true');
      expect(screen.getByTestId('error').textContent).toBe('no-error');
    });

    // Should have made API calls
    expect(fetchMock.mock.calls.length).toBe(3);
    expect(fetchMock.mock.calls[0][0]).toEqual('/api/circle/config');
  });

  it('should handle API configuration errors', async () => {
    // Mock configuration API error response
    fetchMock.mockResponseOnce(JSON.stringify({
      success: false,
      error: 'API key not configured'
    }), { status: 500 });

    // Render the test component with the provider
    render(
      <CircleWalletProvider>
        <TestComponent />
      </CircleWalletProvider>
    );

    // Wait for error to be set
    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).not.toBe('no-error');
      expect(screen.getByTestId('initialized').textContent).toBe('false');
    });
  });

  it('should create a new wallet', async () => {
    // Mock successful configuration response
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      data: {
        walletSetId: 'test-wallet-set-id',
        entitySecretCiphertext: 'test-entity-secret',
        environment: 'sandbox'
      }
    }));

    // Mock status API response
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      data: {
        apiKeyConfigured: true
      }
    }));

    // Mock empty wallets response
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      data: {
        wallets: []
      }
    }));

    // Mock wallet creation response
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      data: {
        wallets: [{
          id: 'test-wallet-id',
          address: '0x1234567890abcdef',
          blockchain: 'ETH',
          walletSetId: 'test-wallet-set-id'
        }]
      }
    }));

    // Render the test component with the provider
    render(
      <CircleWalletProvider>
        <TestComponent />
      </CircleWalletProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Reset fetch mock to clear previous calls
    fetchMock.resetMocks();

    // Click create wallet button
    await act(async () => {
      screen.getByTestId('create-wallet').click();
    });

    // Should have made wallet creation API call
    expect(fetchMock.mock.calls.length).toBe(1);
    expect(fetchMock.mock.calls[0][0]).toEqual('/api/circle/wallets');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toHaveProperty('metadata');
  });

  it('should check API configuration', async () => {
    // Mock configuration responses
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      data: {
        walletSetId: 'test-wallet-set-id'
      }
    }));
    
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      data: {
        apiKeyConfigured: true
      }
    }));
    
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      data: {
        wallets: []
      }
    }));

    // Mock status API call response
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      data: {
        apiKeyConfigured: true,
        environment: 'sandbox',
        ping: 'OK'
      }
    }));

    // Render the component
    render(
      <CircleWalletProvider>
        <TestComponent />
      </CircleWalletProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    // Reset mock to clear initialization calls
    fetchMock.resetMocks();

    // Check API configuration
    await act(async () => {
      screen.getByTestId('check-api').click();
    });

    // Should have made API status call
    expect(fetchMock.mock.calls.length).toBe(1);
    expect(fetchMock.mock.calls[0][0]).toEqual('/api/circle/status');
  });
});