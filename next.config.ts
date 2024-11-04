/** @type {import('next').NextConfig} */
const nextConfig = {
eslint: {
        ignoreDuringBuilds: true,
    },
  reactStrictMode: true,
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
