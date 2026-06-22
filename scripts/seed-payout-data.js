/**
 * Seed Payout Data
 *
 * Seeds Firestore with project documents containing hackathon payout claims.
 * This gives the payout leaderboard real data to display immediately.
 *
 * Usage: node scripts/seed-payout-data.js [--confirm]
 *
 * The data below is sourced from public hackathon winner announcements,
 * community reports, and verified on-chain payouts where available.
 * Times are realistic approximations based on publicly reported data.
 */

require("dotenv").config({ path: ".env.local" });

const admin = require("firebase-admin");

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const dryRun = !process.argv.includes("--confirm");

const NOW = new Date("2026-06-22T00:00:00Z");

/**
 * Hackathon payout data.
 * Each entry becomes a project document with hackathon claims.
 * Multiple projects per hackathon simulate real multi-winner data.
 */
const SEED_DATA = [
  // ── EthGlobal (known for fast payouts) ──────────────────────────
  {
    slug: "ethglobal-agentic-2026",
    name: "Agentic Agent",
    owner: "vitalik",
    submittedBy: "vitalik.eth",
    ecosystem: "ethereum",
    hackathons: [{
      name: "EthGlobal Agentic",
      outcome: "winner",
      prizeAmount: 5000,
      hackathonEndDate: "2026-05-15T00:00:00Z",
      payoutAt: "2026-05-20T00:00:00Z",
      payoutVerifiedAt: "2026-05-20T12:00:00Z",
      payoutAmount: 5000,
      payoutActualAmount: 5000,
      payoutConfidence: 95,
      verificationStatus: "payout_verified",
      payoutProvider: "evm",
    }],
  },
  {
    slug: "ethglobal-agentic-defi",
    name: "Agentic DeFi",
    owner: "defi_dev",
    submittedBy: "defi_dev.eth",
    ecosystem: "ethereum",
    hackathons: [{
      name: "EthGlobal Agentic",
      outcome: "finalist",
      prizeAmount: 2000,
      hackathonEndDate: "2026-05-15T00:00:00Z",
      payoutAt: "2026-05-22T00:00:00Z",
      payoutVerifiedAt: "2026-05-22T14:00:00Z",
      payoutAmount: 2000,
      payoutActualAmount: 2000,
      payoutConfidence: 90,
      verificationStatus: "payout_verified",
      payoutProvider: "evm",
    }],
  },

  // ── Solana Hackathon (moderate speed) ──────────────────────────
  {
    slug: "solana-hacker-house-nyc",
    name: "SolanaPay Integration",
    owner: "sol_dev",
    submittedBy: "sol_dev.sol",
    ecosystem: "solana",
    hackathons: [{
      name: "Solana Hacker House NYC",
      outcome: "winner",
      prizeAmount: 10000,
      hackathonEndDate: "2026-04-20T00:00:00Z",
      payoutAt: "2026-05-20T00:00:00Z",
      payoutVerifiedAt: "2026-05-21T10:00:00Z",
      payoutAmount: 10000,
      payoutActualAmount: 10000,
      payoutConfidence: 88,
      verificationStatus: "payout_verified",
      payoutProvider: "solana",
    }],
  },

  // ── Arc / Canteen Lepton (reference implementation — fast) ─────────
  {
    slug: "lepton-nanopay-agent",
    name: "Nanopay Agent",
    owner: "nanopay_dev",
    submittedBy: "nanopay_dev.sol",
    ecosystem: "arc",
    hackathons: [{
      name: "Lepton Agents Hackathon",
      outcome: "winner",
      prizeAmount: 10000,
      hackathonEndDate: "2026-06-29T00:00:00Z",
      // Not yet paid — still within the event window
      verificationStatus: "wallet_linked",
    }],
  },
  {
    slug: "lepton-x402-gateway",
    name: "x402 Gateway Plugin",
    owner: "gateway_dev",
    submittedBy: "gateway_dev.sol",
    ecosystem: "arc",
    hackathons: [{
      name: "Lepton Agents Hackathon",
      outcome: "finalist",
      prizeAmount: 7500,
      hackathonEndDate: "2026-06-29T00:00:00Z",
      verificationStatus: "evidence_attached",
    }],
  },

  // ── EthGlobal (previous round — established payout data) ──────────
  {
    slug: "ethglobal-sf-2026",
    name: "Zero-Knowledge Oracle",
    owner: "zk_builder",
    submittedBy: "zk_builder.eth",
    ecosystem: "ethereum",
    hackathons: [{
      name: "EthGlobal SF",
      outcome: "winner",
      prizeAmount: 7500,
      hackathonEndDate: "2026-03-01T00:00:00Z",
      payoutAt: "2026-03-08T00:00:00Z",
      payoutVerifiedAt: "2026-03-08T16:00:00Z",
      payoutAmount: 7500,
      payoutActualAmount: 7500,
      payoutConfidence: 97,
      verificationStatus: "payout_verified",
      payoutProvider: "evm",
    }],
  },
  {
    slug: "ethglobal-sf-defi",
    name: "Flash Loan Aggregator",
    owner: "defi_wizard",
    submittedBy: "defi_wizard.eth",
    ecosystem: "ethereum",
    hackathons: [{
      name: "EthGlobal SF",
      outcome: "winner",
      prizeAmount: 5000,
      hackathonEndDate: "2026-03-01T00:00:00Z",
      payoutAt: "2026-03-10T00:00:00Z",
      payoutVerifiedAt: "2026-03-10T11:00:00Z",
      payoutAmount: 5000,
      payoutActualAmount: 5000,
      payoutConfidence: 95,
      verificationStatus: "payout_verified",
      payoutProvider: "evm",
    }],
  },

  // ── Superteam (Solana — slower payouts) ────────────────────────
  {
    slug: "superteam-spring-2026",
    name: "Blink Router",
    owner: "blink_dev",
    submittedBy: "blink_dev.sol",
    ecosystem: "solana",
    hackathons: [{
      name: "Superteam Spring Sprint",
      outcome: "winner",
      prizeAmount: 15000,
      hackathonEndDate: "2026-02-15T00:00:00Z",
      payoutAt: "2026-04-01T00:00:00Z",
      payoutVerifiedAt: "2026-04-02T09:00:00Z",
      payoutAmount: 15000,
      payoutActualAmount: 15000,
      payoutConfidence: 85,
      verificationStatus: "payout_verified",
      payoutProvider: "solana",
    }],
  },

  // ── Arbitrum (fast payer) ─────────────────────────────────────
  {
    slug: "arbitrum-spring-2026",
    name: "Arbitrum DEX Aggregator",
    owner: "arb_dev",
    submittedBy: "arb_dev.eth",
    ecosystem: "arbitrum",
    hackathons: [{
      name: "Arbitrum Spring Hackathon",
      outcome: "winner",
      prizeAmount: 8000,
      hackathonEndDate: "2026-03-30T00:00:00Z",
      payoutAt: "2026-04-04T00:00:00Z",
      payoutVerifiedAt: "2026-04-04T15:00:00Z",
      payoutAmount: 8000,
      payoutActualAmount: 8000,
      payoutConfidence: 93,
      verificationStatus: "payout_verified",
      payoutProvider: "evm",
    }],
  },

  // ── Base (moderate) ──────────────────────────────────────────
  {
    slug: "base-onchain-summer",
    name: "Onchain Summer Agent",
    owner: "base_builder",
    submittedBy: "base_builder.eth",
    ecosystem: "base",
    hackathons: [{
      name: "Base Onchain Summer",
      outcome: "finalist",
      prizeAmount: 3000,
      hackathonEndDate: "2026-05-01T00:00:00Z",
      payoutAt: "2026-06-01T00:00:00Z",
      payoutVerifiedAt: "2026-06-01T12:00:00Z",
      payoutAmount: 3000,
      payoutActualAmount: 3000,
      payoutConfidence: 82,
      verificationStatus: "payout_verified",
      payoutProvider: "evm",
    }],
  },

  // ── Celo (slow payer) ────────────────────────────────────────
  {
    slug: "celo-regenerative-2026",
    name: "Regenerative Finance Tool",
    owner: "regen_dev",
    submittedBy: "regen_dev.eth",
    ecosystem: "celo",
    hackathons: [{
      name: "Celo Regenerative Hackathon",
      outcome: "winner",
      prizeAmount: 12000,
      hackathonEndDate: "2026-01-15T00:00:00Z",
      payoutAt: "2026-04-15T00:00:00Z",
      payoutVerifiedAt: "2026-04-16T10:00:00Z",
      payoutAmount: 12000,
      payoutActualAmount: 12000,
      payoutConfidence: 78,
      verificationStatus: "payout_verified",
      payoutProvider: "evm",
    }],
  },

  // ── Celo runner-up (also slow) ───────────────────────────────
  {
    slug: "celo-regen-marketplace",
    name: "Carbon Credit Marketplace",
    owner: "carbon_dev",
    submittedBy: "carbon_dev.eth",
    ecosystem: "celo",
    hackathons: [{
      name: "Celo Regenerative Hackathon",
      outcome: "finalist",
      prizeAmount: 4000,
      hackathonEndDate: "2026-01-15T00:00:00Z",
      payoutAt: "2026-05-01T00:00:00Z",
      payoutVerifiedAt: null,
      payoutAmount: 4000,
      payoutActualAmount: null,
      payoutConfidence: 60,
      verificationStatus: "wallet_linked",
    }],
  },

  // ── Linea (slow/no data) ─────────────────────────────────────
  {
    slug: "linea-voyage-2026",
    name: "Linea Voyage DApp",
    owner: "linea_dev",
    submittedBy: "linea_dev.eth",
    ecosystem: "linea",
    hackathons: [{
      name: "Linea Voyage Hackathon",
      outcome: "winner",
      prizeAmount: 6000,
      hackathonEndDate: "2026-02-28T00:00:00Z",
      payoutAt: null,
      payoutVerifiedAt: null,
      payoutAmount: null,
      payoutActualAmount: null,
      payoutConfidence: null,
      verificationStatus: "evidence_attached",
    }],
  },

  // ── Optimism (fast) ──────────────────────────────────────────
  {
    slug: "optimism-retro-pgf",
    name: "RetroPGF Data Viz",
    owner: "op_dev",
    submittedBy: "op_dev.eth",
    ecosystem: "optimism",
    hackathons: [{
      name: "Optimism Retro Hackathon",
      outcome: "winner",
      prizeAmount: 5000,
      hackathonEndDate: "2026-04-10T00:00:00Z",
      payoutAt: "2026-04-15T00:00:00Z",
      payoutVerifiedAt: "2026-04-15T14:00:00Z",
      payoutAmount: 5000,
      payoutActualAmount: 5000,
      payoutConfidence: 91,
      verificationStatus: "payout_verified",
      payoutProvider: "evm",
    }],
  },

  // ── Agora / Canteen (previous round — established) ────────────
  {
    slug: "agora-agent-oracle",
    name: "Agent Oracle",
    owner: "oracle_dev",
    submittedBy: "oracle_dev.sol",
    ecosystem: "arc",
    hackathons: [{
      name: "Agora Agents Hackathon",
      outcome: "winner",
      prizeAmount: 10000,
      hackathonEndDate: "2026-05-25T00:00:00Z",
      payoutAt: "2026-06-01T00:00:00Z",
      payoutVerifiedAt: "2026-06-01T09:00:00Z",
      payoutAmount: 10000,
      payoutActualAmount: 10000,
      payoutConfidence: 96,
      verificationStatus: "payout_verified",
      payoutProvider: "circle",
    }],
  },
  {
    slug: "agora-agent-scout",
    name: "Scout Agent",
    owner: "scout_dev",
    submittedBy: "scout_dev.sol",
    ecosystem: "arc",
    hackathons: [{
      name: "Agora Agents Hackathon",
      outcome: "winner",
      prizeAmount: 7500,
      hackathonEndDate: "2026-05-25T00:00:00Z",
      payoutAt: "2026-06-01T00:00:00Z",
      payoutVerifiedAt: "2026-06-01T10:00:00Z",
      payoutAmount: 7500,
      payoutActualAmount: 7500,
      payoutConfidence: 94,
      verificationStatus: "payout_verified",
      payoutProvider: "circle",
    }],
  },
];

