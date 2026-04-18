const { ethers, network } = require("hardhat");
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

  // Check balance
  const balance = await deployer.getBalance();
  console.log(`💰 Account balance: ${ethers.utils.formatEther(balance)} ETH`);

  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    console.warn("⚠️ Low balance. Deployment might fail.");
  }

  // Get USDC address for this network
  const usdcAddress = MAINNET_USDC_ADDRESSES[chainId];

  if (!usdcAddress) {
    console.error(`❌ USDC address not found for chain ID ${chainId}`);
    process.exit(1);
  }

  console.log(`🏦 Using USDC address: ${usdcAddress}`);

  // Deploy HackathonRegistry first
  console.log("\n📋 Deploying HackathonRegistry...");
  const HackathonRegistry = await ethers.getContractFactory(
    "HackathonRegistry"
  );
  const hackathonRegistry = await HackathonRegistry.deploy();
  await hackathonRegistry.deployed();
  console.log(`✅ HackathonRegistry deployed to: ${hackathonRegistry.address}`);

  // Deploy BuilderCreditCore
  console.log("\n🏗️ Deploying BuilderCreditCore...");
  const BuilderCreditCore = await ethers.getContractFactory(
    "BuilderCreditCore"
  );
  const builderCreditCore = await BuilderCreditCore.deploy(
    hackathonRegistry.address,
    usdcAddress
  );
  await builderCreditCore.deployed();
  console.log(`✅ BuilderCreditCore deployed to: ${builderCreditCore.address}`);

  // Wait for block confirmations
  console.log("\n⏳ Waiting for confirmations...");
  await hackathonRegistry.deployTransaction.wait(5);
  await builderCreditCore.deployTransaction.wait(5);

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: chainId,
    usdcAddress: usdcAddress,
    contracts: {
      HackathonRegistry: hackathonRegistry.address,
      BuilderCreditCore: builderCreditCore.address,
    },
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  // Save to file
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
  console.log(`🏗️ BuilderCreditCore: ${builderCreditCore.address}`);
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  // Verification instructions
  console.log("\n📝 To verify these contracts, run:");
  console.log(`npx hardhat verify --network ${networkName} ${hackathonRegistry.address}`);
  console.log(`npx hardhat verify --network ${networkName} ${builderCreditCore.address} ${hackathonRegistry.address} ${usdcAddress}`);

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Production deployment failed:", error);
    process.exit(1);
  });
