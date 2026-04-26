/**
 * Server-only environment configuration — MUST NEVER be imported from client code.
 *
 * Contains API keys, private keys, and other secrets.
 * Only import this from server-side code (API routes, server utilities).
 */

const isProduction = process.env.NODE_ENV === "production";

// API Service configurations (contains secrets)
const apiConfigs = {
  circle: {
    apiKey: process.env.CIRCLE_API_KEY,
    walletSetId: process.env.CIRCLE_WALLET_SET_ID,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET,
    platformWalletId: process.env.CIRCLE_PLATFORM_WALLET_ID,
    environment: process.env.CIRCLE_ENVIRONMENT || "sandbox",
    isProduction:
      (process.env.CIRCLE_ENVIRONMENT || "sandbox").toLowerCase() ===
      "production",
  },

  lifi: {
    apiKey: process.env.NEXT_PUBLIC_LIFI_API_KEY,
    integrator: "BuilderCredit",
  },

  github: {
    token: process.env.GITHUB_TOKEN,
  },

  metamask: {
    projectId: process.env.NEXT_PUBLIC_METAMASK_PROJECT_ID,
  },

  blockchain: {
    privateKey: process.env.PRIVATE_KEY,
    infuraApiKey: process.env.INFURA_API_KEY,
    etherscanApiKey: process.env.ETHERSCAN_API_KEY,
  },
};

// Validate that a service has its required configuration (server-side only)
const validateApiService = (serviceName) => {
  const config = apiConfigs[serviceName];

  switch (serviceName) {
    case "circle":
      return !!(config.apiKey && config.walletSetId && config.platformWalletId);
    case "lifi":
      return !!config.apiKey;
    case "github":
      return !!config.token;
    case "metamask":
      return !!config.projectId;
    case "blockchain":
      return !!config.privateKey;
    default:
      return false;
  }
};

// Production-only required environment variables
const productionRequiredEnvVars = [
  "CIRCLE_API_KEY",
  "CIRCLE_WALLET_SET_ID",
  "CIRCLE_ENTITY_SECRET",
  "CIRCLE_PLATFORM_WALLET_ID",
  "NEXT_PUBLIC_LIFI_API_KEY",
  "GITHUB_TOKEN",
  "PRIVATE_KEY",
  "INFURA_API_KEY",
];

const validateServerEnvironment = () => {
  if (!isProduction) return;

  const missingProduction = productionRequiredEnvVars.filter(
    (variable) =>
      !process.env[variable] ||
      (typeof process.env[variable] === "string" &&
        process.env[variable].includes("your_")) ||
      process.env[variable] === "placeholder"
  );

  if (missingProduction.length > 0) {
    console.error(
      `❌ CRITICAL PRODUCTION ERROR: Missing or placeholder environment variables: ${missingProduction.join(
        ", "
      )}`
    );
  }
};

export { apiConfigs, validateApiService, validateServerEnvironment };