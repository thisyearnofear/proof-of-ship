const { exec } = require("child_process");
const fs = require("fs");

const networks = [
  "sepolia",
  "arbitrumSepolia",
  "baseSepolia",
  "opSepolia",
  "celoAlfajores",
  "lineaSepolia",
];

async function deployToNetwork(network) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Starting deployment to ${network}...`);

    const command = `npx hardhat run scripts/deployTestnet.js --network ${network}`;

    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Deployment to ${network} failed:`, error);
        reject({ network, error: error.message });
      } else {
        console.log(`✅ Deployment to ${network} completed`);
        console.log(stdout);
        resolve({ network, success: true });
      }
    });
  });
}

async function main() {
  console.log("🌐 Deploying to all testnet networks...");
  console.log("Networks:", networks.join(", "));

  const results = [];

  for (const network of networks) {
    try {
      const result = await deployToNetwork(network);
      results.push(result);

      // Wait between deployments to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to deploy to ${network}:`, error);
      results.push({ network, error: error.error || error.message });
    }
  }

  // Summary
  console.log("\n📊 Deployment Summary:");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => r.error);

  console.log(`✅ Successful deployments: ${successful.length}`);
  successful.forEach((r) => console.log(`   - ${r.network}`));

  console.log(`❌ Failed deployments: ${failed.length}`);
  failed.forEach((r) => console.log(`   - ${r.network}: ${r.error}`));

  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  if (successful.length > 0) {
    console.log("\n📝 Next steps:");
    console.log("1. Update your .env file with the contract addresses");
    console.log("2. Verify contracts on block explorers");
    console.log("3. Test the frontend integration");
    console.log("4. Get testnet tokens for testing");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment script failed:", error);
    process.exit(1);
  });
