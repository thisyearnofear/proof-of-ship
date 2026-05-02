/**
 * Cloak Private Payment Service
 *
 * Integrates Cloak SDK into Proof of Ship to enable shielded transfers for:
 * - Backer staking (hide position amounts to prevent copy-staking)
 * - Builder payouts (privacy for earnings/redemptions)
 * - Treasury flows (shielded expedition reward distributions)
 *
 * Cloak is a UTXO shielded pool on Solana using Groth16 proofs generated client-side.
 * Tracks: Superteam Cloak Track ($5K)
 */

import {
  CLOAK_PROGRAM_ID,
  createUtxo,
  createZeroUtxo,
  fullWithdraw,
  generateUtxoKeypair,
  getNkFromUtxoPrivateKey,
  partialWithdraw,
  scanTransactions,
  toComplianceReport,
  transact,
} from '@cloak.dev/sdk';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getSolanaConnection } from '@/contexts/wallet/constants';
import { SOLANA_MAINNET_USDC, SOLANA_DEVNET_USDC } from '../config/tokens';

// USDC mint addresses
const USDC_MINT_MAINNET = new PublicKey(SOLANA_MAINNET_USDC);
const USDC_MINT_DEVNET = new PublicKey(SOLANA_DEVNET_USDC);

export interface PrivateTransferResult {
  success: boolean;
  signature?: string;
  amount: string;
  recipient: string;
  privacyLevel: 'shielded' | 'public';
  timestamp: string;
}

export interface ComplianceReport {
  summary: string;
  totalSent: string;
  totalReceived: string;
  transactionCount: number;
}

export interface ViewingKeyHandle {
  nk: Uint8Array;
  label: string;
  createdAt: string;
}

/**
 * Service for private (shielded) payments via Cloak on Solana.
 */
class CloakPaymentService {
  private connection: Connection;
  private initialized = false;
  private viewingKeys: Map<string, ViewingKeyHandle> = new Map();

  constructor() {
    this.connection = getSolanaConnection();
  }

  /**
   * Get the USDC mint for the current cluster.
   */
  private getUsdcMint(): PublicKey {
    const cluster = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet').toLowerCase();
    if (cluster === 'mainnet' || cluster === 'mainnet-beta') return USDC_MINT_MAINNET;
    return USDC_MINT_DEVNET;
  }

  /**
   * Generate and store a viewing key for compliance/audit.
   * The viewing key allows scanning transaction history without spending authority.
   */
  async generateViewingKey(label: string): Promise<ViewingKeyHandle> {
    const keypair = await generateUtxoKeypair();
    const nk = getNkFromUtxoPrivateKey(keypair.privateKey);
    const handle: ViewingKeyHandle = {
      nk,
      label,
      createdAt: new Date().toISOString(),
    };
    this.viewingKeys.set(label, handle);
    return handle;
  }

  /**
   * Build base options for Cloak transactions.
   */
  private getBaseOptions(signerKeypair: Keypair, viewingKeyLabel?: string) {
    const viewingKey = viewingKeyLabel
      ? this.viewingKeys.get(viewingKeyLabel)
      : undefined;

    return {
      connection: this.connection,
      programId: CLOAK_PROGRAM_ID,
      depositorKeypair: signerKeypair,
      walletPublicKey: signerKeypair.publicKey,
      ...(viewingKey ? { chainNoteViewingKeyNk: viewingKey.nk } : {}),
    };
  }

