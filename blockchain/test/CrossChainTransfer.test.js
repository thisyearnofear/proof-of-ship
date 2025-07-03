import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import CrossChainTransfer from '../src/components/CrossChainTransfer';
import { LiFiProvider } from '../src/contexts/LiFiContext';
import { MetaMaskProvider } from '../src/contexts/MetaMaskContext';
import { BuilderCreditProvider } from '../src/contexts/BuilderCreditContext';

// Mock the LI.FI SDK
jest.mock('@lifi/sdk', () => {
  return {
    LiFi: jest.fn().mockImplementation(() => ({
      getChains: jest.fn().mockResolvedValue({
        chains: [
          { id: 1, name: 'Ethereum', nativeCurrency: { symbol: 'ETH' } },
          { id: 137, name: 'Polygon', nativeCurrency: { symbol: 'MATIC' } }
        ]
      }),
      getTokens: jest.fn().mockResolvedValue({
        tokens: {
          1: [
            { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
            { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
          ],
          137: [
            { address: '0x0000000000000000000000000000000000000000', symbol: 'MATIC', name: 'Polygon', decimals: 18 },
            { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
          ]
        }
      }),
      getQuote: jest.fn().mockResolvedValue({
        action: {
          fromChainId: 1,
          toChainId: 137,
          fromToken: { symbol: 'USDC', decimals: 6 },
          toToken: { symbol: 'USDC', decimals: 6 },
          fromAmount: '1000000' // 1 USDC
        },
        estimate: {
          toAmount: '980000', // 0.98 USDC after fees
          executionDuration: 300,
          feeCosts: [
            { name: 'Bridge Fee', amount: '20000', token: { symbol: 'USDC', decimals: 6 } }
          ],
          gasCosts: [
            { name: 'Source Chain Gas', amount: '5000000000000000', token: { symbol: 'ETH', decimals: 18 } }
          ]
        },
        tool: 'Connext',
        includedSteps: [{ tool: 'Connext' }]
      }),
      executeQuote: jest.fn().mockResolvedValue({
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      }),
      getStatus: jest.fn().mockResolvedValue({ status: 'DONE' }),
      getRoutes: jest.fn().mockResolvedValue({ routes: [] }),
      subscribeToStatus: jest.fn().mockReturnValue({ unsubscribe: jest.fn() })
    }))
  };
});

// Mock ethers
jest.mock('ethers', () => {
  return {
    ethers: {
      utils: {
        parseUnits: jest.fn().mockImplementation((amount, decimals) => {
          return String(Number(amount) * Math.pow(10, decimals));
        }),
        formatUnits: jest.fn().mockImplementation((amount, decimals) => {
          return String(Number(amount) / Math.pow(10, decimals));
        })
      },
      providers: {
        Web3Provider: jest.fn().mockImplementation(() => ({
          getSigner: jest.fn().mockReturnValue({})
        }))
      }
    }
  };
});

// Mock context values
const mockMetaMaskContext = {
  account: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: 1,
  provider: {},
  connected: true,
  connecting: false,
  switchNetwork: jest.fn(),
  networkConfigs: {
    1: { chainId: '0x1', chainName: 'Ethereum', nativeCurrency: { symbol: 'ETH' } },
    137: { chainId: '0x89', chainName: 'Polygon', nativeCurrency: { symbol: 'MATIC' } }
  }
};

const mockBuilderCreditContext = {
  usdcBalance: '100.00'
};

// A wrapper to provide all necessary contexts
const AllProviders = ({ children }) => {
  return (
    <MetaMaskProvider initialValues={mockMetaMaskContext}>
      <BuilderCreditProvider initialValues={mockBuilderCreditContext}>
        <LiFiProvider>
          {children}
        </LiFiProvider>
      </BuilderCreditProvider>
    </MetaMaskProvider>
  );
};

describe('CrossChainTransfer Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders the component with initial state', async () => {
    await act(async () => {
      render(
        <AllProviders>
          <CrossChainTransfer />
        </AllProviders>
      );
    });

    // Check if main title is rendered
    expect(screen.getByText('Cross-Chain Transfer')).toBeInTheDocument();
    
    // Check if the form elements are rendered
    expect(screen.getByText('From Chain')).toBeInTheDocument();
    expect(screen.getByText('To Chain')).toBeInTheDocument();
    expect(screen.getByText('Amount (USDC)')).toBeInTheDocument();
    
    // Check if information notice is shown
    expect(screen.getByText('About Cross-Chain Transfers')).toBeInTheDocument();
  });

  test('shows available balance and allows max button', async () => {
    await act(async () => {
      render(
        <AllProviders>
          <CrossChainTransfer />
        </AllProviders>
      );
    });

    // Check if balance is displayed
    expect(screen.getByText(/Available: 100.00 USDC/)).toBeInTheDocument();
    
    // Check if MAX button works
    const maxButton = screen.getByText('MAX');
    const amountInput = screen.getByPlaceholderText('Enter amount');
    
    await act(async () => {
      fireEvent.click(maxButton);
    });
    
    expect(amountInput.value).toBe('100.00');
  });

  test('fetches quote when amount and chains are selected', async () => {
    await act(async () => {
      render(
        <AllProviders>
          <CrossChainTransfer />
        </AllProviders>
      );
    });
    
    // Enter amount
    const amountInput = screen.getByPlaceholderText('Enter amount');
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '1.0' } });
    });
    
    // Click the Get Quote button
    const getQuoteButton = screen.getByText('Get Quote');
    await act(async () => {
      fireEvent.click(getQuoteButton);
    });
    
    // Wait for the quote to be fetched
    await waitFor(() => {
      expect(screen.getByText('Transfer Quote')).toBeInTheDocument();
    });
    
    // Check if quote details are shown
    expect(screen.getByText('You Send:')).toBeInTheDocument();
    expect(screen.getByText('You Receive:')).toBeInTheDocument();
    expect(screen.getByText('Route:')).toBeInTheDocument();
    expect(screen.getByText('Est. Time:')).toBeInTheDocument();
  });

  test('executes transfer after getting quote', async () => {
    await act(async () => {
      render(
        <AllProviders>
          <CrossChainTransfer />
        </AllProviders>
      );
    });
    
    // Enter amount
    const amountInput = screen.getByPlaceholderText('Enter amount');
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '1.0' } });
    });
    
    // Get quote
    const getQuoteButton = screen.getByText('Get Quote');
    await act(async () => {
      fireEvent.click(getQuoteButton);
    });
    
    // Wait for the quote to be fetched
    await waitFor(() => {
      expect(screen.getByText('Transfer Quote')).toBeInTheDocument();
    });
    
    // Execute transfer
    const executeButton = screen.getByText('Execute Transfer');
    await act(async () => {
      fireEvent.click(executeButton);
    });
    
    // Check if success message is shown
    await waitFor(() => {
      expect(screen.getByText('Transfer Initiated Successfully!')).toBeInTheDocument();
    });
    
    // Check if transaction hash is displayed
    expect(screen.getByText('Transaction Hash:')).toBeInTheDocument();
    expect(screen.getByText(/0x1234.*abcdef/)).toBeInTheDocument();
  });

  test('shows error message when transfer fails', async () => {
    // Mock the executeQuote to throw an error
    require('@lifi/sdk').LiFi.mockImplementation(() => ({
      getChains: jest.fn().mockResolvedValue({
        chains: [
          { id: 1, name: 'Ethereum', nativeCurrency: { symbol: 'ETH' } },
          { id: 137, name: 'Polygon', nativeCurrency: { symbol: 'MATIC' } }
        ]
      }),
      getTokens: jest.fn().mockResolvedValue({
        tokens: {
          1: [
            { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
            { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
          ],
          137: [
            { address: '0x0000000000000000000000000000000000000000', symbol: 'MATIC', name: 'Polygon', decimals: 18 },
            { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
          ]
        }
      }),
      getQuote: jest.fn().mockResolvedValue({
        action: {
          fromChainId: 1,
          toChainId: 137,
          fromToken: { symbol: 'USDC', decimals: 6 },
          toToken: { symbol: 'USDC', decimals: 6 },
          fromAmount: '1000000'
        },
        estimate: {
          toAmount: '980000',
          executionDuration: 300,
          feeCosts: [],
          gasCosts: []
        },
        tool: 'Connext'
      }),
      executeQuote: jest.fn().mockRejectedValue(new Error('Insufficient funds')),
      getStatus: jest.fn().mockResolvedValue({ status: 'DONE' }),
      getRoutes: jest.fn().mockResolvedValue({ routes: [] }),
      subscribeToStatus: jest.fn().mockReturnValue({ unsubscribe: jest.fn() })
    }));
    
    await act(async () => {
      render(
        <AllProviders>
          <CrossChainTransfer />
        </AllProviders>
      );
    });
    
    // Enter amount
    const amountInput = screen.getByPlaceholderText('Enter amount');
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '1.0' } });
    });
    
    // Get quote
    const getQuoteButton = screen.getByText('Get Quote');
    await act(async () => {
      fireEvent.click(getQuoteButton);
    });
    
    // Wait for the quote to be fetched
    await waitFor(() => {
      expect(screen.getByText('Transfer Quote')).toBeInTheDocument();
    });
    
    // Execute transfer
    const executeButton = screen.getByText('Execute Transfer');
    await act(async () => {
      fireEvent.click(executeButton);
    });
    
    // Check if error message is shown
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
    });
  });

  test('shows advanced options when toggled', async () => {
    await act(async () => {
      render(
        <AllProviders>
          <CrossChainTransfer />
        </AllProviders>
      );
    });
    
    // Click advanced options toggle
    const advancedToggle = screen.getByText('Advanced Options');
    await act(async () => {
      fireEvent.click(advancedToggle);
    });
    
    // Check if advanced options are shown
    expect(screen.getByText('Slippage Tolerance')).toBeInTheDocument();
    expect(screen.getByText('Gas Price (Gwei)')).toBeInTheDocument();
    expect(screen.getByText('Infinite token approval (not recommended)')).toBeInTheDocument();
  });
});