import type { NextConfig } from 'next';

function buildRemotePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const hosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);

  return hosts.map((hostname) => ({
    protocol: hostname === 'localhost' ? 'http' : 'https',
    hostname,
  }));
}

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: buildRemotePatterns(),
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  serverExternalPackages: ['@prisma/adapter-pg', 'pg', 'cloudinary'],
};

export default nextConfig;
