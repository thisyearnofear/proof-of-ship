const { ethers, network } = require("hardhat");
const fs = require("fs");

// USDC addresses for different testnets (shared configuration)
// Keep in sync with frontend/src/config/tokens.js TESTNET_USDC_ADDRESSES
const TESTNET_USDC_ADDRESSES = {
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Ethereum Sepolia
  421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Arbitrum Sepolia
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
  11155420: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // OP Sepolia
  44787: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B", // Celo Alfajores
  59141: "0xFEce4462D57bD51A6A552365A011b95f0E16d9B7", // Linea Sepolia
  5042002: "0x3600000000000000000000000000000000000000", // Arc Testnet (native USDC)
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = network.config.chainId;
  const networkName = network.name;

  console.log(`\n🚀 Deploying to ${networkName} (Chain ID: ${chainId})`);
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);

  // Check balance
  const balance = await deployer.getBalance();
  console.log(`💰 Account balance: ${ethers.utils.formatEther(balance)} ETH`);

  // Get USDC address for this network
  const usdcAddress = TESTNET_USDC_ADDRESSES[chainId];

  if (!usdcAddress) {
    console.error(`❌ USDC address not found for chain ID ${chainId}`);
    console.log("Available networks:", Object.keys(TESTNET_USDC_ADDRESSES));
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

  // Wait for a few confirmations
  console.log("\n⏳ Waiting for confirmations...");
  await hackathonRegistry.deployTransaction.wait(3);
  await builderCreditCore.deployTransaction.wait(3);

  // Setup initial configuration
  console.log("\n⚙️ Setting up initial configuration...");

  // Create a test hackathon with all 6 required args
  const now = Math.floor(Date.now() / 1000);
  const tx1 = await hackathonRegistry.createHackathon(
    "Agentic Economy on Arc",        // name
    deployer.address,                 // host
    [deployer.address],               // initialVerifiers
    1,                                // requiredSignatures
    now,                              // startDate
    now + 7 * 24 * 60 * 60           // endDate (1 week)
  );
  await tx1.wait();
  console.log("✅ Test hackathon created");

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
  const deploymentFile = `./deployments/${networkName}_deployment.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to ${deploymentFile}`);

  // Print summary
  console.log("\n🎉 Deployment Summary:");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );
  console.log(`📍 Network: ${networkName} (${chainId})`);
  console.log(`🏦 USDC Address: ${usdcAddress}`);
  console.log(`📋 HackathonRegistry: ${hackathonRegistry.address}`);
  console.log(`🏗️ BuilderCreditCore: ${builderCreditCore.address}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  // Environment variables for frontend
  console.log("\n📝 Add these to your .env file:");
  if (chainId === 5042002) {
    // Arc Testnet — matches execute.js env var name (server-only)
    console.log(`BUILDER_CREDIT_ARC_ADDRESS=${builderCreditCore.address}`);
    console.log(`HACKATHON_REGISTRY_ARC_ADDRESS=${hackathonRegistry.address}`);
  } else {
    console.log(
      `NEXT_PUBLIC_BUILDER_CREDIT_ADDRESS_${networkName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")}=${builderCreditCore.address}`
    );
    console.log(
      `NEXT_PUBLIC_HACKATHON_REGISTRY_ADDRESS_${networkName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")}=${hackathonRegistry.address}`
    );
  }

  return {
    hackathonRegistry: hackathonRegistry.address,
    builderCreditCore: builderCreditCore.address,
    usdcAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
