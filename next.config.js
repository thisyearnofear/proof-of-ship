/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    : {
        // For Vercel deployment (server-side features)
        images: {
          domains: ["avatars.githubusercontent.com", "github.com"],
        },
      }),
};

module.exports = nextConfig;
