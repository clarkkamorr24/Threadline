'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: ROUTES.admin.root, label: 'Dashboard', icon: LayoutDashboard },
  { href: ROUTES.admin.products, label: 'Products', icon: Package },
  { href: ROUTES.admin.categories, label: 'Categories', icon: FolderTree },
  { href: ROUTES.admin.orders, label: 'Orders', icon: ShoppingCart },
  { href: ROUTES.admin.users, label: 'Customers', icon: Users },
] as const;

interface AdminSidebarProps {
  readonly name: string;
  readonly initials: string;
}

export function AdminSidebar({ name, initials }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="bg-admin-sidebar sticky top-0 hidden h-screen flex-col px-3.5 py-5.5 text-[#f4f3f1] lg:flex">
      <div className="px-3 pt-1.5 pb-5.5">
        <Link href={ROUTES.admin.root} className="font-display text-[19px] font-extrabold text-white">
          THREADLINE<span className="text-brand">.</span>
        </Link>
      </div>

      <div className="px-3.5 pb-2.5 font-mono text-[10px] tracking-[0.12em] text-white/40 uppercase">
        Management
      </div>

      <nav aria-label="Admin sections" className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === ROUTES.admin.root
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 border-l-2 px-3.5 py-2.75 text-sm transition-colors',
                isActive
                  ? 'border-brand bg-white/9 font-semibold text-white'
                  : 'border-transparent text-white/60 hover:bg-white/6 hover:text-white',
              )}
            >
              <item.icon aria-hidden="true" className="size-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="flex items-center gap-2.75 px-3 py-1.5">
          <span className="bg-brand grid size-9 shrink-0 place-items-center text-[13px] font-extrabold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-white">{name}</div>
            <div className="font-mono text-[10px] text-white/45">Store admin</div>
          </div>
        </div>

        <Link
          href={ROUTES.home}
          className="mt-1.5 flex items-center gap-3 border-l-2 border-transparent px-3.5 py-2.75 text-sm text-white/60 transition-colors hover:bg-white/6 hover:text-white"
        >
          <LogOut aria-hidden="true" className="size-4.5 shrink-0" />
          Exit to store
        </Link>
      </div>
    </aside>
  );
}
