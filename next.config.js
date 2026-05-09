/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: [
    '@mediapipe/face_mesh',
    '@mediapipe/camera_utils',
    '@mediapipe/drawing_utils',
    'face-api.js',
    'groq-sdk',
  ],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

module.exports = nextConfig;