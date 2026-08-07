import Link from 'next/link';
import type { Metadata } from 'next';
import { ShoppingBag } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { CartLineItem } from '@/features/cart/ui/cart-line-item';
import { OrderSummary } from '@/features/cart/ui/order-summary';
import { requireUserOrRedirect } from '@/lib/auth/session';
import { getCart } from '@/services/cartService';

export const metadata: Metadata = {
  title: 'Your cart',
};

export default async function CartPage() {
  const user = await requireUserOrRedirect(ROUTES.cart);
  const cart = await getCart(user.id);

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Once you add something it will show up here."
          action={
            <Button asChild>
              <Link href={ROUTES.products}>Browse products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Your cart</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <section aria-label="Cart items">
          <ul className="divide-y border-y">
            {cart.items.map((item) => (
              <CartLineItem key={item.id} item={item} />
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          {cart.hasStockIssues ? (
            <Alert variant="destructive">
              <AlertDescription>
                Some items exceed available stock. Adjust the quantities to continue.
              </AlertDescription>
            </Alert>
          ) : null}

          <OrderSummary totals={cart.totals}>
            <Button
              asChild
              size="lg"
              className={cn('w-full', cart.hasStockIssues && 'pointer-events-none opacity-50')}
            >
              <Link
                href={cart.hasStockIssues ? ROUTES.cart : ROUTES.checkout}
                aria-disabled={cart.hasStockIssues || undefined}
                tabIndex={cart.hasStockIssues ? -1 : undefined}
              >
                Proceed to checkout
              </Link>
            </Button>
          </OrderSummary>
        </aside>
      </div>
    </div>
  );
}
