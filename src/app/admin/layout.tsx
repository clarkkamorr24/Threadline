import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { FolderTree, LayoutDashboard, LogOut, Package, ShoppingCart, Users } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { getUserInitials } from '@/entities/user/model/types';
import { getCurrentUser } from '@/lib/auth/session';

const NAV_ITEMS = [
  { href: ROUTES.admin.root, label: 'Overview', icon: LayoutDashboard },
  { href: ROUTES.admin.products, label: 'Products', icon: Package },
  { href: ROUTES.admin.categories, label: 'Categories', icon: FolderTree },
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
    <>
      <header className="bg-background sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link href={ROUTES.admin.root} className="font-semibold tracking-tight">
            Threadline
            <span className="text-muted-foreground ml-2 text-xs font-normal">Admin</span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-muted-foreground hidden text-sm sm:inline">{user.email}</span>
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt=""
                width={28}
                height={28}
                className="size-7 rounded-full object-cover"
              />
            ) : (
              <span className="bg-secondary text-secondary-foreground flex size-7 items-center justify-center rounded-full text-xs font-medium">
                {getUserInitials(user)}
              </span>
            )}
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 lg:flex-row">
        <aside className="lg:w-52 lg:shrink-0">
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
      </main>
    </>
  );
}
