'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ROUTES } from '@/constants/routes';
import { requireAdmin } from '@/lib/auth/session';
import { createAction } from '@/lib/serverAction';
import { dismissNotification, markAllNotificationsRead } from '@/services/adminNotificationService';

function revalidateAdmin(): void {
  revalidatePath(ROUTES.admin.notifications);
  revalidatePath(ROUTES.admin.root, 'layout');
}

export const dismissNotificationAction = createAction(
  'adminNotifications.dismiss',
  z.object({ key: z.string().trim().min(1).max(200) }),
  async (input): Promise<{ dismissed: true }> => {
    const admin = await requireAdmin();

    await dismissNotification(admin.id, input.key);
    revalidateAdmin();

    return { dismissed: true };
  },
);

export const markAllNotificationsReadAction = createAction(
  'adminNotifications.markAllRead',
  z.object({}),
  async (): Promise<{ marked: number }> => {
    const admin = await requireAdmin();

    const marked = await markAllNotificationsRead(admin.id);
    revalidateAdmin();

    return { marked };
  },
);
