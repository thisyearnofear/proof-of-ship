import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import {
  Ed25519Program,
  Keypair,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SystemProgram,
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

describe("blockchain-solana", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BlockchainSolana as any;
  const payer = (provider.wallet as any).payer;

  let usdcMint: PublicKey;
  let treasuryAuthority: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let builderSnsNameAccount: PublicKey;
  const builderSnsDomain = process.env.SNS_DOMAIN || "";

  const requireSnsTestConfig = () => {
    const snsNameAccount = process.env.SNS_NAME_ACCOUNT;
    if (!builderSnsDomain || !snsNameAccount) {
      throw new Error(
        "Set SNS_DOMAIN and SNS_NAME_ACCOUNT to a real devnet .sol domain and its name account before running the Solana tests.",
      );
    }
    return new PublicKey(snsNameAccount);
  };

  const buildIdentityClaimMessage = (
    developer: PublicKey,
    snsNameAccount: PublicKey,
    projectName: string,
    githubUrl: string,
  ) =>
    Buffer.from(
      `pledgebond:sns-identity:v1:${developer.toBase58()}:${snsNameAccount.toBase58()}:${builderSnsDomain}:${projectName}:${githubUrl}`,
      "utf8",
    );

  const buildIdentityProof = (
    developerKeypair: Keypair,
    snsNameAccount: PublicKey,
    projectName: string,
    githubUrl: string,
  ) => {
    const message = buildIdentityClaimMessage(
      developerKeypair.publicKey,
      snsNameAccount,
      projectName,
      githubUrl,
    );
    const ed25519Ix = Ed25519Program.createInstructionWithPrivateKey({
      privateKey: developerKeypair.secretKey,
      message,
    });
    const signature = Array.from(ed25519Ix.data.slice(48, 112));
    return { ed25519Ix, signature };
  };

  before(async () => {
    builderSnsNameAccount = requireSnsTestConfig();

    usdcMint = await createMint(
      provider.connection,
      payer,
      provider.wallet.publicKey,
      null,
      6,
    );

    [treasuryAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId,
    );

    treasuryTokenAccount = getAssociatedTokenAddressSync(usdcMint, treasuryAuthority, true);
  });

  it("initializes the protocol treasury", async () => {
    await program.methods
      .initializeTreasury()
      .accounts({
        treasuryAuthority,
        usdcMint,
        treasuryTokenAccount,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    const acct = await getAccount(provider.connection, treasuryTokenAccount);
    assert.ok(acct.owner.equals(treasuryAuthority));
    assert.ok(acct.mint.equals(usdcMint));
  });

  it("creates a project with milestone vault and backer escrow vault", async () => {
    const projectName = "demo-project";
    const githubUrl = "https://github.com/example/repo";

    const [project] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), provider.wallet.publicKey.toBuffer(), Buffer.from(projectName)],
      program.programId,
    );
    const [creditLine] = PublicKey.findProgramAddressSync(
      [Buffer.from("credit_line"), provider.wallet.publicKey.toBuffer()],
      program.programId,
    );
    const [milestoneVaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("milestone_vault_authority"), project.toBuffer()],
      program.programId,
    );
    const milestoneVault = getAssociatedTokenAddressSync(usdcMint, milestoneVaultAuthority, true);
    const [backerVaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("backer_vault_authority"), project.toBuffer()],
      program.programId,
    );
    const backerEscrowVault = getAssociatedTokenAddressSync(usdcMint, backerVaultAuthority, true);

    const { ed25519Ix, signature } = buildIdentityProof(
      payer,
      builderSnsNameAccount,
      projectName,
      githubUrl,
    );

    await program.methods
      .requestFunding(
        [new anchor.BN(1)],
        githubUrl,
        projectName,
        ["Build MVP"],
        [new anchor.BN(1_000_000)],
        provider.wallet.publicKey,
        builderSnsDomain,
        signature,
      )
      .accounts({
        project,
        creditLine,
        milestoneVaultAuthority,
        milestoneVault,
        backerVaultAuthority,
        backerEscrowVault,
        usdcMint,
        developer: provider.wallet.publicKey,
        snsNameAccount: builderSnsNameAccount,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .preInstructions([ed25519Ix])
      .rpc();

    const projectAcct = await program.account.project.fetch(project) as any;
    assert.equal(projectAcct.isActive, true);
    assert.equal(projectAcct.milestonesCount, 1);
    assert.equal(projectAcct.totalBacking.toNumber(), 0);
    assert.equal(projectAcct.builderSnsDomain, builderSnsDomain);

    // Both vaults should exist
    const milestoneAcct = await getAccount(provider.connection, milestoneVault);
    assert.ok(milestoneAcct.mint.equals(usdcMint));
    assert.ok(milestoneAcct.owner.equals(milestoneVaultAuthority));

    const backerAcct = await getAccount(provider.connection, backerEscrowVault);
    assert.ok(backerAcct.mint.equals(usdcMint));
    assert.ok(backerAcct.owner.equals(backerVaultAuthority));
  });

  it("backs a project with USDC to the backer escrow vault", async () => {
    const projectName = "demo-project";
    const [project] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), provider.wallet.publicKey.toBuffer(), Buffer.from(projectName)],
      program.programId,
    );
    const [backerVaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("backer_vault_authority"), project.toBuffer()],
      program.programId,
    );
    const backerEscrowVault = getAssociatedTokenAddressSync(usdcMint, backerVaultAuthority, true);

    const backer = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(backer.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig);

    const backerAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      usdcMint,
      backer.publicKey,
    );
    await mintTo(provider.connection, payer, usdcMint, backerAta, provider.wallet.publicKey, 2_000_000);

    const projectAcct = await program.account.project.fetch(project) as any;
    const [developerCreditLine] = PublicKey.findProgramAddressSync(
      [Buffer.from("credit_line"), projectAcct.developer.toBuffer()],
      program.programId,
    );

    await program.methods
      .backProject(new anchor.BN(150), new anchor.BN(1_000_000))
      .accounts({
        project,
        developerCreditLine,
        backer: backer.publicKey,
        backerTokenAccount: backerAta,
        backerEscrowVault,
        backerVaultAuthority,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([backer])
      .rpc();

    const updated = await program.account.project.fetch(project) as any;
    assert.equal(updated.totalBacking.toNumber(), 1_000_000);
    assert.equal(updated.backings.length, 1);
    assert.equal(updated.backings[0].multiplier.toNumber(), 150);

    // Backer escrow vault should hold 1 USDC
    const escrowAcct = await getAccount(provider.connection, backerEscrowVault);
    assert.equal(Number(escrowAcct.amount), 1_000_000);

    // Milestone vault should be untouched (still 0)
    const [milestoneVaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("milestone_vault_authority"), project.toBuffer()],
      program.programId,
    );
    const milestoneVault = getAssociatedTokenAddressSync(usdcMint, milestoneVaultAuthority, true);
    const milestoneAcct = await getAccount(provider.connection, milestoneVault);
    assert.equal(Number(milestoneAcct.amount), 0);
  });

  it("funds the milestone vault and verifies milestone pays from it", async () => {
    const projectName = "demo-project";
    const [project] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), provider.wallet.publicKey.toBuffer(), Buffer.from(projectName)],
      program.programId,
    );
    const [milestoneVaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("milestone_vault_authority"), project.toBuffer()],
      program.programId,
    );
    const milestoneVault = getAssociatedTokenAddressSync(usdcMint, milestoneVaultAuthority, true);

    // Fund the milestone vault with USDC (in production, this would come from
    // hackathon prize pools or sponsors routing funds here)
    await mintTo(provider.connection, payer, usdcMint, milestoneVault, provider.wallet.publicKey, 1_000_000);

    // Developer ATA
    const developerAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      usdcMint,
      provider.wallet.publicKey,
    );

    await program.methods
      .verifyMilestone(0)
      .accounts({
        project,
        developerTokenAccount: developerAta,
        milestoneVault,
        milestoneVaultAuthority,
        verifier: provider.wallet.publicKey,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const projectAcct = await program.account.project.fetch(project) as any;
    assert.equal(projectAcct.milestonesCompleted, 1);
    assert.equal(projectAcct.milestones[0].completed, true);

    // Developer should have received the milestone amount (1 USDC)
    const devAcct = await getAccount(provider.connection, developerAta);
    assert.equal(Number(devAcct.amount), 1_000_000);

    // Milestone vault should be empty after payout
    const mvAcct = await getAccount(provider.connection, milestoneVault);
    assert.equal(Number(mvAcct.amount), 0);

    // Backer escrow vault should still hold 1 USDC (unaffected by milestone payout)
    const [backerVaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("backer_vault_authority"), project.toBuffer()],
      program.programId,
    );
    const backerEscrowVault = getAssociatedTokenAddressSync(usdcMint, backerVaultAuthority, true);
    const escrowAcct = await getAccount(provider.connection, backerEscrowVault);
    assert.equal(Number(escrowAcct.amount), 1_000_000);
  });

  it("repays a loan to the protocol treasury", async () => {
    const projectName = "demo-project";
    const [project] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), provider.wallet.publicKey.toBuffer(), Buffer.from(projectName)],
      program.programId,
    );
    const [creditLine] = PublicKey.findProgramAddressSync(
      [Buffer.from("credit_line"), provider.wallet.publicKey.toBuffer()],
      program.programId,
    );

    const developerAta = getAssociatedTokenAddressSync(usdcMint, provider.wallet.publicKey);
    await mintTo(provider.connection, payer, usdcMint, developerAta, provider.wallet.publicKey, 500_000);

    const creditBefore = await program.account.creditLine.fetch(creditLine);
    const usedBefore = creditBefore.usedAmount.toNumber();

    await program.methods
      .repayLoan(new anchor.BN(500_000))
      .accounts({
        creditLine,
        developer: provider.wallet.publicKey,
        developerTokenAccount: developerAta,
        treasuryTokenAccount,
        treasuryAuthority,
        project,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const creditAfter = await program.account.creditLine.fetch(creditLine);
    assert.equal(creditAfter.usedAmount.toNumber(), usedBefore - 500_000);

    // Treasury should have received the repayment
    const treasuryAcct = await getAccount(provider.connection, treasuryTokenAccount);
    assert.equal(Number(treasuryAcct.amount), 500_000);
  });

  it("claims a reward from the backer escrow vault", async () => {
    // Use a fresh project so we control the full lifecycle
    const projectName = "claim-test-project";
    const [project] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), provider.wallet.publicKey.toBuffer(), Buffer.from(projectName)],
      program.programId,
    );
    const [creditLine] = PublicKey.findProgramAddressSync(
      [Buffer.from("credit_line"), provider.wallet.publicKey.toBuffer()],
      program.programId,
    );
    const [milestoneVaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("milestone_vault_authority"), project.toBuffer()],
      program.programId,
    );
    const milestoneVault = getAssociatedTokenAddressSync(usdcMint, milestoneVaultAuthority, true);
    const [backerVaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("backer_vault_authority"), project.toBuffer()],
      program.programId,
    );
    const backerEscrowVault = getAssociatedTokenAddressSync(usdcMint, backerVaultAuthority, true);
    const githubUrl = "https://github.com/example/repo2";
    const { ed25519Ix, signature } = buildIdentityProof(
      payer,
      builderSnsNameAccount,
      projectName,
      githubUrl,
    );

    await program.methods
      .requestFunding(
        [],
        githubUrl,
        projectName,
        ["Ship it"],
        [new anchor.BN(2_000_000)],
        provider.wallet.publicKey,
        builderSnsDomain,
        signature,
      )
      .accounts({
        project,
        creditLine,
        milestoneVaultAuthority,
        milestoneVault,
        backerVaultAuthority,
        backerEscrowVault,
        usdcMint,
        developer: provider.wallet.publicKey,
        snsNameAccount: builderSnsNameAccount,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .preInstructions([ed25519Ix])
      .rpc();

    // Create backer + fund their ATA
    const backer = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(backer.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig);

    const backerAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      usdcMint,
      backer.publicKey,
    );
    await mintTo(provider.connection, payer, usdcMint, backerAta, provider.wallet.publicKey, 3_000_000);

    // Back with 1.5× multiplier (150 = 1.5×)
    // Backer deposits 1M into backer escrow vault
    await program.methods
      .backProject(new anchor.BN(150), new anchor.BN(1_000_000))
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

    // Fund the backer escrow vault from the treasury to cover the multiplier premium
    // The vault has 1M from the backer. We need 1.5M total for 150 multiplier.
    // Treasury funds the extra 0.5M via fund_backer_rewards.
    // In production, the protocol treasury accumulates funds from loan repayments
    // and sponsor contributions — here we mint to treasury first.
    await mintTo(provider.connection, payer, usdcMint, treasuryTokenAccount, provider.wallet.publicKey, 1_000_000);

    await program.methods
      .fundBackerRewards(new anchor.BN(500_000))
      .accounts({
        treasuryAuthority,
        treasuryTokenAccount,
        backerVaultAuthority,
        backerEscrowVault,
        project,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // Backer escrow vault now holds: 1M (from back) + 0.5M (funded from treasury) = 1.5M
    const vaultBefore = await getAccount(provider.connection, backerEscrowVault);
    assert.equal(Number(vaultBefore.amount), 1_500_000);

    // Claim reward — backer receives amount × multiplier / 100 = 1_000_000 × 150 / 100 = 1_500_000
    await program.methods
      .claimReward(0)
      .accounts({
        project,
        backer: backer.publicKey,
        backerTokenAccount: backerAta,
        backerEscrowVault,
        backerVaultAuthority,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([backer])
      .rpc();

    // Backer should have: 2_000_000 remaining (started with 3M, backed with 1M) + 1_500_000 reward = 3_500_000
    const backerAcct = await getAccount(provider.connection, backerAta);
    assert.equal(Number(backerAcct.amount), 3_500_000);

    // Backer escrow vault should be empty after claim
    const vaultAfter = await getAccount(provider.connection, backerEscrowVault);
    assert.equal(Number(vaultAfter.amount), 0);
  });
});
