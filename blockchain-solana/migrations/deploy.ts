import * as anchor from "@coral-xyz/anchor";

// Minimal deploy hook.
// After `anchor deploy`, run `anchor keys sync` to update declare_id!/Anchor.toml,
// then initialize the on-chain Config via:
//   anchor run init-config --provider.cluster devnet
//
// (See blockchain-solana/README.md for the full step-by-step.)
module.exports = async function (provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);
};

