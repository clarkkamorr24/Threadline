'use server';

import { revalidatePath } from 'next/cache';
import { clientEnv } from '@/config/env';
import { ROUTES } from '@/constants/routes';
import { STORE_CURRENCY } from '@/constants/store';
import { requireShopper } from '@/lib/auth/session';
import { getPaymentPlugin } from '@/lib/plugins/payment/registry';
import { createAction } from '@/lib/serverAction';
import { placeOrder } from '@/services/orderService';
import { shippingAddressSchema } from '../model/schema';

export interface PlaceOrderResult {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly redirectUrl: string | null;
}
export const placeOrderAction = createAction(
  'checkout.placeOrder',
  shippingAddressSchema,
  async (address): Promise<PlaceOrderResult> => {
    const user = await requireShopper();

    const order = await placeOrder({ userId: user.id, shippingAddress: address });
    const payment = await getPaymentPlugin();
    const intent = await payment.createIntent({
      orderReference: order.orderNumber,
      amountCents: order.totalCents,
      currency: STORE_CURRENCY,
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
