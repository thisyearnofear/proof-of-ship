/**
 * Environment configuration for the POS Dashboard
 * Provides environment-specific settings and validation
 */

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// Required environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

// API Service configurations
const apiConfigs = {
  circle: {
    apiKey: process.env.CIRCLE_API_KEY,
    walletSetId: process.env.CIRCLE_WALLET_SET_ID,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET,
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

// Validate required environment variables
const validateEnvironment = () => {
  // Skip validation during build time
  if (typeof window === "undefined") {
    return;
  }

  const missing = requiredEnvVars.filter(
    (variable) =>
      !process.env[variable] ||
      process.env[variable] === "dummy-api-key" ||
      process.env[variable].includes("dummy")
  );

  if (missing.length > 0) {
    console.warn(
      `Missing or dummy Firebase environment variables: ${missing.join(", ")}`
    );
    console.warn(
      "Firebase features may not work properly. Please configure environment variables."
    );
    // Don't throw error, just warn
  }
};

// Base configuration
const baseConfig = {
  isDevelopment,
  isProduction,
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy.appspot.com",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:dummy",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-DUMMY",
  },
  api: {
    baseUrl: isProduction
      ? "https://proofofship.web.app/api"
      : "http://localhost:3000/api",
    timeout: 30000,
    retryAttempts: 3,
  },
  features: {
    enableMockData: false, // Never enable mock data in any environment
    enableAnalytics: isProduction,
    enableErrorReporting: isProduction,
  },
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    githubDataTTL: 60 * 60 * 1000, // 1 hour
    contractDataTTL: 60 * 1000, // 1 minute
  },
};

// Environment-specific overrides
const environmentConfig = {
  development: {
    ...baseConfig,
    api: {
      ...baseConfig.api,
      timeout: 10000,
    },
    features: {
      ...baseConfig.features,
      enableAnalytics: false,
      enableErrorReporting: false,
    },
  },
  production: {
    ...baseConfig,
    features: {
      ...baseConfig.features,
      enableAnalytics: true,
      enableErrorReporting: true,
    },
  },
  test: {
    ...baseConfig,
    features: {
      ...baseConfig.features,
      enableAnalytics: false,
      enableErrorReporting: false,
    },
  },
};

// API service validation helpers
const validateApiService = (serviceName) => {
  const config = apiConfigs[serviceName];

  switch (serviceName) {
    case "circle":
      return !!(config.apiKey && config.walletSetId);
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

// Get current environment config
const getConfig = () => {
  const env = process.env.NODE_ENV || "development";
  const config = environmentConfig[env] || environmentConfig.development;

  // Add API configurations
  config.apis = apiConfigs;
  config.apiStatus = {
    circle: validateApiService("circle"),
    lifi: validateApiService("lifi"),
    github: validateApiService("github"),
    metamask: validateApiService("metamask"),
    blockchain: validateApiService("blockchain"),
  };

  // Only validate environment in runtime, not during build
  if (typeof window !== "undefined") {
    validateEnvironment();
  }

  return config;
};

export default getConfig();
export { validateEnvironment, apiConfigs, validateApiService };
