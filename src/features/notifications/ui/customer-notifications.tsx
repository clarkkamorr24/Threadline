'use client';

import { ROUTES } from '@/constants/routes';
import type { NotificationFeed } from '@/entities/notification/model/types';
import { NotificationBell } from '@/entities/notification/ui/notification-bell';
import { dismissMyNotificationAction, markMyNotificationsReadAction } from '../api/actions';

export function CustomerNotifications({
  feed,
  userId,
}: {
  readonly feed: NotificationFeed;
  readonly userId: string;
}) {
  return (
    <NotificationBell
      feed={feed}
      userId={userId}
      seeAllHref={ROUTES.notifications}
      dismissAction={dismissMyNotificationAction}
      markAllReadAction={markMyNotificationsReadAction}
      emptyMessage="No updates yet. We will tell you when your orders move."
      triggerClassName="hover:text-brand"
    />
  );
}
