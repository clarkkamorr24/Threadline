'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ROUTES } from '@/constants/routes';
import { ORDER_STATUSES } from '@/entities/order/model/types';
import { requireAdmin } from '@/lib/auth/session';
import { createAction } from '@/lib/serverAction';
import { updateOrderStatus } from '@/services/orderService';

const updateStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(ORDER_STATUSES),
});

export const updateOrderStatusAction = createAction(
  'admin.order.updateStatus',
  updateStatusSchema,
  async (input): Promise<{ status: string }> => {
    await requireAdmin();

    const order = await updateOrderStatus(input.orderId, input.status);

    revalidatePath(ROUTES.admin.orders);
    revalidatePath(ROUTES.admin.order(input.orderId));
    // The customer's own order views must reflect the change too.
    revalidatePath(ROUTES.orders);

    return { status: order.status };
  },
);
