'use server';

import { revalidatePath } from 'next/cache';
import { clientEnv } from '@/config/env';
import { ROUTES } from '@/constants/routes';
import { STORE_CURRENCY } from '@/constants/store';
import { requireShopper } from '@/lib/auth/session';
import { ValidationError, isAppError } from '@/lib/errors';
import { getPaymentPlugin } from '@/lib/plugins/payment/registry';
import { createAction } from '@/lib/serverAction';
import { attachPaymentReference, placeOrder } from '@/services/orderService';
import { placeOrderSchema } from '../model/schema';

export interface PlaceOrderResult {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly redirectUrl: string | null;
  readonly paymentError: string | null;
}

export const placeOrderAction = createAction(
  'checkout.placeOrder',
  placeOrderSchema,
  async (input): Promise<PlaceOrderResult> => {
    const user = await requireShopper();

    const { paymentMethod, ...address } = input;
    const payment = getPaymentPlugin();

    if (payment.availableMethods().length > 0 && !paymentMethod) {
      throw new ValidationError('Choose a payment method.');
    }

    const order = await placeOrder({ userId: user.id, shippingAddress: address });

    let redirectUrl: string | null = null;
    let paymentError: string | null = null;

    try {
      const intent = await payment.createIntent({
        orderReference: order.orderNumber,
        amountCents: order.totalCents,
        currency: STORE_CURRENCY,
        customerEmail: user.email,
        customerName: address.fullName,
        customerPhone: address.phone,
        method: paymentMethod,
        returnUrl: `${clientEnv.NEXT_PUBLIC_SITE_URL}${ROUTES.order(order.id)}`,
      });

      await attachPaymentReference(order.id, {
        provider: intent.providerId,
        method: paymentMethod,
        reference: intent.reference,
      });

      redirectUrl = intent.requiresAction ? intent.redirectUrl : null;
    } catch (error) {
      console.error('[checkout] Payment setup failed for order', order.orderNumber, error);
      paymentError = isAppError(error)
        ? error.message
        : 'We could not start the payment. Your order was saved as unpaid.';
    }

    revalidatePath(ROUTES.orders);
    revalidatePath(ROUTES.cart);
    revalidatePath('/', 'layout');

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      redirectUrl,
      paymentError,
    };
  },
);
