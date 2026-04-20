/**
 * Credit Service Tests
 * Unit tests for creditService module (Phase 3B)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { creditService } from './creditService';

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    utils: {
      parseUnits: vi.fn((value, decimals) => BigInt(value) * BigInt(10) ** BigInt(decimals)),
      formatUnits: vi.fn((value, decimals) => value.toString()),
    },
    constants: {
      MaxUint256: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
    },
    Contract: vi.fn().mockImplementation(() => ({
      creditLines: vi.fn(),
      requestFunding: vi.fn(),
      repayLoan: vi.fn(),
    })),
  },
}));

describe('CreditService', () => {
  describe('getContracts', () => {
    it('should return null if chainId is missing', () => {
      const result = creditService.getContracts(null, {});
      expect(result).toBeNull();
    });

    it('should return null if signerOrProvider is missing', () => {
      const result = creditService.getContracts(1, null);
      expect(result).toBeNull();
    });

    it('should throw error for unsupported network', () => {
      expect(() => creditService.getContracts(999999, {})).toThrow(
        'Platform not supported on network 999999'
      );
    });

    it('should return contracts for supported network', () => {
      const mockSigner = {};
      const result = creditService.getContracts(84532, mockSigner); // Base Sepolia
      
      expect(result).not.toBeNull();
      expect(result?.core).toBeDefined();
      expect(result?.usdc).toBeDefined();
      expect(result?.registry).toBeDefined();
    });
  });

  describe('repayLoan', () => {
    it('should throw error if contracts not found', async () => {
      await expect(
        creditService.repayLoan(999999, {}, 100)
      ).rejects.toThrow('Contracts not found');
    });
  });
});