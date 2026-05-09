/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // needed for @mediapipe
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

module.exports = nextConfig;