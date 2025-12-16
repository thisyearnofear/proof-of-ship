/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Common configuration for all environments
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'github.com' }
    ],
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
};

module.exports = nextConfig;
