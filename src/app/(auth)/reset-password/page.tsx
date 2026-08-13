import Link from 'next/link';
import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { ResetPasswordForm } from '@/features/auth/ui/reset-password-form';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Set a new password',
};

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <span className="text-brand font-mono text-[11px] tracking-[0.16em] uppercase">Reset</span>
        <div className="mt-3 mb-6 flex flex-col gap-2">
          <h1 className="font-display text-[34px] font-extrabold tracking-[-0.02em] md:text-[40px]">
            This link has expired
          </h1>
          <p className="text-ink-70 text-sm">
            Password reset links can only be used once and expire after a short while. Request a
            fresh one to continue.
          </p>
        </div>

        <Link
          href={ROUTES.forgotPassword}
          className="bg-primary text-primary-foreground flex items-center justify-center px-4 py-[15px] text-[15px] font-medium"
        >
          Request a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <span className="text-brand font-mono text-[11px] tracking-[0.16em] uppercase">Reset</span>
      <div className="mt-3 mb-6 flex flex-col gap-2">
        <h1 className="font-display text-[34px] font-extrabold tracking-[-0.02em] md:text-[40px]">
          Set a new password
        </h1>
        <p className="text-ink-70 text-sm">
          Choose a new password for <strong className="text-foreground">{user.email}</strong>.
        </p>
      </div>

      <ResetPasswordForm />
    </>
  );
}
