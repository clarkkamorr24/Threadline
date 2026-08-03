import Link from 'next/link';
import type { Metadata } from 'next';
import { Package, ShoppingBag } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { requireUserOrRedirect } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Account',
};

const ACCOUNT_LINKS = [
  {
    href: ROUTES.orders,
    icon: Package,
    title: 'Your orders',
    description: 'Track status and review past purchases.',
  },
  {
    href: ROUTES.cart,
    icon: ShoppingBag,
    title: 'Your cart',
    description: 'Pick up where you left off.',
  },
] as const;

export default async function AccountPage() {
  const user = await requireUserOrRedirect(ROUTES.account);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {user.name ? `Hello, ${user.name}` : 'Your account'}
        </h1>
        <p className="text-muted-foreground text-sm">{user.email}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {ACCOUNT_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2">
            <Card className="hover:bg-accent/50 h-full transition-colors">
              <CardHeader>
                <link.icon className="text-muted-foreground mb-2 size-5" aria-hidden="true" />
                <CardTitle className="text-base">{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
