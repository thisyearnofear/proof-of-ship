// Deployment script for PledgeBond contracts (UUPS upgradeable via ERC1967 proxy)
const hre = require("hardhat");

async function main() {
  console.log("Deploying PledgeBond contracts (UUPS)...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Deploy HackathonRegistry
  console.log("Deploying HackathonRegistry...");
  const HackathonRegistry = await hre.ethers.getContractFactory("HackathonRegistry");
  const hackathonRegistry = await HackathonRegistry.deploy();
  await hackathonRegistry.waitForDeployment();
  const hackathonRegistryAddress = await hackathonRegistry.getAddress();
  console.log(`HackathonRegistry deployed to: ${hackathonRegistryAddress}`);

  // For local dev, deploy a mock USDC
  console.log("Deploying Mock USDC Token for testing...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log(`Mock USDC Token deployed to: ${mockUSDCAddress}`);

  // Deploy BuilderCreditCore implementation
  console.log("Deploying BuilderCreditCore implementation...");
  const BuilderCreditCore = await hre.ethers.getContractFactory("BuilderCreditCore");
  const impl = await BuilderCreditCore.deploy();
  await impl.waitForDeployment();
  const implAddress = await impl.getAddress();
  console.log(`Implementation deployed to: ${implAddress}`);

  // Encode initialize call
  const initData = impl.interface.encodeFunctionData("initialize", [
    hackathonRegistryAddress,
    mockUSDCAddress,
    deployer.address,
  ]);

  // Deploy ERC1967 proxy
  console.log("Deploying ERC1967 proxy...");
  const proxyArtifact = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json");
  const proxyFactory = new hre.ethers.ContractFactory(
    proxyArtifact.abi,
    proxyArtifact.bytecode,
    deployer
  );
  const proxy = await proxyFactory.deploy(implAddress, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log(`BuilderCreditCore proxy deployed to: ${proxyAddress}`);

  // Verify
  const core = BuilderCreditCore.attach(proxyAddress);
  console.log(`\n🔍 Verification:`);
  console.log(`   registry: ${await core.registry()}`);
  console.log(`   usdcToken: ${await core.usdcToken()}`);
  console.log(`   admin: ${await core.hasRole(await core.DEFAULT_ADMIN_ROLE(), deployer.address)}`);

  // Setup
  const mintAmount = hre.ethers.parseUnits("1000000", 6);
  await mockUSDC.mint(proxyAddress, mintAmount);
  console.log(`Minted ${hre.ethers.formatUnits(mintAmount, 6)} USDC to proxy`);

  const currentTime = Math.floor(Date.now() / 1000);
  const oneMonth = 30 * 24 * 60 * 60;

  await hackathonRegistry.createHackathon(
    "Sample Hackathon",
    deployer.address,
    [deployer.address],
    1,
    currentTime,
    currentTime + oneMonth
  );
  console.log("Created sample hackathon (ID: 1)");

  // Summary
  console.log("\nDeployment Complete!");
  console.log("----------------------");
  console.log(`HackathonRegistry: ${hackathonRegistryAddress}`);
  console.log(`BuilderCreditCore (proxy): ${proxyAddress}`);
  console.log(`BuilderCreditCore (impl): ${implAddress}`);
  console.log(`Mock USDC Token: ${mockUSDCAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
