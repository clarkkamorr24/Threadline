import type { Metadata } from 'next';
import { BellOff } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import {
  dismissNotificationAction,
  markAllNotificationsReadAction,
} from '@/features/admin-notifications/api/actions';
import { NotificationPageList } from '@/entities/notification/ui/notification-page-list';
import { requireAdmin } from '@/lib/auth/session';
import { getAdminNotifications } from '@/services/adminNotificationService';

export const metadata: Metadata = {
  title: 'Notifications · Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const admin = await requireAdmin();
  const feed = await getAdminNotifications(admin.id);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-[22px] font-extrabold">Notifications</h1>
        <p className="text-ink-55 text-sm">
          {feed.total === 0
            ? 'Nothing needs your attention.'
            : `${feed.total} notification${feed.total === 1 ? '' : 's'} · ${feed.unreadCount} unread`}
        </p>
      </header>

      {feed.items.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="You are all caught up"
          description="New orders and low stock alerts will appear here."
        />
      ) : (
        <NotificationPageList
          feed={feed}
          dismissAction={dismissNotificationAction}
          markAllReadAction={markAllNotificationsReadAction}
        />
      )}
    </div>
  );
}
