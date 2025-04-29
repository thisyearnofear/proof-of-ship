/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  // Disable server-side features for static export
  trailingSlash: false,
  // Skip API routes during static export
  skipTrailingSlashRedirect: true,
  // Exclude API routes from static export
  experimental: {
    excludeDefaultMomentLocales: true,
  },
};

module.exports = nextConfig;
