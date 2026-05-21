// Deployment script for Builder Credit contracts (UUPS upgradeable)
const { upgrades } = require("hardhat");
const hre = require("hardhat");

async function main() {
  console.log("Deploying Builder Credit contracts (UUPS)...");

  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Deploy HackathonRegistry (not upgradeable — it's a registry with no complex logic)
  console.log("Deploying HackathonRegistry...");
  const HackathonRegistry = await hre.ethers.getContractFactory("HackathonRegistry");
  const hackathonRegistry = await HackathonRegistry.deploy();
  await hackathonRegistry.waitForDeployment();
  const hackathonRegistryAddress = await hackathonRegistry.getAddress();
  console.log(`HackathonRegistry deployed to: ${hackathonRegistryAddress}`);

  // For testnet/mainnet, use the actual USDC address
  // For local development, deploy a mock USDC token
  console.log("Deploying Mock USDC Token for testing...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log(`Mock USDC Token deployed to: ${mockUSDCAddress}`);

  // Deploy BuilderCreditCore via UUPS proxy
  console.log("Deploying BuilderCreditCore (UUPS proxy)...");
  const BuilderCreditCore = await hre.ethers.getContractFactory("BuilderCreditCore");

  // Use hardhat-upgrades deployProxy — this deploys the implementation,
  // creates a proxy, and calls initialize() all in one transaction.
  const proxy = await upgrades.deployProxy(
    BuilderCreditCore,
    [hackathonRegistryAddress, mockUSDCAddress, deployer.address],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  // Get the implementation address for reference
  const implAddress = await upgrades.erc1967.getImplementationAddress(
    hre.ethers.provider,
    proxyAddress
  );

  console.log(`BuilderCreditCore proxy deployed to: ${proxyAddress}`);
  console.log(`Implementation contract at: ${implAddress}`);

  // Setup initial configurations
  console.log("Setting up initial configurations...");

  // For testing purposes, mint some USDC to the BuilderCreditCore proxy
  const mintAmount = hre.ethers.parseUnits("1000000", 6); // 1,000,000 USDC (6 decimals)
  await mockUSDC.mint(proxyAddress, mintAmount);
  console.log(`Minted ${hre.ethers.formatUnits(mintAmount, 6)} USDC to BuilderCreditCore proxy`);

  // Create a sample hackathon
  const currentTime = Math.floor(Date.now() / 1000);
  const oneMonth = 30 * 24 * 60 * 60;

  const hackathonName = "Sample Hackathon";
  const hackathonHost = deployer.address;
  const initialVerifiers = [deployer.address];
  const requiredSignatures = 1;
  const startDate = currentTime;
  const endDate = currentTime + oneMonth;

  await hackathonRegistry.createHackathon(
    hackathonName,
    hackathonHost,
    initialVerifiers,
    requiredSignatures,
    startDate,
    endDate
  );
  console.log(`Created sample hackathon: ${hackathonName}`);

  // Summary
  console.log("\nDeployment Complete!");
  console.log("----------------------");
  console.log(`HackathonRegistry: ${hackathonRegistryAddress}`);
  console.log(`BuilderCreditCore (proxy): ${proxyAddress}`);
  console.log(`BuilderCreditCore (impl): ${implAddress}`);
  console.log(`Mock USDC Token: ${mockUSDCAddress}`);
  console.log(`Sample Hackathon ID: 1`);
  console.log("\nTo upgrade the contract later, run:");
  console.log(`  npx hardhat run scripts/upgrade.js --network <network>`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
