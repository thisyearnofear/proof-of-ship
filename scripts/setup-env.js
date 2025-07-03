/**
 * This script copies the root .env file to the blockchain directory
 * This ensures that both frontend and blockchain components can access
 * the same environment variables when needed
 */

const fs = require("fs");
const path = require("path");

// Paths
const rootEnvPath = path.join(__dirname, "..", ".env");
const blockchainEnvPath = path.join(__dirname, "..", "blockchain", ".env");

// Check if root .env exists
if (!fs.existsSync(rootEnvPath)) {
  console.log("No .env file found in root directory.");
  console.log("Please create one using .env.example as a template.");
  process.exit(1);
}

// Copy .env to blockchain directory
try {
  // Ensure blockchain directory exists
  const blockchainDir = path.dirname(blockchainEnvPath);
  if (!fs.existsSync(blockchainDir)) {
    fs.mkdirSync(blockchainDir, { recursive: true });
  }

  // Copy the file
  fs.copyFileSync(rootEnvPath, blockchainEnvPath);
  console.log(`✅ .env file copied to blockchain directory`);
} catch (error) {
  console.error("Error copying .env file:", error);
  process.exit(1);
}
