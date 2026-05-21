const { ethers, network, upgrades } = require("hardhat");
const fs = require("fs");

// USDC addresses for different testnets (shared configuration)
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

  const balance = await deployer.getBalance();
  console.log(`💰 Account balance: ${ethers.utils.formatEther(balance)} ETH`);

  const usdcAddress = TESTNET_USDC_ADDRESSES[chainId];
  if (!usdcAddress) {
    console.error(`❌ USDC address not found for chain ID ${chainId}`);
    console.log("Available networks:", Object.keys(TESTNET_USDC_ADDRESSES));
    process.exit(1);
  }
  console.log(`🏦 Using USDC address: ${usdcAddress}`);

  // Deploy HackathonRegistry
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
  await hackathonRegistry.deployTransaction.wait(3);
  // proxy.deployTransaction may not exist — we use the implementation's deploy tx
  // if available; otherwise skip waiting for proxy confirmations.
  try {
    await proxy.deployTransaction.wait(3);
  } catch (_) {
    console.log("   (proxy deployment confirmation skipped)");
  }

  // Setup initial configuration
  console.log("\n⚙️ Setting up initial configuration...");
  const now = Math.floor(Date.now() / 1000);
  const tx1 = await hackathonRegistry.createHackathon(
    "Agentic Economy on Arc",
    deployer.address,
    [deployer.address],
    1,
    now,
    now + 7 * 24 * 60 * 60
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
      BuilderCreditCore: proxyAddress,
      BuilderCreditCoreImpl: implAddress,
    },
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    proxyKind: "uups",
  };

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
  console.log(`🏗️ BuilderCreditCore (proxy): ${proxyAddress}`);
  console.log(`🔧 BuilderCreditCore (impl): ${implAddress}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  // Environment variables for frontend
  console.log("\n📝 Add these to your .env file:");
  if (chainId === 5042002) {
    console.log(`BUILDER_CREDIT_ARC_ADDRESS=${proxyAddress}`);
    console.log(`HACKATHON_REGISTRY_ARC_ADDRESS=${hackathonRegistry.address}`);
  } else {
    console.log(
      `NEXT_PUBLIC_BUILDER_CREDIT_ADDRESS_${networkName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")}=${proxyAddress}`
    );
    console.log(
      `NEXT_PUBLIC_HACKATHON_REGISTRY_ADDRESS_${networkName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")}=${hackathonRegistry.address}`
    );
  }

  console.log("\n📦 To upgrade later:");
  console.log(`  npx hardhat run scripts/upgrade.js --network ${networkName}`);

  return {
    hackathonRegistry: hackathonRegistry.address,
    builderCreditCore: proxyAddress,
    usdcAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
