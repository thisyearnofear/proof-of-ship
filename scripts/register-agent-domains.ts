/**
 * SNS Agent Domain Registration Script
 *
 * Registers PledgeBond agent .sol domains on Solana devnet:
 *   pledgebond-scout.sol, pledgebond-underwriter.sol, pledgebond-verifier.sol, pledgebond-rebalance.sol
 *
 * These domains give each AI agent a human-readable on-chain identity,
 * satisfying the SNS Identity Track requirement for "AI agents with distinct
 * on-chain identities."
 *
 * Usage:
 *   npx ts-node scripts/register-agent-domains.ts
 *
 * Requires:
 *   - Funded wallet at ~/.config/solana/id.json (~0.05 SOL per domain)
 *   - @bonfida/spl-name-service installed (already in frontend/package.json)
 *
 * Tracks: Superteam SNS Identity Track ($5K)
 */

import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import {
  getDomainKeySync,
  createNameRegistry,
  NameRegistryState,
} from '@bonfida/spl-name-service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const AGENT_DOMAINS = [
  'pledgebond-scout',
  'pledgebond-underwriter',
  'pledgebond-verifier',
  'pledgebond-rebalance',
];

const CONNECTION = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed',
);

function loadWallet(): Keypair {
  const keypairPath = process.env.SOLANA_KEYPAIR_PATH
    || path.join(os.homedir(), '.config', 'solana', 'id.json');

  if (!fs.existsSync(keypairPath)) {
    console.error(`Wallet not found at ${keypairPath}`);
    console.error('Set SOLANA_KEYPAIR_PATH or run: solana-keygen new');
    process.exit(1);
  }

  const secret = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
  return Keypair.fromSecretKey(new Uint8Array(secret));
}

async function registerDomain(
  wallet: Keypair,
  domainName: string,
): Promise<{ domain: string; success: boolean; signature?: string; error?: string }> {
  const fullDomain = `${domainName}.sol`;

  try {
    // Check if already registered
    try {
      const { pubkey } = getDomainKeySync(domainName);
      const registry = await NameRegistryState.retrieve(CONNECTION, pubkey);
      if (registry && registry.owner) {
        const isOwnedByUs = registry.owner.toBase58() === wallet.publicKey.toBase58();
        return {
          domain: fullDomain,
          success: true,
          error: isOwnedByUs
            ? `Already owned by this wallet (${wallet.publicKey.toBase58().slice(0, 8)}...)`
            : `Already registered by ${registry.owner.toBase58().slice(0, 8)}...`,
        };
      }
    } catch {
      // Domain doesn't exist — proceed with registration
    }

    // Register the domain using SNS createNameRegistry
    const space = 0; // minimal space for name registry
    const lamports = await CONNECTION.getMinimumBalanceForRentExemption(
      NameRegistryState.HEADER_LEN + space,
    );

    const ix = await createNameRegistry(
      CONNECTION,
      fullDomain,
      space,
      wallet.publicKey, // payer
      wallet.publicKey, // owner
      lamports,
    );

    const tx = new Transaction().add(ix);
    tx.recentBlockhash = (await CONNECTION.getLatestBlockhash()).blockhash;
    tx.feePayer = wallet.publicKey;
    tx.sign(wallet);

    const signature = await CONNECTION.sendRawTransaction(tx.serialize());
    await CONNECTION.confirmTransaction(signature, 'confirmed');

    return { domain: fullDomain, success: true, signature };
  } catch (err: any) {
    return { domain: fullDomain, success: false, error: err.message };
  }
}

async function main() {
  console.log('=== PledgeBond — SNS Agent Domain Registration ===\n');

  const wallet = loadWallet();
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);

  const balance = await CONNECTION.getBalance(wallet.publicKey);
  console.log(`Balance: ${(balance / 1e9).toFixed(4)} SOL\n`);

  if (balance < 0.1 * 1e9) {
    console.error('Insufficient SOL balance. Need at least 0.1 SOL.');
    console.error('Get devnet SOL: solana airdrop 1 --url devnet');
    process.exit(1);
  }

  console.log('Registering agent domains...\n');

  const results = [];
  for (const domain of AGENT_DOMAINS) {
    process.stdout.write(`  ${domain}.sol ... `);
    const result = await registerDomain(wallet, domain);
    results.push(result);

    if (result.success && result.signature) {
      console.log(`OK (tx: ${result.signature})`);
    } else if (result.success && result.error) {
      console.log(`SKIP — ${result.error}`);
    } else {
      console.log(`FAIL — ${result.error}`);
    }
  }

  console.log('\n--- Summary ---');
  const registered = results.filter(r => r.success && r.signature).length;
  const skipped = results.filter(r => r.success && !r.signature).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`Registered: ${registered} | Skipped (already exists): ${skipped} | Failed: ${failed}`);

  if (registered > 0 || skipped > 0) {
    console.log('\nVerify domains are registered:');
    console.log('  npx ts-node scripts/verify-agent-domains.ts');
  }

  // Write results to a JSON file for the submission docs
  const outputPath = path.join(__dirname, '..', 'docs', 'agent-domain-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults written to ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
