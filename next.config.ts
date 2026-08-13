import type { NextConfig } from 'next';

const OAUTH_AVATAR_HOSTS = [
  'lh3.googleusercontent.com',
  'avatars.githubusercontent.com',
] as const;

function buildRemotePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const configured = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);

  const hosts = [...new Set([...configured, ...OAUTH_AVATAR_HOSTS])];

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
