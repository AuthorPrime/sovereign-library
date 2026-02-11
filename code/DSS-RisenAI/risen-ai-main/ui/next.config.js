/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Enable for Electron
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
