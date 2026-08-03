import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@/constants/routes';

export default function AuthLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12">
      <Link href={ROUTES.home} className="mb-8 text-center text-xl font-semibold tracking-tight">
        Threadline
      </Link>
      {children}
    </div>
  );
}
