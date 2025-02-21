/** @type {import('next').NextConfig} */
const nextConfig = {

  reactStrictMode: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.tomtom.com',
        port: '',
      },
    ],
  },
}

module.exports = nextConfig
