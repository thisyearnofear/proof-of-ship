// Deployment script for Builder Credit contracts
const hre = require("hardhat");

async function main() {
  console.log("Deploying Builder Credit contracts...");

  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Deploy HackathonRegistry
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

  // Deploy BuilderCreditCore
  console.log("Deploying BuilderCreditCore...");
  const BuilderCreditCore = await hre.ethers.getContractFactory("BuilderCreditCore");
  const builderCreditCore = await BuilderCreditCore.deploy(
    hackathonRegistryAddress,
    mockUSDCAddress
  );
  await builderCreditCore.waitForDeployment();
  const builderCreditCoreAddress = await builderCreditCore.getAddress();
  console.log(`BuilderCreditCore deployed to: ${builderCreditCoreAddress}`);

  // Setup initial configurations
  console.log("Setting up initial configurations...");

  // For testing purposes, mint some USDC to the BuilderCreditCore contract
  const mintAmount = hre.ethers.parseUnits("1000000", 6); // 1,000,000 USDC (6 decimals)
  await mockUSDC.mint(builderCreditCoreAddress, mintAmount);
  console.log(`Minted ${hre.ethers.formatUnits(mintAmount, 6)} USDC to BuilderCreditCore`);

  // Create a sample hackathon
  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  const oneMonth = 30 * 24 * 60 * 60; // 30 days in seconds
  
  const hackathonName = "Sample Hackathon";
  const hackathonHost = deployer.address;
  const initialVerifiers = [deployer.address]; // For testing, the deployer is also a verifier
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
  console.log(`BuilderCreditCore: ${builderCreditCoreAddress}`);
  console.log(`Mock USDC Token: ${mockUSDCAddress}`);
  console.log(`Sample Hackathon ID: 1`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });