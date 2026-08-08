import Link from 'next/link';
import { Suspense } from 'react';
import { ROUTES } from '@/constants/routes';
import { getCurrentUser } from '@/lib/auth/session';
import { getCartItemCount } from '@/services/cartService';
import { listCategories } from '@/services/productService';
import { CartButton } from './cart-button';
import { HeaderSearch } from './header-search';
import { MobileNav } from './mobile-nav';
import { UserMenu } from './user-menu';

async function CartBadge() {
  const user = await getCurrentUser();
  const count = user ? await getCartItemCount(user.id) : 0;

  return <CartButton itemCount={count} />;
}

async function safeListCategories() {
  try {
    return await listCategories();
  } catch (error) {
    console.error('[site-header] Could not load categories:', error);
    return [];
  }
}

export async function SiteHeader() {
  const [user, categories] = await Promise.all([getCurrentUser(), safeListCategories()]);

  const navItems = categories.map((category) => ({
    label: category.name,
    href: ROUTES.category(category.slug),
  }));

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <MobileNav items={navItems} />

        <Link
          href={ROUTES.home}
          className="font-display text-xl font-semibold tracking-wide whitespace-nowrap"
        >
          Threadline
        </Link>

        <nav aria-label="Categories" className="hidden md:block">
          <ul className="flex items-center gap-1">
            <li>
              <Link
                href={ROUTES.products}
                className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                All
              </Link>
            </li>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <HeaderSearch />
          <Suspense fallback={<CartButton itemCount={0} />}>
            <CartBadge />
          </Suspense>
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
