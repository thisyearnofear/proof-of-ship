// Upgrade script for BuilderCreditCore (UUPS)
//
// Usage:
//   npx hardhat run scripts/upgrade.js --network <network>
//
// Before running:
//   1. Deploy the new contract implementation pointing to the same storage layout
//   2. Update the import path below to point to your new contract
//
// CRITICAL: New implementation must preserve the storage layout.
// Append new state variables at the END of the contract — never reorder or delete.

const { upgrades } = require("hardhat");

async function main() {
  const proxyAddress = process.env.BUILDER_CREDIT_PROXY_ADDRESS;

  if (!proxyAddress) {
    console.error("❌ Set BUILDER_CREDIT_PROXY_ADDRESS env var to the proxy address.");
    console.error("   Example: BUILDER_CREDIT_PROXY_ADDRESS=0x... npx hardhat run scripts/upgrade.js --network sepolia");
    process.exit(1);
  }

  console.log(`📦 Upgrading BuilderCreditCore at proxy: ${proxyAddress}`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Upgrader: ${deployer.address}`);

  // Load the NEW contract factory (update this import when upgrading)
  // const BuilderCreditCoreV2 = await ethers.getContractFactory("BuilderCreditCoreV2");
  const BuilderCreditCoreV2 = await ethers.getContractFactory("BuilderCreditCore");

  console.log("🔧 Preparing upgrade...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, BuilderCreditCoreV2, {
    kind: "uups",
    call: { fn: "initialize", args: [] }, // Only if the new version needs re-initialization
  });
  await upgraded.deployed();

  const newImplAddress = await upgrades.erc1967.getImplementationAddress(
    ethers.provider,
    upgraded.address
  );

  console.log(`✅ Upgrade complete!`);
  console.log(`   Proxy: ${upgraded.address}`);
  console.log(`   New implementation: ${newImplAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Upgrade failed:", error);
    console.error("\nTroubleshooting:");
    console.error("  1. Is BUILDER_CREDIT_PROXY_ADDRESS set correctly?");
    console.error("  2. Does the new contract preserve the storage layout?");
    console.error("  3. Does the new contract import the same OpenZeppelin base contracts?");
    console.error("  4. Does the new contract have a constructor that calls _disableInitializers()?");
    process.exit(1);
  });
