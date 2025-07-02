/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  },
  // Common configuration for all environments
  images: {
    domains: ["avatars.githubusercontent.com", "github.com"],
  },
  // For Firebase deployment (static export)
  ...(process.env.EXPORT_MODE === "true"
    ? {
        output: "export",
        images: {
          unoptimized: true,
        },
        trailingSlash: false,
        skipTrailingSlashRedirect: true,
      }
    : {}),
  // Webpack configuration for polyfills and optimizations
  webpack: (config, { isServer }) => {
    // Add polyfill for async storage in browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@react-native-async-storage/async-storage": require.resolve(
          "./src/lib/asyncStoragePolyfill.js"
        ),
      };
    }

    // Handle MetaMask SDK dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": require.resolve(
        "./src/lib/asyncStoragePolyfill.js"
      ),
    };

    return config;
  },
};

module.exports = nextConfig;
