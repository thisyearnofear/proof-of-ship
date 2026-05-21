const { ethers, network, upgrades } = require("hardhat");
const fs = require("fs");

// USDC addresses for different mainnets
const MAINNET_USDC_ADDRESSES = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum Mainnet
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum One
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
  10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // OP
  42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // Celo
  59144: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff", // Linea
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = network.config.chainId;
  const networkName = network.name;

  console.log(`\n🚀 Deploying to PRODUCTION ${networkName} (Chain ID: ${chainId})`);
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);

  const balance = await deployer.getBalance();
  console.log(`💰 Account balance: ${ethers.utils.formatEther(balance)} ETH`);

  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    console.warn("⚠️ Low balance. Deployment might fail.");
  }

  const usdcAddress = MAINNET_USDC_ADDRESSES[chainId];
  if (!usdcAddress) {
    console.error(`❌ USDC address not found for chain ID ${chainId}`);
    process.exit(1);
  }
  console.log(`🏦 Using USDC address: ${usdcAddress}`);

  // Deploy HackathonRegistry (not upgradeable — simple registry)
  console.log("\n📋 Deploying HackathonRegistry...");
  const HackathonRegistry = await ethers.getContractFactory("HackathonRegistry");
  const hackathonRegistry = await HackathonRegistry.deploy();
  await hackathonRegistry.deployed();
  console.log(`✅ HackathonRegistry deployed to: ${hackathonRegistry.address}`);

  // Deploy BuilderCreditCore via UUPS proxy
  console.log("\n🏗️ Deploying BuilderCreditCore (UUPS proxy)...");
  const BuilderCreditCore = await ethers.getContractFactory("BuilderCreditCore");
  const proxy = await upgrades.deployProxy(
    BuilderCreditCore,
    [hackathonRegistry.address, usdcAddress, deployer.address],
    { kind: "uups", initializer: "initialize" }
  );
  await proxy.deployed();

  const proxyAddress = proxy.address;
  const implAddress = await upgrades.erc1967.getImplementationAddress(
    ethers.provider,
    proxyAddress
  );
  console.log(`✅ BuilderCreditCore proxy deployed to: ${proxyAddress}`);
  console.log(`✅ Implementation contract at: ${implAddress}`);

  // Wait for confirmations
  console.log("\n⏳ Waiting for confirmations...");
  await hackathonRegistry.deployTransaction.wait(5);
  try {
    await proxy.deployTransaction.wait(5);
  } catch (_) {
    console.log("   (proxy confirmation skipped)");
  }

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: chainId,
    usdcAddress: usdcAddress,
    contracts: {
      HackathonRegistry: hackathonRegistry.address,
      BuilderCreditCore: proxyAddress,
      BuilderCreditCoreImpl: implAddress,
    },
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    proxyKind: "uups",
  };

  const deploymentFile = `./deployments/${networkName}_production_deployment.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to ${deploymentFile}`);

  // Print summary
  console.log("\n🎉 Production Deployment Summary:");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );
  console.log(`📍 Network: ${networkName} (${chainId})`);
  console.log(`🏦 USDC Address: ${usdcAddress}`);
  console.log(`📋 HackathonRegistry: ${hackathonRegistry.address}`);
  console.log(`🏗️ BuilderCreditCore (proxy): ${proxyAddress}`);
  console.log(`🔧 BuilderCreditCore (impl): ${implAddress}`);
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  // Verification instructions
  console.log("\n📝 To verify these contracts, run:");
  console.log(`npx hardhat verify --network ${networkName} ${hackathonRegistry.address}`);
  console.log(`npx hardhat verify --network ${networkName} ${proxyAddress} ${hackathonRegistry.address} ${usdcAddress}`);

  console.log("\n📦 To upgrade later:");
  console.log(`  npx hardhat run scripts/upgrade.js --network ${networkName}`);

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Production deployment failed:", error);
    process.exit(1);
  });
