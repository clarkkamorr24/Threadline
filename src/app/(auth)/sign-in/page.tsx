import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
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
      <div className="mb-6 flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to your account to continue.</p>
      </div>

      <SignInForm redirectTo={resolveRedirectTo(params.redirectTo)} initialError={error} />
    </>
  );
}
