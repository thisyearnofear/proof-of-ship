/**
 * SNS Agent Domain Registration Script
 *
 * Registers PledgeBond agent .sol domains on Solana devnet:
 *   pledgebond-scout.sol, pledgebond-underwriter.sol, pledgebond-verifier.sol, pledgebond-rebalance.sol
 *
 * Usage:
 *   node scripts/register-agent-domains.js
 *
 * Tracks: Superteam SNS Identity Track ($5K)
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// Resolve Solana deps from frontend/node_modules
const frontendModules = path.join(__dirname, '..', 'frontend', 'node_modules');
const { Connection, Keypair, Transaction } = require(path.join(frontendModules, '@solana', 'web3.js'));
const { getDomainKeySync, createNameRegistry, NameRegistryState } = require(path.join(frontendModules, '@bonfida', 'spl-name-service', 'dist', 'cjs'));

const AGENT_DOMAINS = ['pledgebond-scout', 'pledgebond-underwriter', 'pledgebond-verifier', 'pledgebond-rebalance'];

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed',
);

function loadWallet() {
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

async function registerDomain(wallet, domainName) {
  const fullDomain = `${domainName}.sol`;

  try {
    // Check if already registered
    try {
      const { pubkey } = getDomainKeySync(domainName);
      const registry = await NameRegistryState.retrieve(connection, pubkey);
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

    const space = 0;
    const lamports = await connection.getMinimumBalanceForRentExemption(
      NameRegistryState.HEADER_LEN + space,
    );

    const ix = await createNameRegistry(
      connection,
      fullDomain,
      space,
      wallet.publicKey,
      wallet.publicKey,
      lamports,
    );

    const tx = new Transaction().add(ix);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = wallet.publicKey;
    tx.sign(wallet);

    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(signature, 'confirmed');

    return { domain: fullDomain, success: true, signature };
  } catch (err) {
    return { domain: fullDomain, success: false, error: err.message };
  }
}

async function main() {
  console.log('=== PledgeBond — SNS Agent Domain Registration ===\n');

  const wallet = loadWallet();
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);

  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`Balance: ${(balance / 1e9).toFixed(4)} SOL\n`);

  if (balance < 0.05 * 1e9) {
    console.error('Insufficient SOL balance. Need at least 0.05 SOL.');
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
  console.log(`Registered: ${registered} | Skipped: ${skipped} | Failed: ${failed}`);

  if (registered > 0 || skipped > 0) {
    console.log('\nVerify: node scripts/verify-agent-domains.js');
  }

  const outputPath = path.join(__dirname, '..', 'docs', 'agent-domain-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Results written to ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
