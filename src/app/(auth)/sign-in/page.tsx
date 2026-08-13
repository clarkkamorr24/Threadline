import Link from 'next/link';
import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { AuthErrorNotice } from '@/features/auth/ui/auth-error-notice';
import { SignInForm } from '@/features/auth/ui/sign-in-form';

export const metadata: Metadata = {
  title: 'Sign in',
};

interface SignInPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function resolveRedirectTo(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate && candidate.startsWith('/') && !candidate.startsWith('//')) {
    return candidate;
  }

  return ROUTES.home;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <>
      <span className="text-brand font-mono text-[11px] tracking-[0.16em] uppercase">
        Welcome back
      </span>
      <h1 className="font-display mt-3 mb-2 text-[34px] font-extrabold tracking-[-0.02em] md:text-[40px]">
        Sign in
      </h1>
      <p className="text-ink-70 mb-7 text-sm">
        New to Threadline?{' '}
        <Link href={ROUTES.signUp} className="text-brand hover:underline">
          Create an account
        </Link>
      </p>

      <AuthErrorNotice fallback={error} />

      <SignInForm redirectTo={resolveRedirectTo(params.redirectTo)} />
    </>
  );
}
