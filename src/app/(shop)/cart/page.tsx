import Link from 'next/link';
import type { Metadata } from 'next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ROUTES } from '@/constants/routes';
import { CartLineItem } from '@/features/cart/ui/cart-line-item';
import { OrderSummary } from '@/features/cart/ui/order-summary';
import { CheckoutProgress } from '@/features/checkout/ui/checkout-progress';
import { requireUserOrRedirect } from '@/lib/auth/session';
import { getCart } from '@/services/cartService';

export const metadata: Metadata = {
  title: 'Your bag',
};

export default async function CartPage() {
  const user = await requireUserOrRedirect(ROUTES.cart);
  const cart = await getCart(user.id);

  return (
    <div className="mx-auto max-w-360 px-5 pt-8 pb-16 lg:px-10">
      <CheckoutProgress activeIndex={0} />

      <h1 className="font-display mb-7 text-[34px] font-extrabold tracking-[-0.03em] md:text-[52px]">
        Your bag
      </h1>

      {cart.items.length === 0 ? (
        <div className="border-line-strong border-t-2 px-5 py-20 text-center">
          <div className="font-display text-[28px] font-extrabold">Your bag is empty</div>
          <p className="text-ink-70 mt-2.5 mb-5">Add something worth keeping to get started.</p>
          <Link
            href={ROUTES.products}
            className="bg-primary text-primary-foreground inline-block px-6.5 py-3.5 text-sm font-medium"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="border-line-strong grid border-t-2 lg:grid-cols-[1fr_380px]">
          <section aria-label="Bag items" className="border-line-strong lg:border-r-2">
            {cart.hasStockIssues ? (
              <Alert variant="destructive" className="mt-6 rounded-none">
                <AlertDescription>
                  Some items exceed available stock. Adjust the quantities to continue.
                </AlertDescription>
              </Alert>
            ) : null}

            <ul>
              {cart.items.map((item) => (
                <CartLineItem key={item.id} item={item} />
              ))}
            </ul>

            <Link
              href={ROUTES.products}
              className="text-ink-70 hover:text-foreground my-5 inline-block text-sm transition-colors"
            >
              ← Continue shopping
            </Link>
          </section>

          <aside className="self-start py-7 lg:sticky lg:top-24 lg:pl-8">
            <OrderSummary totals={cart.totals}>
              <Link
                href={ROUTES.checkout}
                aria-disabled={cart.hasStockIssues}
                className={
                  cart.hasStockIssues
                    ? 'bg-secondary text-ink-55 pointer-events-none flex items-center justify-center px-4 py-4 text-[15px]'
                    : 'bg-primary text-primary-foreground flex items-center justify-center px-4 py-4 text-[15px] font-medium'
                }
              >
                Proceed to Checkout
              </Link>
              <p className="text-ink-55 mt-3 text-center font-mono text-[11px]">
                Secure checkout · GCash &amp; Maya
              </p>
            </OrderSummary>
          </aside>
        </div>
      )}
    </div>
  );
}
