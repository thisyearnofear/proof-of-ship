/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  // Ensure consistent styling
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
