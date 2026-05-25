/**
 * Credit Service Tests
 * Unit tests for creditService module (Phase 3B)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { creditService } from './creditService';

// Mock viem
vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    parseUnits: vi.fn((value: string, decimals: number) => BigInt(value) * BigInt(10) ** BigInt(decimals)),
    formatUnits: vi.fn((value: bigint, decimals: number) => value.toString()),
    maxUint256: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
  };
});

describe('CreditService', () => {
  describe('getContracts', () => {
    it('should return null if chainId is missing', () => {
      const result = creditService.getContracts(null as any, {} as any);
      expect(result).toBeNull();
    });

    it('should throw error for unsupported network', () => {
      expect(() => creditService.getContracts(999999, {} as any)).toThrow(
        'Platform not supported on network 999999'
      );
    });

    it('should return contracts for supported network', () => {
      const mockClient = {} as any;
      const result = creditService.getContracts(84532, mockClient); // Base Sepolia

      expect(result).not.toBeNull();
      expect(result?.core).toBeDefined();
      expect(result?.usdc).toBeDefined();
      expect(result?.registry).toBeDefined();
    });
  });

  describe('repayLoan', () => {
    it('should throw error if contracts not found', async () => {
      await expect(
        creditService.repayLoan(999999, {} as any, {} as any, 100)
      ).rejects.toThrow('Platform not supported on network 999999');
    });
  });
});