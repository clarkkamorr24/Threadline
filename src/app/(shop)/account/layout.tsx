import type { ReactNode } from 'react';
import { ROUTES } from '@/constants/routes';
import { AccountTabs } from '@/features/account/ui/account-tabs';
import { requireUserOrRedirect } from '@/lib/auth/session';

export default async function AccountLayout({ children }: { readonly children: ReactNode }) {
  const user = await requireUserOrRedirect(ROUTES.account);
  const firstName = (user.name ?? '').trim().split(' ')[0];

  return (
    <div className="mx-auto max-w-360 px-5 pt-9 pb-16 lg:px-10">
      <header className="border-line-strong mb-7 flex flex-wrap items-end justify-between gap-4 border-b-2 pb-6">
        <div>
          <div className="text-brand font-mono text-xs tracking-[0.14em] uppercase">
            My account
          </div>
          <h1 className="font-display mt-2 text-[30px] font-extrabold tracking-[-0.03em] md:text-[44px]">
            Hello{firstName ? `, ${firstName}` : ''}.
          </h1>
        </div>

        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="border-line-strong hover:border-foreground border px-4.5 py-2.75 text-[13px] transition-colors"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:gap-0">
        <aside className="border-line-strong self-start lg:sticky lg:top-24 lg:border-r-2 lg:pr-6">
          <AccountTabs />
        </aside>

        <div className="lg:pl-9">{children}</div>
      </div>
    </div>
  );
}
