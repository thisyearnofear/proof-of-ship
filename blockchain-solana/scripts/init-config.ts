import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

// Usage (devnet example):
//   USDC_MINT=4zMMC9srtvSqzRLsS51uVtoQpYp5yFdC8PYy8Y79zNLX anchor run init-config --provider.cluster devnet
//
// If USDC_MINT is omitted, defaults to Devnet USDC.
const DEFAULT_DEVNET_USDC = "4zMMC9srtvSqzRLsS51uVtoQpYp5yFdC8PYy8Y79zNLX";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BlockchainSolana as any;
  const usdcMint = new PublicKey(process.env.USDC_MINT || DEFAULT_DEVNET_USDC);

  const [config] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
  const sig = await program.methods
    .initializeConfig(usdcMint)
    .accounts({
      config,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  // eslint-disable-next-line no-console
  console.log("Initialized config:", config.toBase58(), "tx:", sig);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

