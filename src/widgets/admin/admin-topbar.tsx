'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

const TITLES: readonly { readonly prefix: string; readonly title: string }[] = [
  { prefix: ROUTES.admin.newProduct, title: 'Add product' },
  { prefix: ROUTES.admin.products, title: 'Products' },
  { prefix: ROUTES.admin.newCategory, title: 'Add category' },
  { prefix: ROUTES.admin.categories, title: 'Categories' },
  { prefix: ROUTES.admin.orders, title: 'Orders' },
  { prefix: ROUTES.admin.users, title: 'Customers' },
];

function titleFor(pathname: string): string {
  return TITLES.find((entry) => pathname.startsWith(entry.prefix))?.title ?? 'Dashboard';
}

interface AdminTopbarProps {
  readonly email: string;
}

export function AdminTopbar({ email }: AdminTopbarProps) {
  const pathname = usePathname();

  return (
    <header className="border-line-strong bg-background/90 sticky top-0 z-20 flex items-center gap-5 border-b-2 px-5 py-4 backdrop-blur-[10px] lg:px-8">
      <h1 className="font-display text-xl font-extrabold tracking-[-0.02em] lg:text-[26px]">
        {titleFor(pathname)}
      </h1>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-ink-55 hidden font-mono text-[11px] sm:inline">{email}</span>
        <Link
          href={ROUTES.home}
          className="border-line-strong hover:border-foreground border px-3.5 py-2 text-[13px] transition-colors lg:hidden"
        >
          Exit
        </Link>
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="border-line-strong hover:border-foreground border px-3.5 py-2 text-[13px] transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
