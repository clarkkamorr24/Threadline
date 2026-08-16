'use client';

import { ROUTES } from '@/constants/routes';
import type { NotificationFeed } from '@/entities/notification/model/types';
import { NotificationBell } from '@/entities/notification/ui/notification-bell';
import {
  dismissNotificationAction,
  markAllNotificationsReadAction,
} from '@/features/admin-notifications/api/actions';

export function AdminNotifications({
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
      seeAllHref={ROUTES.admin.notifications}
      dismissAction={dismissNotificationAction}
      markAllReadAction={markAllNotificationsReadAction}
      emptyMessage="Nothing needs your attention right now."
      triggerClassName="border-line-strong hover:border-foreground border"
    />
  );
}
