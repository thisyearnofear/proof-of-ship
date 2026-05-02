import * as anchor from "@coral-xyz/anchor";

// Minimal deploy hook.
// After `anchor deploy`, sync the IDL into the frontend, then initialize the
// treasury ATA and run the devnet transaction script:
//   npm run idl:copy
//   npx ts-node scripts/init-config.ts
//   npx ts-node scripts/devnet-transactions.ts
//
// (See blockchain-solana/README.md for the full step-by-step.)
module.exports = async function (provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);
};
