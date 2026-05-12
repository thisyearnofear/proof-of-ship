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
  // SNS-aware requestFunding tests need a real devnet .sol domain because the program
  // validates the passed SNS name account against the actual SNS program owner/header.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BlockchainSolana as any;
  const payer = (provider.wallet as any).payer;

  // Shared state across tests
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
      `proof-of-ship:sns-identity:v1:${developer.toBase58()}:${snsNameAccount.toBase58()}:${builderSnsDomain}:${projectName}:${githubUrl}`,
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

    // Create a mock USDC mint (6 decimals)
    usdcMint = await createMint(
      provider.connection,
      payer,
      provider.wallet.publicKey,
      null,
      6,
    );

    // Derive protocol treasury PDA
    [treasuryAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId,
    );

    // Compute the treasury ATA address — allowOwnerOffCurve because treasuryAuthority is a PDA
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

  it("creates a project with vault", async () => {
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
    const [vaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_authority"), project.toBuffer()],
      program.programId,
    );
    const vaultTokenAccount = getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true);
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
        new anchor.BN(500),
      )
      .accounts({
        project,
        creditLine,
        vaultAuthority,
        usdcMint,
        vaultTokenAccount,
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
    assert.equal(projectAcct.builderSnsNameAccount.toBase58(), builderSnsNameAccount.toBase58());
    assert.equal(projectAcct.builderIdentitySignature.length, 64);

    // Vault ATA should now exist
    const vaultAcct = await getAccount(provider.connection, vaultTokenAccount);
    assert.ok(vaultAcct.mint.equals(usdcMint));
    assert.ok(vaultAcct.owner.equals(vaultAuthority));
  });

  it("backs a project with USDC (mint validation)", async () => {
    const projectName = "demo-project";
    const [project] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), provider.wallet.publicKey.toBuffer(), Buffer.from(projectName)],
      program.programId,
    );
    const [vaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_authority"), project.toBuffer()],
      program.programId,
    );
    const vaultTokenAccount = getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true);

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
    await mintTo(provider.connection, payer, usdcMint, backerAta, provider.wallet.publicKey, 2_000_000);

    const projectAcct = await program.account.project.fetch(project) as any;
    const [developerCreditLine] = PublicKey.findProgramAddressSync(
      [Buffer.from("credit_line"), projectAcct.developer.toBuffer()],
      program.programId,
    );

    // multiplier 150 = 1.5×
    await program.methods
      .backProject(new anchor.BN(150), new anchor.BN(1_000_000))
      .accounts({
        project,
        developerCreditLine,
        backer: backer.publicKey,
        backerTokenAccount: backerAta,
        vaultTokenAccount,
        vaultAuthority,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([backer])
      .rpc();

    const updated = await program.account.project.fetch(project) as any;
    assert.equal(updated.totalBacking.toNumber(), 1_000_000);
    assert.equal(updated.backings.length, 1);
    assert.equal(updated.backings[0].multiplier.toNumber(), 150);

    // Vault should now hold 1 USDC
    const vaultAcct = await getAccount(provider.connection, vaultTokenAccount);
    assert.equal(Number(vaultAcct.amount), 1_000_000);
  });

  it("verifies a milestone and pays out developer", async () => {
    const projectName = "demo-project";
    const [project] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), provider.wallet.publicKey.toBuffer(), Buffer.from(projectName)],
      program.programId,
    );
    const [vaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_authority"), project.toBuffer()],
      program.programId,
    );
    const vaultTokenAccount = getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true);

    // Developer ATA (wallet is the developer)
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
        vaultTokenAccount,
        vaultAuthority,
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

    // Vault should be empty after payout
    const vaultAcct = await getAccount(provider.connection, vaultTokenAccount);
    assert.equal(Number(vaultAcct.amount), 0);
  });

  it("repays a loan to the protocol treasury (not the project vault)", async () => {
    const projectName = "demo-project";
    const [project] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), provider.wallet.publicKey.toBuffer(), Buffer.from(projectName)],
      program.programId,
    );
    const [creditLine] = PublicKey.findProgramAddressSync(
      [Buffer.from("credit_line"), provider.wallet.publicKey.toBuffer()],
      program.programId,
    );

    // Fund developer ATA for repayment
    const developerAta = getAssociatedTokenAddressSync(usdcMint, provider.wallet.publicKey);
    // Mint some USDC to developer for repayment
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

  it("claims a reward using the stored multiplier", async () => {
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
    const [vaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_authority"), project.toBuffer()],
      program.programId,
    );
    const vaultTokenAccount = getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true);
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
        new anchor.BN(400),
      )
      .accounts({
        project,
        creditLine,
        vaultAuthority,
        usdcMint,
        vaultTokenAccount,
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

    // Back with 1.5× multiplier (150 = 1.5×) so claim payout fits in vault
    // Vault will hold 1M USDC from this back; claim pays 1M × 150 / 100 = 1.5M
    // Mint extra 1M into the vault so it can cover the 1.5M payout
    await program.methods
      .backProject(new anchor.BN(150), new anchor.BN(1_000_000))
      .accounts({
        project,
        developerCreditLine: creditLine,
        backer: backer.publicKey,
        backerTokenAccount: backerAta,
        vaultTokenAccount,
        vaultAuthority,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([backer])
      .rpc();

    // Mint additional USDC into vault to cover multiplier payout
    await mintTo(provider.connection, payer, usdcMint, vaultTokenAccount, provider.wallet.publicKey, 1_000_000);
    // Vault now holds: 1M (from back) + 1M (minted) = 2M, enough for 1.5M claim

    // Claim reward — should receive amount × multiplier / 100 = 1_000_000 × 150 / 100 = 1_500_000
    await program.methods
      .claimReward(0)
      .accounts({
        project,
        backer: backer.publicKey,
        backerTokenAccount: backerAta,
        vaultTokenAccount,
        vaultAuthority,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([backer])
      .rpc();

    // Backer should have: 2_000_000 remaining (started with 3M, backed with 1M) + 1_500_000 reward = 3_500_000
    const backerAcct = await getAccount(provider.connection, backerAta);
    assert.equal(Number(backerAcct.amount), 3_500_000);
  });
});
