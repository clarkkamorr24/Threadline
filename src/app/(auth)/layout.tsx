import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@/constants/routes';

export default function AuthLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="border-line-strong relative hidden min-h-dvh overflow-hidden border-r-2 bg-[repeating-linear-gradient(135deg,#e6e4e1_0_11px,#eceae7_11px_22px)] lg:block">
        <span className="text-ink-55 absolute bottom-2.75 left-3 font-mono text-[10px] tracking-[0.06em] uppercase">
          editorial · atelier / grayscale
        </span>

        <div className="absolute top-9 left-9">
          <Link
            href={ROUTES.home}
            className="font-display text-2xl font-extrabold tracking-[-0.02em]"
          >
            THREADLINE<span className="text-brand">.</span>
          </Link>
        </div>

        <div className="absolute right-9 bottom-11 left-9">
          <h2 className="font-display text-[44px] leading-[0.98] font-extrabold tracking-[-0.03em]">
            Objects worth keeping.
          </h2>
          <p className="text-ink-70 mt-3.5 max-w-100 text-[15px]">
            Sign in to track orders, save favourites and check out faster.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-5 py-12 lg:px-14">
        <div className="mx-auto w-full max-w-105">
          <Link
            href={ROUTES.home}
            className="font-display mb-9 inline-block text-[22px] font-extrabold tracking-[-0.02em] lg:hidden"
          >
            THREADLINE<span className="text-brand">.</span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
}
