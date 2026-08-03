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
      <div className="mb-6 flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground text-sm">
          Save your cart, track orders and check out faster.
        </p>
      </div>

      <SignUpForm redirectTo={resolveRedirectTo(params.redirectTo)} />
    </>
  );
}