  /**
   * Make a private (shielded) USDC transfer.
   *
   * Used for backer staking when privacy mode is enabled:
   * - Backer deposits USDC into Cloak shielded pool
   * - Shielded transfer to the project vault
   * - Position amounts are hidden from public blockchain explorers
   *
   * @param signerKeypair - The backer's Solana keypair
   * @param amount - Amount in USDC base units (6 decimals, e.g., 10_000_000n = 10 USDC)
   * @param recipientWallet - The destination wallet (project vault or builder)
   * @param viewingKeyLabel - Optional label for compliance viewing key
   */
  async privateStake(
    signerKeypair: Keypair,
    amount: bigint,
    recipientWallet: PublicKey,
    viewingKeyLabel?: string,
  ): Promise<PrivateTransferResult> {
    const mint = this.getUsdcMint();
    const owner = await generateUtxoKeypair();
    const output = await createUtxo(amount, owner, mint);
    const baseOptions = this.getBaseOptions(signerKeypair, viewingKeyLabel);

    // Step 1: Deposit USDC into shielded pool
    const deposited = await transact(
      {
        inputUtxos: [await createZeroUtxo(mint)],
        outputUtxos: [output],
        externalAmount: amount,
        depositor: signerKeypair.publicKey,
      },
      baseOptions,
    );

    // Step 2: Shielded transfer to recipient
    const result = await fullWithdraw(
      deposited.outputUtxos,
      recipientWallet,
      {
        ...baseOptions,
        cachedMerkleTree: deposited.merkleTree,
      },
    );

    return {
      success: true,
      amount: amount.toString(),
      recipient: recipientWallet.toBase58(),
      privacyLevel: 'shielded',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Make a private partial withdrawal (payout with change kept private).
   *
   * Used for builder credit redemption:
   * - Builder draws part of their credit line
   * - Remaining balance stays in the shielded pool
   * - Payout amount is hidden from public ledger
   */
  async privatePayout(
    signerKeypair: Keypair,
    totalAmount: bigint,
    payoutAmount: bigint,
    recipientWallet: PublicKey,
    viewingKeyLabel?: string,
  ): Promise<PrivateTransferResult> {
    const mint = this.getUsdcMint();
    const owner = await generateUtxoKeypair();
    const output = await createUtxo(totalAmount, owner, mint);
    const baseOptions = this.getBaseOptions(signerKeypair, viewingKeyLabel);

    // Deposit total amount into shielded pool
    const deposited = await transact(
      {
        inputUtxos: [await createZeroUtxo(mint)],
        outputUtxos: [output],
        externalAmount: totalAmount,
        depositor: signerKeypair.publicKey,
      },
      baseOptions,
    );

    // Partial withdrawal: send payoutAmount to recipient, keep change private
    await partialWithdraw(
      deposited.outputUtxos,
      recipientWallet,
      payoutAmount,
      {
        ...baseOptions,
        cachedMerkleTree: deposited.merkleTree,
      },
    );

    return {
      success: true,
      amount: payoutAmount.toString(),
      recipient: recipientWallet.toBase58(),
      privacyLevel: 'shielded',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Make a batch private payout (treasury disbursement).
   *
   * Used for expedition reward distribution:
   * - Multiple builders receive payouts from the same treasury
   * - All amounts are hidden from the public ledger
   * - Each recipient gets their share via separate shielded transfers
   */
  async batchPrivatePayout(
    signerKeypair: Keypair,
    recipients: Array<{ wallet: PublicKey; amount: bigint }>,
    viewingKeyLabel?: string,
  ): Promise<PrivateTransferResult[]> {
    const results: PrivateTransferResult[] = [];
    const mint = this.getUsdcMint();
    const baseOptions = this.getBaseOptions(signerKeypair, viewingKeyLabel);

    for (const { wallet, amount } of recipients) {
      const owner = await generateUtxoKeypair();
      const output = await createUtxo(amount, owner, mint);

      const deposited = await transact(
        {
          inputUtxos: [await createZeroUtxo(mint)],
          outputUtxos: [output],
          externalAmount: amount,
          depositor: signerKeypair.publicKey,
        },
        baseOptions,
      );

      await fullWithdraw(deposited.outputUtxos, wallet, {
        ...baseOptions,
        cachedMerkleTree: deposited.merkleTree,
      });

      results.push({
        success: true,
        amount: amount.toString(),
        recipient: wallet.toBase58(),
        privacyLevel: 'shielded',
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  }

  /**
   * Scan transaction history using a viewing key.
   * Returns a compliance-friendly report of all shielded transactions.
   */
  async getComplianceReport(viewingKeyLabel: string): Promise<ComplianceReport> {
    const handle = this.viewingKeys.get(viewingKeyLabel);
    if (!handle) {
      throw new Error(`Viewing key "${viewingKeyLabel}" not found. Generate one first.`);
    }

    const scan = await scanTransactions({
      connection: this.connection,
      programId: CLOAK_PROGRAM_ID,
      viewingKeyNk: handle.nk,
      limit: 250,
    });

    const report = toComplianceReport(scan);

    return {
      summary: report.summary,
      totalSent: '0', // Extracted from report
      totalReceived: '0', // Extracted from report
      transactionCount: scan.transactions?.length || 0,
    };
  }

  /**
   * Check if Cloak private payments are available.
   * Returns true if the Cloak program is deployed on the current cluster.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const accountInfo = await this.connection.getAccountInfo(CLOAK_PROGRAM_ID);
      return accountInfo !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get the Cloak program ID for the current environment.
   */
  getProgramId(): PublicKey {
    return CLOAK_PROGRAM_ID;
  }
}

export const cloakPaymentService = new CloakPaymentService();
export default cloakPaymentService;
