import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { ROUTES } from '@/constants/routes';
import { getCurrentUser } from '@/lib/auth/session';
import { SiteFooter } from '@/widgets/footer/site-footer';
import { SiteHeader } from '@/widgets/header/site-header';

export default async function ShopLayout({ children }: { readonly children: ReactNode }) {
  const user = await getCurrentUser();

  if (user?.role === 'ADMIN') {
    redirect(ROUTES.admin.root);
  }

  return (
    <>
      <a
        href="#main"
        className="bg-background focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:border focus:px-4 focus:py-2 focus:ring-2"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter />
    </>
  );
}
