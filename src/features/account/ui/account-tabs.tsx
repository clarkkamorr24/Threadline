'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Overview', href: ROUTES.account },
  { label: 'Orders', href: ROUTES.orders },
  { label: 'Notifications', href: ROUTES.notifications },
  { label: 'Wishlist', href: ROUTES.favorites },
  { label: 'Profile', href: ROUTES.profile },
] as const;

export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account sections" className="flex gap-0.5 overflow-x-auto lg:flex-col">
      {TABS.map((tab) => {
        const isActive =
          tab.href === ROUTES.account ? pathname === tab.href : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'border-l-2 px-3.5 py-2.75 text-sm whitespace-nowrap transition-colors',
              isActive
                ? 'border-brand text-foreground bg-[color-mix(in_srgb,var(--ink)_5%,transparent)] font-semibold'
                : 'text-ink-70 hover:text-foreground border-transparent hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)]',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
