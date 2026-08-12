import { redirect } from 'next/navigation';
import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { CheckoutForm } from '@/features/checkout/ui/checkout-form';
import { CheckoutProgress } from '@/features/checkout/ui/checkout-progress';
import { requireUserOrRedirect } from '@/lib/auth/session';
import { getPaymentPlugin } from '@/lib/plugins/payment/registry';
import type { PaymentMethodOption } from '@/lib/plugins/payment/types';
import { getCart } from '@/services/cartService';

export const metadata: Metadata = {
  title: 'Checkout',
};

function listPaymentMethods(): readonly PaymentMethodOption[] {
  try {
    return getPaymentPlugin().availableMethods();
  } catch (error) {
    console.error('[checkout] Payment provider unavailable:', error);
    return [];
  }
}

export default async function CheckoutPage() {
  const user = await requireUserOrRedirect(ROUTES.checkout);
  const cart = await getCart(user.id);
  const paymentMethods = listPaymentMethods();
  console.log("paymentMethods", paymentMethods)
  if (cart.items.length === 0 || cart.hasStockIssues) {
    redirect(ROUTES.cart);
  }

  return (
    <div className="mx-auto max-w-360 px-5 pt-8 pb-16 lg:px-10">
      <CheckoutProgress activeIndex={1} />

      <h1 className="font-display mb-7 text-[34px] font-extrabold tracking-[-0.03em] md:text-[52px]">
        Checkout
      </h1>
      {paymentMethods.length === 0 ? (
        <Alert variant="destructive" className="rounded-none">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>
            Payments are unavailable right now, so orders cannot be placed. Please try again
            later.
          </AlertDescription>
        </Alert>
      ) : (
        <CheckoutForm
          totals={cart.totals}
          items={cart.items}
          defaultName={user.name ?? ''}
          email={user.email}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
}
