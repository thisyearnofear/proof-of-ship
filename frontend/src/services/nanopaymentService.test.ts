import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPay = vi.fn();
const mockGetBalance = vi.fn();
const mockDeposit = vi.fn();
const mockWithdraw = vi.fn();

vi.mock('@circle-fin/x402-batching/client', () => {
  return {
    GatewayClient: class {
      getBalance = mockGetBalance;
      deposit = mockDeposit;
      withdraw = mockWithdraw;
      pay = mockPay;
    },
  };
});

import { nanopaymentService } from './nanopaymentService';

describe('nanopaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes Arc testnet config without throwing', async () => {
    await expect(
      nanopaymentService.initialize({
        chain: 'arcTestnet',
        privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
      })
    ).resolves.toBeTruthy();
  });

  it('returns payment_required for 402 responses', async () => {
    mockPay.mockResolvedValueOnce({
      status: 402,
      headers: { 'x-payment-requirement': 'Payment Required' },
    });

    await nanopaymentService.initialize({
      chain: 'arcTestnet',
      privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
    });

    const result = await nanopaymentService.pay('/api/agent/scout');
    expect(result.success).toBe(false);
    expect(result.status).toBe('payment_required');
  });
});
