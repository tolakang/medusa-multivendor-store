/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      ...(process.env.NEXT_PUBLIC_BASE_URL ? [{
        protocol: process.env.NEXT_PUBLIC_BASE_URL.startsWith("https") ? "https" : "http",
        hostname: process.env.NEXT_PUBLIC_BASE_URL.replace(/^https?:\/\//, ""),
      }] : []),
      ...(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ? [{
        protocol: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL.startsWith("https") ? "https" : "http",
        hostname: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL.replace(/^https?:\/\//, ""),
      }] : []),
    ],
  },
  serverRuntimeConfig: {
    port: process.env.PORT || 3000,
  },
};

module.exports = nextConfig;
