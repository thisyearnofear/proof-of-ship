/**
 * Create a Circle Developer-Controlled Wallet for the Agent on ARC.
 * Run from the frontend/ directory so the SDK module resolves.
 *
 * Usage: node scripts/create-agent-wallet.mjs
 * Expects CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, CIRCLE_WALLET_SET_ID in .env.local
 */
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { config } from "dotenv";
import { randomUUID } from "crypto";
import { resolve } from "path";

config({ path: resolve(import.meta.dirname, "../.env.local") });

const API_KEY = process.env.TEST_CIRCLE_API_KEY || process.env.CIRCLE_API_KEY;
const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET;
const WALLET_SET_ID = process.env.CIRCLE_WALLET_SET_ID;

if (!API_KEY || !ENTITY_SECRET || !WALLET_SET_ID) {
  console.error("Missing Circle credentials. Check CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, CIRCLE_WALLET_SET_ID.");
  process.exit(1);
}

console.log("Using API key starting with:", API_KEY.substring(0, 15));

const client = initiateDeveloperControlledWalletsClient({
  apiKey: API_KEY,
  entitySecret: ENTITY_SECRET,
});

async function main() {
  // Check existing ARC wallets
  const existing = await client.listWallets({ walletSetId: WALLET_SET_ID });
  const arcWallets = existing.data?.wallets?.filter(w => w.blockchain === "ARC") || [];

  if (arcWallets.length > 0) {
    console.log("Existing ARC wallet(s) found:");
    for (const w of arcWallets) {
      console.log(`  Wallet ID: ${w.id}`);
      console.log(`  Address:   ${w.address}`);
      console.log(`  State:     ${w.state}`);
      console.log("");
    }
    console.log("CIRCLE_AGENT_WALLET_ID=" + arcWallets[0].id);
    console.log("");
    if (!process.env.FORCE_NEW) {
      console.log("Reuse the wallet above. Set FORCE_NEW=1 to create a new one.");
      return;
    }
  }

  console.log("Creating new ARC wallet...");
  const resp = await client.createWallets({
    idempotencyKey: randomUUID(),
    walletSetId: WALLET_SET_ID,
    blockchains: ["ARC-TESTNET"],
    count: 1,
  });

  const wallet = resp.data?.wallets?.[0];
  if (!wallet) {
    console.error("Failed to create wallet.", JSON.stringify(resp, null, 2));
    process.exit(1);
  }

  console.log("\n=== Agent Wallet Created ===");
  console.log(`Wallet ID:      ${wallet.id}`);
  console.log(`Address:        ${wallet.address}`);
  console.log(`Blockchain:     ${wallet.blockchain}`);
  console.log(`Custody Type:   ${wallet.custodyType}`);
  console.log(`State:          ${wallet.state}`);
  console.log("");
  console.log("CIRCLE_AGENT_WALLET_ID=" + wallet.id);
  console.log("");
  console.log("Fund this address with Arc Testnet USDC.");
}

main().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
