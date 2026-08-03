'use server';

import { revalidatePath } from 'next/cache';
import { clientEnv } from '@/config/env';
import { ROUTES } from '@/constants/routes';
import { requireUser } from '@/lib/auth/session';
import { getPaymentPlugin } from '@/lib/plugins/payment/registry';
import { createAction } from '@/lib/serverAction';
import { placeOrder } from '@/services/orderService';
import { shippingAddressSchema } from '../model/schema';

export interface PlaceOrderResult {
  readonly orderId: string;
  readonly orderNumber: string;
  /** Set when the payment provider needs the customer to complete a step. */
  readonly redirectUrl: string | null;
}

/**
 * Places an order from the signed-in user's cart.
 *
 * The client sends an address and nothing else. Line items, prices, stock and
 * totals are all read server-side inside `placeOrder`'s transaction, so a
 * tampered payload cannot change what is charged or what is reserved.
 *
 * Payment goes through the plugin registry rather than a hardcoded processor —
 * see lib/plugins/payment.
 */
export const placeOrderAction = createAction(
  'checkout.placeOrder',
  shippingAddressSchema,
  async (address): Promise<PlaceOrderResult> => {
    const user = await requireUser();

    const order = await placeOrder({ userId: user.id, shippingAddress: address });
    const payment = await getPaymentPlugin();
    const intent = await payment.createIntent({
      orderReference: order.orderNumber,
      amountCents: order.totalCents,
      currency: order.currency,
      customerEmail: user.email,
      returnUrl: `${clientEnv.NEXT_PUBLIC_SITE_URL}${ROUTES.order(order.id)}`,
    });

    revalidatePath(ROUTES.orders);
    revalidatePath(ROUTES.cart);
    revalidatePath('/', 'layout');

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      redirectUrl: intent.requiresAction ? intent.redirectUrl : null,
    };
  },
);
