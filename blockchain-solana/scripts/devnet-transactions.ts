/**
 * Devnet Transaction Runner
 *
 * Generates real on-chain transactions against the deployed Proof of Ship
 * Anchor program on Solana devnet. Produces verifiable transaction signatures
 * for the Colosseum hackathon submission.
 *
 * Usage:
 *   SNS_DOMAIN=your-name.sol anchor run devnet-transactions --provider.cluster devnet
 *
 * Requires:
 *   - Funded wallet (~2 SOL) at ~/.config/solana/id.json
 *   - `SNS_DOMAIN` set to a `.sol` domain owned by that wallet
 *   - Deployed program (see anchor deploy output)
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Ed25519Program,
  Keypair,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  mintTo,
} from "@solana/spl-token";
import { getDomainKeySync } from "@bonfida/spl-name-service";

// Devnet USDC mint (Circle's official devnet USDC)
const DEVNET_USDC = new PublicKey("4zMMC9srtvSqzRLsS51uVtoQpYp5yFdC8PYy8Y79zNLX");

function normalizeSnsDomain(domain: string): string {
  return domain.endsWith(".sol") ? domain : `${domain}.sol`;
}

function buildIdentityClaimMessage(
  developer: PublicKey,
  snsNameAccount: PublicKey,
  builderSnsDomain: string,
  projectName: string,
  githubUrl: string
) {
  return new TextEncoder().encode(
    `proof-of-ship:sns-identity:v1:${developer.toBase58()}:${snsNameAccount.toBase58()}:${builderSnsDomain}:${projectName}:${githubUrl}`
  );
}

const txLog: { action: string; tx: string; detail: string }[] = [];
function log(action: string, tx: string, detail: string = "") {
  txLog.push({ action, tx, detail });
  console.log(`\n[OK] ${action}`);
  console.log(`     tx: ${tx}`);
  if (detail) console.log(`     ${detail}`);
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BlockchainSolana as any;
  const payer = (provider.wallet as any).payer;
  const dev = provider.wallet.publicKey;
  const builderSnsDomain = normalizeSnsDomain(process.env.SNS_DOMAIN || "");
  if (!builderSnsDomain || builderSnsDomain === ".sol") {
    throw new Error("Set SNS_DOMAIN to a .sol domain owned by the devnet wallet before running this script.");
  }
  const { pubkey: snsNameAccount } = getDomainKeySync(builderSnsDomain);

  console.log("=== Proof of Ship — Devnet Transaction Runner ===");
  console.log(`Program ID: ${program.programId.toBase58()}`);
  console.log(`Developer:  ${dev.toBase58()}`);
  console.log(`RPC:        ${provider.connection.rpcEndpoint}\n`);

  // ── 1. Create mock USDC mint (we can't mint real devnet USDC) ──
  console.log("--- Creating mock USDC mint ---");
  const usdcMint = await createMint(
    provider.connection, payer, dev, null, 6
  );
  console.log(`USDC Mint: ${usdcMint.toBase58()}`);

  // ── 2. Initialize Treasury ──
  console.log("\n--- Initializing protocol treasury ---");
  const [treasuryAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")], program.programId
  );
  const treasuryTokenAccount = getAssociatedTokenAddressSync(usdcMint, treasuryAuthority, true);

  const tx1 = await program.methods
    .initializeTreasury()
    .accounts({
      treasuryAuthority,
      usdcMint,
      treasuryTokenAccount,
      authority: dev,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .rpc();
  log("Initialize Treasury", tx1, `Treasury ATA: ${treasuryTokenAccount.toBase58()}`);

  // ── 3. Create Project with milestones ──
  console.log("\n--- Creating project with milestones ---");
  const projectName = `pos-demo-${Date.now()}`;
  const [project] = PublicKey.findProgramAddressSync(
    [Buffer.from("project"), dev.toBuffer(), Buffer.from(projectName)],
    program.programId
  );
  const [creditLine] = PublicKey.findProgramAddressSync(
    [Buffer.from("credit_line"), dev.toBuffer()],
    program.programId
  );
  const [milestoneVaultAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("milestone_vault_authority"), project.toBuffer()],
    program.programId
  );
  const milestoneVault = getAssociatedTokenAddressSync(usdcMint, milestoneVaultAuthority, true);
  const [backerVaultAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("backer_vault_authority"), project.toBuffer()],
    program.programId
  );
  const backerEscrowVault = getAssociatedTokenAddressSync(usdcMint, backerVaultAuthority, true);
  const identityMessage1 = buildIdentityClaimMessage(
    dev,
    snsNameAccount,
    builderSnsDomain,
    projectName,
    "https://github.com/thisyearnofear/proof-of-ship"
  );
  const identityProofIx1 = Ed25519Program.createInstructionWithPrivateKey({
    privateKey: payer.secretKey,
    message: identityMessage1,
  });
  const identitySignature1 = identityProofIx1.data.slice(48, 112);

  const tx2 = await program.methods
    .requestFunding(
      [new anchor.BN(1), new anchor.BN(2)],
      "https://github.com/thisyearnofear/proof-of-ship",
      projectName,
      ["Deploy on-chain program", "Run 50+ transactions"],
      [new anchor.BN(5_000_000), new anchor.BN(3_000_000)],
      dev,
      builderSnsDomain,
      Array.from(identitySignature1),
      new anchor.BN(500)
    )
    .accounts({
      project,
      creditLine,
      milestoneVaultAuthority,
      milestoneVault,
      backerVaultAuthority,
      backerEscrowVault,
      usdcMint,
      developer: dev,
      snsNameAccount,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .preInstructions([identityProofIx1])
    .rpc();
  log("Create Project", tx2, `Project PDA: ${project.toBase58()}`);

  // ── 4. Back project as a backer ──
  console.log("\n--- Backing project ---");
  const backer = Keypair.generate();
  // Transfer SOL from deployer instead of airdrop (devnet faucet unreliable)
  const transferTx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: dev, toPubkey: backer.publicKey, lamports: 0.05 * anchor.web3.LAMPORTS_PER_SOL })
  );
  await provider.sendAndConfirm(transferTx);

  const backerAta = await createAssociatedTokenAccount(
    provider.connection, payer, usdcMint, backer.publicKey
  );
  await mintTo(
    provider.connection, payer, usdcMint, backerAta, dev, 10_000_000
  );

  const tx3 = await program.methods
    .backProject(new anchor.BN(200), new anchor.BN(5_000_000))
    .accounts({
      project,
      developerCreditLine: creditLine,
      backer: backer.publicKey,
      backerTokenAccount: backerAta,
      backerEscrowVault,
      backerVaultAuthority,
      usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([backer])
    .rpc();
  log("Back Project", tx3, `Backer: ${backer.publicKey.toBase58()}, 5 USDC at 2x multiplier`);

  // ── 5. Verify milestone (pays out developer) ──
  console.log("\n--- Verifying milestone ---");
  const developerAta = await createAssociatedTokenAccount(
    provider.connection, payer, usdcMint, dev
  );

  const tx4 = await program.methods
    .verifyMilestone(0)
    .accounts({
      project,
      developerTokenAccount: developerAta,
      milestoneVault,
      milestoneVaultAuthority,
      verifier: dev,
      usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  log("Verify Milestone", tx4, "Milestone 0 (Deploy on-chain program) verified, developer paid");

  // ── 6. Repay loan to treasury ──
  console.log("\n--- Repaying loan ---");
  // Need more USDC in dev ATA for repayment
  await mintTo(
    provider.connection, payer, usdcMint, developerAta, dev, 2_000_000
  );

  const tx5 = await program.methods
    .repayLoan(new anchor.BN(1_000_000))
    .accounts({
      creditLine,
      developer: dev,
      developerTokenAccount: developerAta,
      treasuryTokenAccount,
      treasuryAuthority,
      project,
      usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  log("Repay Loan", tx5, "1 USDC repaid to protocol treasury, +1 reputation");

  // ── 7. Second project + backing ──
  console.log("\n--- Creating second project ---");
  const projectName2 = "pos-expedition";
  const [project2] = PublicKey.findProgramAddressSync(
    [Buffer.from("project"), dev.toBuffer(), Buffer.from(projectName2)],
    program.programId
  );
  const [milestoneVaultAuthority2] = PublicKey.findProgramAddressSync(
    [Buffer.from("milestone_vault_authority"), project2.toBuffer()],
    program.programId
  );
  const milestoneVault2 = getAssociatedTokenAddressSync(usdcMint, milestoneVaultAuthority2, true);
  const [backerVaultAuthority2] = PublicKey.findProgramAddressSync(
    [Buffer.from("backer_vault_authority"), project2.toBuffer()],
    program.programId
  );
  const backerEscrowVault2 = getAssociatedTokenAddressSync(usdcMint, backerVaultAuthority2, true);
  const identityMessage2 = buildIdentityClaimMessage(
    dev,
    snsNameAccount,
    builderSnsDomain,
    projectName2,
    "https://github.com/thisyearnofear/proof-of-ship"
  );
  const identityProofIx2 = Ed25519Program.createInstructionWithPrivateKey({
    privateKey: payer.secretKey,
    message: identityMessage2,
  });
  const identitySignature2 = identityProofIx2.data.slice(48, 112);

  const tx6 = await program.methods
    .requestFunding(
      [new anchor.BN(3)],
      "https://github.com/thisyearnofear/proof-of-ship",
      projectName2,
      ["Build expedition marketplace", "Integrate Cloak privacy", "Launch SNS identity"],
      [new anchor.BN(3_000_000), new anchor.BN(2_000_000), new anchor.BN(2_000_000)],
      dev,
      builderSnsDomain,
      Array.from(identitySignature2),
      new anchor.BN(450)
    )
    .accounts({
      project: project2,
      creditLine,
      milestoneVaultAuthority: milestoneVaultAuthority2,
      milestoneVault: milestoneVault2,
      backerVaultAuthority: backerVaultAuthority2,
      backerEscrowVault: backerEscrowVault2,
      usdcMint,
      developer: dev,
      snsNameAccount,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .preInstructions([identityProofIx2])
    .rpc();
  log("Create Project 2", tx6, `Project PDA: ${project2.toBase58()}`);

  // Back second project
  const backer2 = Keypair.generate();
  const transferTx2 = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: dev, toPubkey: backer2.publicKey, lamports: 0.05 * anchor.web3.LAMPORTS_PER_SOL })
  );
  await provider.sendAndConfirm(transferTx2);

  const backerAta2 = await createAssociatedTokenAccount(
    provider.connection, payer, usdcMint, backer2.publicKey
  );
  await mintTo(
    provider.connection, payer, usdcMint, backerAta2, dev, 5_000_000
  );

  const tx7 = await program.methods
    .backProject(new anchor.BN(300), new anchor.BN(3_000_000))
    .accounts({
      project: project2,
      developerCreditLine: creditLine,
      backer: backer2.publicKey,
      backerTokenAccount: backerAta2,
      backerEscrowVault: backerEscrowVault2,
      backerVaultAuthority: backerVaultAuthority2,
      usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([backer2])
    .rpc();
  log("Back Project 2", tx7, `Backer2: ${backer2.publicKey.toBase58()}, 3 USDC at 3x multiplier`);

  // ── Summary ──
  console.log("\n\n=== TRANSACTION SUMMARY ===");
  console.log(`Total transactions: ${txLog.length}`);
  console.log(`Program: ${program.programId.toBase58()}`);
  console.log(`Cluster: devnet`);
  console.log(`Explorer: https://explorer.solana.com/address/${program.programId.toBase58()}?cluster=devnet\n`);
  for (const t of txLog) {
    console.log(`  ${t.action}: https://explorer.solana.com/tx/${t.tx}?cluster=devnet`);
  }
  console.log(`\nAll transactions verifiable on Solana Explorer (devnet).`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
