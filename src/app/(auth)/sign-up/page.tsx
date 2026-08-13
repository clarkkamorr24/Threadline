import Link from 'next/link';
import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { SignUpForm } from '@/features/auth/ui/sign-up-form';

export const metadata: Metadata = {
  title: 'Create an account',
};

interface SignUpPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function resolveRedirectTo(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate && candidate.startsWith('/') && !candidate.startsWith('//')) {
    return candidate;
  }

  return ROUTES.home;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;

  return (
    <>
      <>
        <span className="text-brand font-mono text-[11px] tracking-[0.16em] uppercase">
          Join Threadline
        </span>
        <h1 className="font-display mt-3 mb-2 text-[34px] font-extrabold tracking-[-0.02em] md:text-[40px]">
          Create account
        </h1>
        <p className="text-ink-70 mb-7 text-sm">
          Already have one?{' '}
          <Link href={ROUTES.signIn} className="text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </>

      <SignUpForm redirectTo={resolveRedirectTo(params.redirectTo)} />
    </>
  );
}
