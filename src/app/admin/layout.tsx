import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { getCurrentUser } from '@/lib/auth/session';

const NAV_ITEMS = [
  { href: ROUTES.admin.root, label: 'Overview', icon: LayoutDashboard },
  { href: ROUTES.admin.products, label: 'Products', icon: Package },
  { href: ROUTES.admin.orders, label: 'Orders', icon: ShoppingCart },
  { href: ROUTES.admin.users, label: 'Users', icon: Users },
] as const;

export default async function AdminLayout({ children }: { readonly children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`${ROUTES.signIn}?redirectTo=${encodeURIComponent(ROUTES.admin.root)}`);
  }

  if (user.role !== 'ADMIN') {
    redirect(ROUTES.home);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 lg:flex-row">
      <aside className="lg:w-52 lg:shrink-0">
        <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
          Admin
        </p>
        <nav aria-label="Admin sections">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors"
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
