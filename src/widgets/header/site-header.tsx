import Link from 'next/link';
import { Suspense } from 'react';
import { FREE_SHIPPING_THRESHOLD_CENTS } from '@/constants/catalog';
import { ROUTES } from '@/constants/routes';
import { formatMoney } from '@/utils/money';
import { getCurrentUser } from '@/lib/auth/session';
import { CustomerNotifications } from '@/features/notifications/ui/customer-notifications';
import { getCartItemCount } from '@/services/cartService';
import { listStoredNotifications } from '@/services/notificationService';
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

async function NotificationBadge() {
  const user = await getCurrentUser();

  if (user?.role !== 'USER') {
    return null;
  }

  const items = await listStoredNotifications(user.id, false);

  return (
    <CustomerNotifications
      userId={user.id}
      feed={{
        items: items.slice(0, 8),
        unreadCount: items.filter((item) => !item.isRead).length,
        total: items.length,
      }}
    />
  );
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
    <>
      <div className="bg-primary text-primary-foreground hidden px-4 py-2 text-center font-mono text-[11px] tracking-[0.14em] uppercase md:block">
        Complimentary shipping over {formatMoney(FREE_SHIPPING_THRESHOLD_CENTS)} — 30-day returns
      </div>

      <header className="border-line-strong bg-background/88 supports-backdrop-filter:bg-background/80 sticky top-0 z-40 border-b-2 backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-360 items-center gap-8 px-5 py-4 lg:px-10">
          <MobileNav items={navItems} />

          <Link
            href={ROUTES.home}
            className="font-display text-[22px] leading-none font-extrabold tracking-[-0.02em] whitespace-nowrap"
          >
            THREADLINE<span className="text-brand">.</span>
          </Link>

          <nav aria-label="Categories" className="hidden md:block">
            <ul className="flex items-center gap-6 text-[13px]">
              {/* <li>
                <Link href={ROUTES.products} className="hover:text-brand transition-colors">
                  Shop
                </Link>
              </li> */}
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-brand transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <HeaderSearch />
            <Suspense fallback={null}>
              <NotificationBadge />
            </Suspense>
            <Suspense fallback={<CartButton itemCount={0} />}>
              <CartBadge />
            </Suspense>
            <UserMenu user={user} />
          </div>
        </div>
      </header>
    </>
  );
}
