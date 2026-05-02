import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

// Legacy filename note:
// This script used to initialize a removed on-chain Config account.
// The current program only needs the treasury ATA to be initialized.
//
// Usage (devnet example):
//   USDC_MINT=4zMMC9srtvSqzRLsS51uVtoQpYp5yFdC8PYy8Y79zNLX ts-node scripts/init-config.ts
//
// If USDC_MINT is omitted, defaults to Devnet USDC.
const DEFAULT_DEVNET_USDC = "4zMMC9srtvSqzRLsS51uVtoQpYp5yFdC8PYy8Y79zNLX";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BlockchainSolana as any;
  const usdcMint = new PublicKey(process.env.USDC_MINT || DEFAULT_DEVNET_USDC);
  const [treasuryAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );
  const treasuryTokenAccount = getAssociatedTokenAddressSync(usdcMint, treasuryAuthority, true);

  const sig = await program.methods
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

  // eslint-disable-next-line no-console
  console.log("Initialized treasury:", treasuryAuthority.toBase58(), "ATA:", treasuryTokenAccount.toBase58(), "tx:", sig);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
