const { ethers } = require('hardhat');

async function main() {
  console.log('Deploying BuilderCredit contract...');

  // USDC addresses for different networks
  const USDC_ADDRESSES = {
    ethereum: '0xA0b86a33E6441b8435b662c8C1e8d2E1c4C8b4B2', // Ethereum mainnet
    linea: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',     // Linea mainnet
    sepolia: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',   // Sepolia testnet
    lineaTestnet: '0xf56dc6695cF1f5c364eDEbC7Dc7077ac9B586068' // Linea testnet
  };

  const network = await ethers.provider.getNetwork();
  console.log(`Deploying to network: ${network.name} (chainId: ${network.chainId})`);

  let usdcAddress;
  switch (network.chainId) {
    case 1: // Ethereum mainnet
      usdcAddress = USDC_ADDRESSES.ethereum;
      break;
    case 59144: // Linea mainnet
      usdcAddress = USDC_ADDRESSES.linea;
      break;
    case 11155111: // Sepolia testnet
      usdcAddress = USDC_ADDRESSES.sepolia;
      break;
    case 59140: // Linea testnet
      usdcAddress = USDC_ADDRESSES.lineaTestnet;
      break;
    default:
      throw new Error(`Unsupported network: ${network.chainId}`);
  }

  console.log(`Using USDC address: ${usdcAddress}`);

  // Deploy BuilderCredit contract
  const BuilderCredit = await ethers.getContractFactory('BuilderCredit');
  const builderCredit = await BuilderCredit.deploy(usdcAddress);

  await builderCredit.deployed();

  console.log('BuilderCredit deployed to:', builderCredit.address);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    builderCreditAddress: builderCredit.address,
    usdcAddress: usdcAddress,
    deployedAt: new Date().toISOString(),
    deployer: await ethers.provider.getSigner().getAddress()
  };

  console.log('Deployment info:', deploymentInfo);

  // Verify contract on Etherscan (if not local network)
  if (network.chainId !== 31337) {
    console.log('Waiting for block confirmations...');
    await builderCredit.deployTransaction.wait(6);

    try {
      await hre.run('verify:verify', {
        address: builderCredit.address,
        constructorArguments: [usdcAddress],
      });
      console.log('Contract verified on Etherscan');
    } catch (error) {
      console.log('Verification failed:', error.message);
    }
  }

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
