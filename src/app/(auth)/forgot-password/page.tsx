import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth/ui/forgot-password-form';

export const metadata: Metadata = {
  title: 'Reset your password',
};

export default function ForgotPasswordPage() {
  return (
    <>
      <span className="text-brand font-mono text-[11px] tracking-[0.16em] uppercase">Reset</span>
      <h1 className="font-display mt-3 mb-2 text-[34px] font-extrabold tracking-[-0.02em] md:text-[40px]">
        Forgot password
      </h1>
      <p className="text-ink-70 mb-7 text-sm">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      <ForgotPasswordForm />
    </>
  );
}
