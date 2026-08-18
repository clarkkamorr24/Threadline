import type { NextConfig } from 'next';

const OAUTH_AVATAR_HOSTS = ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'] as const;

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

function buildCsp(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${supabase} https://api.cloudinary.com wss://*.supabase.co`.trim(),
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(isProduction ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: buildCsp() },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
] as const;

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: [...SECURITY_HEADERS] }];
  },
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
