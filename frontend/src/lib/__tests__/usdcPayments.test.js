/**
 * Tests for USDC Payment Service
 * These tests validate the core functionality of the USDC payment service
 */

import { USDCPaymentService, formatUSDC, getFundingTier } from '../usdcPayments';

// Mock environment variables for testing
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    CIRCLE_API_KEY: undefined,
    CIRCLE_ENVIRONMENT: 'sandbox'
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('USDCPaymentService', () => {
  let service;

  beforeEach(() => {
    service = new USDCPaymentService();
  });

  describe('calculateFundingAmount', () => {
    test('returns 0 for credit scores below 400', () => {
      expect(service.calculateFundingAmount(300)).toBe(0);
      expect(service.calculateFundingAmount(399)).toBe(0);
    });

    test('returns maximum funding for excellent credit scores', () => {
      expect(service.calculateFundingAmount(800)).toBe(5000);
      expect(service.calculateFundingAmount(850)).toBe(5000);
    });

    test('calculates proportional funding for mid-range scores', () => {
      const amount600 = service.calculateFundingAmount(600);
      const amount700 = service.calculateFundingAmount(700);
      
      expect(amount600).toBeGreaterThan(500);
      expect(amount600).toBeLessThan(5000);
      expect(amount700).toBeGreaterThan(amount600);
    });
  });

  describe('getFundingEligibility', () => {
    test('returns ineligible for low credit scores', () => {
      const eligibility = service.getFundingEligibility(350);
      
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.amount).toBe(0);
      expect(eligibility.requirements.length).toBeGreaterThan(0);
    });

    test('returns eligible for good credit scores', () => {
      const eligibility = service.getFundingEligibility(720);
      
      expect(eligibility.eligible).toBe(true);
      expect(eligibility.amount).toBeGreaterThan(0);
      expect(eligibility.benefits.length).toBeGreaterThan(0);
    });
  });

  describe('validateWalletAddress', () => {
    test('validates correct Ethereum addresses', () => {
      const validAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      expect(service.validateWalletAddress(validAddress)).toBe(true);
    });

    test('rejects invalid addresses', () => {
      expect(service.validateWalletAddress('invalid')).toBe(false);
      expect(service.validateWalletAddress('')).toBe(false);
      expect(service.validateWalletAddress(null)).toBe(false);
      expect(service.validateWalletAddress('0x123')).toBe(false);
    });
  });

  describe('processDeveloperFunding', () => {
    test('processes mock funding when API key not configured', async () => {
      const result = await service.processDeveloperFunding(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        720,
        {}
      );

      expect(result.success).toBe(true);
      expect(result.mockFunding).toBe(true);
      expect(result.amount).toBeGreaterThan(0);
      expect(result.transfer.mock).toBe(true);
    });

    test('throws error for low credit scores', async () => {
      await expect(
        service.processDeveloperFunding(
          '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          300,
          {}
        )
      ).rejects.toThrow('Credit score too low');
    });
  });

  describe('configuration', () => {
    test('detects when API is not configured', () => {
      expect(service.isConfigured()).toBe(false);
    });

    test('returns correct environment', () => {
      expect(service.getEnvironment()).toBe('sandbox');
    });
  });
});

describe('Helper Functions', () => {
  describe('formatUSDC', () => {
    test('formats amounts correctly', () => {
      expect(formatUSDC(1000)).toBe('$1,000.00');
      expect(formatUSDC(1234.56)).toBe('$1,234.56');
      expect(formatUSDC(0)).toBe('$0.00');
    });
  });

  describe('getFundingTier', () => {
    test('returns correct tiers for different scores', () => {
      expect(getFundingTier(850).tier).toBe('Excellent');
      expect(getFundingTier(750).tier).toBe('Good');
      expect(getFundingTier(650).tier).toBe('Fair');
      expect(getFundingTier(550).tier).toBe('Poor');
      expect(getFundingTier(450).tier).toBe('Very Poor');
    });

    test('returns correct colors for tiers', () => {
      expect(getFundingTier(850).color).toBe('green');
      expect(getFundingTier(750).color).toBe('blue');
      expect(getFundingTier(650).color).toBe('yellow');
      expect(getFundingTier(550).color).toBe('orange');
      expect(getFundingTier(450).color).toBe('red');
    });
  });
});
