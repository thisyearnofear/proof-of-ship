import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.ethereum for tests
const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  isMetaMask: true,
  isConnected: vi.fn(() => true),
  chainId: '0x1',
  networkVersion: '1',
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;