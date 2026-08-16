import type { Metadata } from 'next';
import { BellOff } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ROUTES } from '@/constants/routes';
import { NotificationPageList } from '@/entities/notification/ui/notification-page-list';
import {
  dismissMyNotificationAction,
  markMyNotificationsReadAction,
} from '@/features/notifications/api/actions';
import { requireUserOrRedirect } from '@/lib/auth/session';
import { listStoredNotifications } from '@/services/notificationService';

export const metadata: Metadata = {
  title: 'Notifications',
};

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await requireUserOrRedirect(ROUTES.notifications);
  const items = await listStoredNotifications(user.id, false);

  const feed = {
    items,
    unreadCount: items.filter((item) => !item.isRead).length,
    total: items.length,
  };

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[22px] font-extrabold">Notifications</h2>
        {feed.total > 0 ? (
          <span className="text-ink-55 font-mono text-[11px]">{feed.unreadCount} unread</span>
        ) : null}
      </div>

      {feed.items.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No notifications yet"
          description="We will let you know here when an order is on the move."
        />
      ) : (
        <NotificationPageList
          feed={feed}
          dismissAction={dismissMyNotificationAction}
          markAllReadAction={markMyNotificationsReadAction}
        />
      )}
    </div>
  );
}
