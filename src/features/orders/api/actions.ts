'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { clientEnv } from '@/config/env';
import { ROUTES } from '@/constants/routes';
import { requireShopper } from '@/lib/auth/session';
import { createAction } from '@/lib/serverAction';
import { cancelOrderByCustomer, resumeOrderPayment } from '@/services/orderService';
import type { CancelOrderOutcome } from '@/services/orderService';

const orderSchema = z.object({ orderId: z.string().trim().min(1).max(60) });

export const resumePaymentAction = createAction(
  'orders.resumePayment',
  orderSchema,
  async (input): Promise<{ redirectUrl: string | null }> => {
    const user = await requireShopper();

    const redirectUrl = await resumeOrderPayment(
      user.id,
      input.orderId,
      `${clientEnv.NEXT_PUBLIC_SITE_URL}${ROUTES.orderConfirmation(input.orderId)}`,
    );

    return { redirectUrl };
  },
);

export const cancelOrderAction = createAction(
  'orders.cancel',
  orderSchema,
  async (input): Promise<{ outcome: CancelOrderOutcome }> => {
    const user = await requireShopper();

    const outcome = await cancelOrderByCustomer(user.id, input.orderId);

    if (outcome === 'cancelled') {
      revalidatePath(ROUTES.orders);
      revalidatePath(ROUTES.order(input.orderId));
      revalidatePath('/', 'layout');
    }

    return { outcome };
  },
);
