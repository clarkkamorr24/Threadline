import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { CheckoutForm } from '@/features/checkout/ui/checkout-form';
import { requireUserOrRedirect } from '@/lib/auth/session';
import { getCart } from '@/services/cartService';

export const metadata: Metadata = {
  title: 'Checkout',
};

export default async function CheckoutPage() {
  const user = await requireUserOrRedirect(ROUTES.checkout);
  const cart = await getCart(user.id);

  if (cart.items.length === 0 || cart.hasStockIssues) {
    redirect(ROUTES.cart);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Checkout</h1>
      <CheckoutForm totals={cart.totals} defaultName={user.name ?? ''} />
    </div>
  );
}
