/**
 * Create a Circle Developer-Controlled Wallet for the Agent on ARC.
 *
 * Usage: node scripts/create-agent-wallet.js
 *
 * Reads CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, CIRCLE_WALLET_SET_ID from env.
 * Creates an ARC wallet and prints the wallet ID for CIRCLE_AGENT_WALLET_ID.
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../frontend/.env.local") });

const { initiateDeveloperControlledWalletsClient } = require("@circle-fin/developer-controlled-wallets");

const API_KEY = process.env.CIRCLE_API_KEY;
const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET;
const WALLET_SET_ID = process.env.CIRCLE_WALLET_SET_ID;

if (!API_KEY || !ENTITY_SECRET || !WALLET_SET_ID) {
  console.error("Missing Circle credentials. Check CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, CIRCLE_WALLET_SET_ID.");
  process.exit(1);
}

const client = initiateDeveloperControlledWalletsClient({
  apiKey: API_KEY,
  entitySecret: ENTITY_SECRET,
});

async function main() {
  // Check existing wallets first
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
    console.log("Use the wallet ID above as CIRCLE_AGENT_WALLET_ID.");
    console.log("To create a new wallet anyway, run with FORCE_NEW=1");
    if (!process.env.FORCE_NEW) return;
  }

  console.log("Creating new ARC wallet...");
  const resp = await client.createWallets({
    idempotencyKey: require("crypto").randomUUID(),
    walletSetId: WALLET_SET_ID,
    blockchains: ["ARC"],
    count: 1,
  });

  const wallet = resp.data?.wallets?.[0];
  if (!wallet) {
    console.error("Failed to create wallet. Response:", JSON.stringify(resp, null, 2));
    process.exit(1);
  }

  console.log("\n=== Agent Wallet Created ===");
  console.log(`Wallet ID:      ${wallet.id}`);
  console.log(`Address:        ${wallet.address}`);
  console.log(`Blockchain:     ${wallet.blockchain}`);
  console.log(`Custody Type:   ${wallet.custodyType}`);
  console.log(`State:          ${wallet.state}`);
  console.log("");
  console.log("Add to frontend/.env.local:");
  console.log(`CIRCLE_AGENT_WALLET_ID=${wallet.id}`);
  console.log("");
  console.log("Then fund this address with Arc Testnet USDC.");
}

main().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
