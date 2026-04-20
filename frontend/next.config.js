/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable skew protection (if supported by the deployment platform)
  deploymentId: process.env.NEXT_PUBLIC_DEPLOYMENT_ID || 'stable',
  // Redirect old routes to consolidated pages
  async redirects() {
    return [
      { source: '/shippers', destination: '/explore', permanent: true },
      { source: '/hackathons', destination: '/explore?tab=hackathons', permanent: true },
      { source: '/credit', destination: '/build', permanent: true },
      { source: '/dashboard', destination: '/build?tab=projects', permanent: true },
      { source: '/expedition', destination: '/back', permanent: true },
      { source: '/backer-portfolio', destination: '/back?tab=portfolio', permanent: true },
    ];
  },
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
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;