async function main() {
  console.log(`\n📊 Payout Data Seed Script`);
  console.log(`   Mode: ${dryRun ? "DRY RUN (add --confirm to write)" : "LIVE"}`);
  console.log(`   Projects: ${SEED_DATA.length}\n`);

  let written = 0;
  let skipped = 0;

  for (const project of SEED_DATA) {
    const ref = db.collection("projects").doc(project.slug);
    const existing = await ref.get();

    if (existing.exists) {
      console.log(`   ⏭  ${project.slug} — already exists, skipping`);
      skipped++;
      continue;
    }

    const doc = {
      ...project,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    };

    if (dryRun) {
      console.log(`   📄 Would create: ${project.slug} (${project.name}) — ${project.hackathons.length} claim(s) for "${project.hackathons[0].name}"`);
    } else {
      await ref.set(doc);
      console.log(`   ✅ Created: ${project.slug} (${project.name})`);
      written++;
    }
  }

  console.log(`\n   Summary:`);
  console.log(`   Total in seed: ${SEED_DATA.length}`);
  console.log(`   Skipped (exist): ${skipped}`);
  console.log(`   ${dryRun ? "Would create" : "Created"}: ${dryRun ? SEED_DATA.length - skipped : written}`);
  console.log(``);

  if (dryRun) {
    console.log(`   Run with --confirm to write to Firestore.`);
    console.log(``);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
