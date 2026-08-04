import type { Metadata, Viewport } from 'next';
import { clientEnv } from '@/config/env';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: 'Threadline — Considered everyday clothing',
    template: '%s · Threadline',
  },
  description:
    'Well-made basics and outerwear in natural fibres, cut for everyday wear and built to last.',
  openGraph: {
    type: 'website',
    siteName: 'Threadline',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
