import Link from 'next/link';
import type { Metadata } from 'next';
import { BellOff } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ROUTES } from '@/constants/routes';
import { LOW_STOCK_THRESHOLD } from '@/constants/store';
import { NotificationActions } from '@/features/admin-notifications/ui/notification-actions';
import { requireAdmin } from '@/lib/auth/session';
import { getAdminNotifications } from '@/services/adminNotificationService';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Notifications · Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const admin = await requireAdmin();
  const feed = await getAdminNotifications(admin.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-extrabold">Notifications</h1>
          <p className="text-ink-55 text-sm">
            {feed.total === 0
              ? 'Nothing needs your attention.'
              : `${feed.total} item${feed.total === 1 ? '' : 's'} need attention · ${feed.unreadCount} unread`}
          </p>
        </div>

        <NotificationActions hasUnread={feed.unreadCount > 0} />
      </header>

      {feed.items.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="You are all caught up"
          description={`Every variant is above ${LOW_STOCK_THRESHOLD} units, so there is nothing to restock.`}
        />
      ) : (
        <ul className="border-line border">
          {feed.items.map((item) => {
            const isOut = item.severity === 'out';

            return (
              <li
                key={item.key}
                className={cn('border-line border-b last:border-b-0', !item.isRead && 'bg-brand/4')}
              >
                <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <span
                    aria-hidden="true"
                    style={{ borderRadius: '9999px' }}
                    className={cn(
                      'size-2.5 shrink-0',
                      isOut ? 'bg-status-cancelled' : 'bg-status-processing',
                    )}
                  />

                  <div className="min-w-0 flex-1">
                    <Link
                      href={ROUTES.admin.editProduct(item.productId)}
                      className={cn(
                        'block truncate hover:underline',
                        item.isRead ? 'font-medium' : 'font-semibold',
                      )}
                    >
                      {item.productName}
                    </Link>
                    <div className="text-ink-55 mt-1 font-mono text-[11px]">
                      {item.color} · {item.size} · {item.sku}
                    </div>
                  </div>

                  <span
                    className={cn(
                      'border px-2.5 py-1 text-xs whitespace-nowrap',
                      isOut
                        ? 'border-status-cancelled text-status-cancelled bg-status-cancelled/10'
                        : 'border-status-processing text-status-processing bg-status-processing/10',
                    )}
                  >
                    {isOut ? 'Out of stock' : `${item.stock} left`}
                  </span>

                  {!item.isRead ? (
                    <span className="bg-brand px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] text-white uppercase">
                      New
                    </span>
                  ) : null}

                  <NotificationActions notificationKey={item.key} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
