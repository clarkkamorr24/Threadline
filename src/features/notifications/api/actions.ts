'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ROUTES } from '@/constants/routes';
import { requireShopper } from '@/lib/auth/session';
import { createAction } from '@/lib/serverAction';
import {
  dismissStoredNotification,
  markStoredNotificationsRead,
} from '@/services/notificationService';

function revalidateShopper(): void {
  revalidatePath(ROUTES.notifications);
  revalidatePath('/', 'layout');
}

export const dismissMyNotificationAction = createAction(
  'notifications.dismiss',
  z.object({ key: z.string().trim().min(1).max(200) }),
  async (input): Promise<{ dismissed: true }> => {
    const user = await requireShopper();

    await dismissStoredNotification(user.id, input.key);
    revalidateShopper();

    return { dismissed: true };
  },
);

export const markMyNotificationsReadAction = createAction(
  'notifications.markAllRead',
  z.object({}),
  async (): Promise<{ marked: number }> => {
    const user = await requireShopper();

    const marked = await markStoredNotificationsRead(user.id);
    revalidateShopper();

    return { marked };
  },
);
