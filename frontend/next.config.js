/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  transpilePackages: [
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-phantom',
    '@solana/wallet-adapter-solflare',
    '@solana-mobile/wallet-adapter-mobile',
  ],
  // Enable skew protection (if supported by the deployment platform)
  deploymentId:
    process.env.NEXT_PUBLIC_DEPLOYMENT_ID ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    undefined,
  // Redirect old routes to consolidated pages
  async redirects() {
    return [
      { source: '/shippers', destination: '/explore', permanent: true },
      { source: '/hackathons', destination: '/explore?tab=hackathons', permanent: true },
      { source: '/credit', destination: '/build', permanent: true },
      { source: '/dashboard', destination: '/build?tab=projects', permanent: true },
      { source: '/expedition', destination: '/back', permanent: true },
      { source: '/backer-portfolio', destination: '/back?tab=portfolio', permanent: true },
      // Removed pages — redirect to closest equivalents
      { source: '/fleet', destination: '/explore', permanent: true },
      { source: '/campaigns', destination: '/build', permanent: true },
      { source: '/feedback', destination: '/', permanent: true },
      { source: '/design', destination: '/', permanent: true },
      { source: '/about', destination: '/', permanent: true },
    ];
  },
  // Common configuration for all environments
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' }
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
  turbopack: {},
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;
