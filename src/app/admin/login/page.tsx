import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { STORE_NAME } from '@/constants/store';
import { AdminSignInForm } from '@/features/admin-auth/ui/admin-sign-in-form';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const user = await getCurrentUser();

  if (user?.role === 'ADMIN' && user.isActive) {
    redirect(ROUTES.admin.root);
  }

  return (
    <main className="bg-admin-sidebar grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-96">
        <div className="mb-8 text-center">
          <div className="font-display text-[22px] font-extrabold tracking-[-0.01em] text-white">
            {STORE_NAME.toUpperCase()}
            <span className="text-brand">.</span>
          </div>
          <div className="mt-1.5 font-mono text-[11px] tracking-[0.14em] text-white/50 uppercase">
            Admin access
          </div>
        </div>

        <div className="bg-background border-line border p-7">
          <AdminSignInForm />
        </div>
      </div>
    </main>
  );
}
