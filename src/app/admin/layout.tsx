import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { ROUTES } from '@/constants/routes';
import { getUserInitials } from '@/entities/user/model/types';
import { getCurrentUser } from '@/lib/auth/session';
import { AdminSidebar } from '@/widgets/admin/admin-sidebar';
import { AdminTopbar } from '@/widgets/admin/admin-topbar';

export default async function AdminLayout({ children }: { readonly children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`${ROUTES.signIn}?redirectTo=${encodeURIComponent(ROUTES.admin.root)}`);
  }

  if (user.role !== 'ADMIN') {
    redirect(ROUTES.home);
  }

  return (
    <div className="bg-background grid min-h-dvh lg:grid-cols-[248px_1fr]">
      <AdminSidebar name={user.name ?? user.email} initials={getUserInitials(user)} />

      <div className="flex min-w-0 flex-col">
        <AdminTopbar email={user.email} />

        <main className="flex-1 px-5 pt-7 pb-16 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
