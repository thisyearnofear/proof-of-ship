/**
 * SNS Agent Domain Verification Script
 *
 * Verifies that PledgeBond agent .sol domains are registered and resolves
 * their on-chain owner addresses. Used after registration and in submission docs.
 *
 * Usage:
 *   npx ts-node scripts/verify-agent-domains.ts
 *
 * Tracks: Superteam SNS Identity Track ($5K)
 */

import { Connection, PublicKey } from '@solana/web3.js';
import {
  getDomainKeySync,
  NameRegistryState,
  getDomainKeysWithReverses,
} from '@bonfida/spl-name-service';

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

async function verifyDomain(domainName: string) {
  const fullDomain = `${domainName}.sol`;

  try {
    const { pubkey } = getDomainKeySync(domainName);
    const registry = await NameRegistryState.retrieve(CONNECTION, pubkey);

    return {
      domain: fullDomain,
      registered: true,
      address: pubkey.toBase58(),
      owner: registry.owner.toBase58(),
      explorer: `https://explorer.solana.com/address/${pubkey.toBase58()}?cluster=devnet`,
    };
  } catch (err: any) {
    return {
      domain: fullDomain,
      registered: false,
      error: err.message,
    };
  }
}

async function main() {
  console.log('=== PledgeBond — SNS Agent Domain Verification ===\n');

  const results = await Promise.all(AGENT_DOMAINS.map(verifyDomain));

  for (const r of results) {
    if (r.registered) {
      console.log(`  OK  ${r.domain}`);
      console.log(`      Address: ${r.address}`);
      console.log(`      Owner:   ${r.owner}`);
      console.log(`      Verify:  ${r.explorer}`);
    } else {
      console.log(`  FAIL  ${r.domain} — ${r.error}`);
    }
    console.log('');
  }

  const registered = results.filter(r => r.registered).length;
  console.log(`\n${registered}/${results.length} agent domains verified.`);

  if (registered === results.length) {
    console.log('All agent .sol domains are registered and verifiable on-chain.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
