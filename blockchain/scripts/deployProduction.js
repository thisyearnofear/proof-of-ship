const { ethers, network } = require("hardhat");
const fs = require("fs");

const MAINNET_USDC_ADDRESSES = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  59144: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
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

  // Deploy HackathonRegistry
  console.log("\n📋 Deploying HackathonRegistry...");
  const HackathonRegistry = await ethers.getContractFactory("HackathonRegistry");
  const hackathonRegistry = await HackathonRegistry.deploy();
  await hackathonRegistry.deployed();
  console.log(`✅ HackathonRegistry deployed to: ${hackathonRegistry.address}`);

  // Deploy BuilderCreditCore implementation
  console.log("\n🏗️ Deploying BuilderCreditCore implementation...");
  const BuilderCreditCore = await ethers.getContractFactory("BuilderCreditCore");
  const impl = await BuilderCreditCore.deploy();
  await impl.deployed();
  console.log(`✅ Implementation deployed to: ${impl.address}`);

  // Encode initialize call
  const initData = impl.interface.encodeFunctionData("initialize", [
    hackathonRegistry.address,
    usdcAddress,
    deployer.address,
  ]);

  // Deploy ERC1967 proxy
  console.log("📦 Deploying ERC1967 proxy...");
  const proxyArtifact = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json");
  const proxyFactory = new ethers.ContractFactory(
    proxyArtifact.abi,
    proxyArtifact.bytecode,
    deployer
  );
  const proxy = await proxyFactory.deploy(impl.address, initData);
  await proxy.deployed();
  console.log(`✅ Proxy deployed to: ${proxy.address}`);

  // Verify
  const core = BuilderCreditCore.attach(proxy.address);
  console.log(`\n🔍 Verification:`);
  console.log(`   registry: ${await core.registry()}`);
  console.log(`   usdcToken: ${await core.usdcToken()}`);

  // Wait for confirmations
  console.log("\n⏳ Waiting for confirmations...");
  await hackathonRegistry.deployTransaction.wait(5);
  await proxy.deployTransaction.wait(5);

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: chainId,
    usdcAddress: usdcAddress,
    contracts: {
      HackathonRegistry: hackathonRegistry.address,
      BuilderCreditCore: proxy.address,
      BuilderCreditCoreImpl: impl.address,
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

  console.log("\n🎉 Production Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Network: ${networkName} (${chainId})`);
  console.log(`🏦 USDC Address: ${usdcAddress}`);
  console.log(`📋 HackathonRegistry: ${hackathonRegistry.address}`);
  console.log(`🏗️ BuilderCreditCore (proxy): ${proxy.address}`);
  console.log(`🔧 BuilderCreditCore (impl): ${impl.address}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Production deployment failed:", error);
    process.exit(1);
  });
