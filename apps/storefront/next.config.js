/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  serverRuntimeConfig: {
    port: process.env.PORT || 8000,
  },
};

module.exports = nextConfig;
