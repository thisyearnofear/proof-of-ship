/**
 * This script removes redundant files after reorganization
 * to prevent duplication and clean up the project structure
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.join(__dirname, "..");

// Old directories that have been moved to frontend/ or blockchain/
const OLD_DIRS = ["src", "contracts", "public", "test"];

// Additional directories to clean up
const ADDITIONAL_DIRS_TO_CLEAN = [
  "migrations", // We're starting fresh
  ".next", // Build artifacts
  "out", // Build artifacts
];

// Config files that have been moved to frontend/ or blockchain/
const DUPLICATED_CONFIG_FILES = [
  "hardhat.config.js",
  "next.config.js",
  "next.config.mjs",
  "postcss.config.mjs",
  "tailwind.config.js",
];

// Migration and other redundant scripts to remove
const REDUNDANT_SCRIPTS = [
  "migrate-celo-projects.js",
  "migrate-to-firebase.js",
  "delete-dummy-projects.js",
  "auto-grant-permissions.js",
  "grant-project-ownership-by-github.js",
  "grant-project-ownership.js",
  "grant-project-permissions.js",
  "import-projects.js",
];

console.log("Starting cleanup...");

// Clean up old directories
console.log("\n1. Cleaning up old directories...");
OLD_DIRS.forEach((dir) => {
  const dirPath = path.join(ROOT_DIR, dir);

  if (fs.existsSync(dirPath)) {
    try {
      // Check if the corresponding new directory exists and has content
      let correspondingNewDir;

      if (dir === "src" || dir === "public") {
        correspondingNewDir = path.join(ROOT_DIR, "frontend", dir);
      } else if (dir === "contracts" || dir === "test") {
        correspondingNewDir = path.join(ROOT_DIR, "blockchain", dir);
      }

      if (correspondingNewDir && fs.existsSync(correspondingNewDir)) {
        console.log(`Removing old directory: ${dir}`);

        // Use rm -rf for more reliable directory removal
        execSync(`rm -rf "${dirPath}"`);
        console.log(`✅ Successfully removed ${dir}`);
      } else {
        console.log(
          `⚠️ Skipping ${dir} because corresponding new directory doesn't exist`
        );
      }
    } catch (error) {
      console.error(`❌ Error removing ${dir}:`, error.message);
    }
  } else {
    console.log(`Directory ${dir} doesn't exist, skipping...`);
  }
});

// Clean up additional directories
console.log("\n2. Cleaning up additional directories...");
ADDITIONAL_DIRS_TO_CLEAN.forEach((dir) => {
  const dirPath = path.join(ROOT_DIR, dir);

  if (fs.existsSync(dirPath)) {
    try {
      console.log(`Removing directory: ${dir}`);
      execSync(`rm -rf "${dirPath}"`);
      console.log(`✅ Successfully removed ${dir}`);
    } catch (error) {
      console.error(`❌ Error removing ${dir}:`, error.message);
    }
  } else {
    console.log(`Directory ${dir} doesn't exist, skipping...`);
  }
});

// Clean up duplicated config files
console.log("\n3. Cleaning up duplicated config files...");
DUPLICATED_CONFIG_FILES.forEach((file) => {
  const filePath = path.join(ROOT_DIR, file);

  if (fs.existsSync(filePath)) {
    try {
      let correspondingNewFile;

      if (
        [
          "next.config.js",
          "next.config.mjs",
          "postcss.config.mjs",
          "tailwind.config.js",
        ].includes(file)
      ) {
        correspondingNewFile = path.join(ROOT_DIR, "frontend", file);
      } else if (file === "hardhat.config.js") {
        correspondingNewFile = path.join(ROOT_DIR, "blockchain", file);
      }

      if (correspondingNewFile && fs.existsSync(correspondingNewFile)) {
        console.log(`Removing duplicated config file: ${file}`);
        fs.unlinkSync(filePath);
        console.log(`✅ Successfully removed ${file}`);
      } else {
        console.log(
          `⚠️ Skipping ${file} because corresponding new file doesn't exist`
        );
      }
    } catch (error) {
      console.error(`❌ Error removing ${file}:`, error.message);
    }
  } else {
    console.log(`File ${file} doesn't exist, skipping...`);
  }
});

// Clean up redundant scripts
console.log("\n4. Cleaning up redundant scripts...");
REDUNDANT_SCRIPTS.forEach((script) => {
  const scriptPath = path.join(ROOT_DIR, "scripts", script);

  if (fs.existsSync(scriptPath)) {
    try {
      console.log(`Removing redundant script: ${script}`);
      fs.unlinkSync(scriptPath);
      console.log(`✅ Successfully removed ${script}`);
    } catch (error) {
      console.error(`❌ Error removing ${script}:`, error.message);
    }
  } else {
    console.log(`Script ${script} doesn't exist, skipping...`);
  }
});

// Clean up build artifacts
console.log("\n5. Cleaning up build artifacts...");
try {
  // Remove firebase-debug.log
  const firebaseDebugPath = path.join(ROOT_DIR, "firebase-debug.log");
  if (fs.existsSync(firebaseDebugPath)) {
    fs.unlinkSync(firebaseDebugPath);
    console.log("✅ Successfully removed firebase-debug.log");
  }

  // Remove test-env-vars.js
  const testEnvVarsPath = path.join(ROOT_DIR, "test-env-vars.js");
  if (fs.existsSync(testEnvVarsPath)) {
    fs.unlinkSync(testEnvVarsPath);
    console.log("✅ Successfully removed test-env-vars.js");
  }
} catch (error) {
  console.error("❌ Error removing build artifacts:", error.message);
}

console.log("\nCleanup complete!");
