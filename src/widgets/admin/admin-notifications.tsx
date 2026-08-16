'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Bell, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/constants/routes';
import { LOW_STOCK_THRESHOLD } from '@/constants/store';
import {
  dismissNotificationAction,
  markAllNotificationsReadAction,
} from '@/features/admin-notifications/api/actions';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { AdminNotificationFeed } from '@/services/adminNotificationService';

export function AdminNotifications({ feed }: { readonly feed: AdminNotificationFeed }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const badge = feed.unreadCount > 99 ? '99+' : String(feed.unreadCount);

  function dismiss(key: string): void {
    startTransition(async () => {
      const result = await dismissNotificationAction({ key });

      if (!result.success) {
        toast.error('Could not remove notification', result.error.message);
        return;
      }

      router.refresh();
    });
  }

  function markAllRead(): void {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction({});

      if (!result.success) {
        toast.error('Could not update notifications', result.error.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={
          feed.unreadCount > 0
            ? `Notifications, ${feed.unreadCount} unread`
            : 'Notifications, none unread'
        }
        className="border-line-strong hover:border-foreground relative grid size-9 place-items-center border transition-colors"
      >
        <Bell aria-hidden="true" className="size-4.5" strokeWidth={1.6} />
        {feed.unreadCount > 0 ? (
          <span
            aria-hidden="true"
            style={{ borderRadius: '9999px' }}
            className="bg-brand absolute -top-2 -right-2 grid h-4.5 min-w-4.5 place-items-center px-1 text-[10px] leading-none font-bold text-white tabular-nums"
          >
            {badge}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-88 p-0">
        <div className="border-line-strong flex items-center justify-between gap-3 border-b-2 px-4 py-3">
          <span className="font-display text-sm font-extrabold">Notifications</span>
          {feed.unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              disabled={isPending}
              className="text-brand font-mono text-[11px] tracking-[0.06em] uppercase hover:underline disabled:opacity-50"
            >
              Mark all as read
            </button>
          ) : (
            <span className="text-ink-55 font-mono text-[11px]">{feed.total} total</span>
          )}
        </div>

        {feed.items.length === 0 ? (
          <p className="text-ink-55 px-4 py-8 text-center text-[13px]">
            Nothing needs restocking. Every variant is above {LOW_STOCK_THRESHOLD} units.
          </p>
        ) : (
          <ul className="max-h-88 overflow-y-auto overscroll-contain">
            {feed.items.map((item) => {
              const isOut = item.severity === 'out';

              return (
                <li
                  key={item.key}
                  className={cn(
                    'border-line relative border-b last:border-b-0',
                    !item.isRead && 'bg-brand/4',
                  )}
                >
                  <Link
                    href={ROUTES.admin.editProduct(item.productId)}
                    onClick={() => setOpen(false)}
                    className="hover:bg-secondary/50 flex items-start gap-3 py-3 pr-10 pl-4 transition-colors"
                  >
                    <span
                      aria-hidden="true"
                      style={{ borderRadius: '9999px' }}
                      className={cn(
                        'mt-1.5 size-2 shrink-0',
                        isOut ? 'bg-status-cancelled' : 'bg-status-processing',
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-[13px]',
                          item.isRead ? 'font-medium' : 'font-semibold',
                        )}
                      >
                        {item.productName}
                      </span>
                      <span className="text-ink-55 mt-0.5 block font-mono text-[11px]">
                        {item.color} · {item.size} · {item.sku}
                      </span>
                      <span
                        className={cn(
                          'mt-1 block text-[11px] font-medium',
                          isOut ? 'text-status-cancelled' : 'text-status-processing',
                        )}
                      >
                        {isOut ? 'Out of stock' : `${item.stock} left — restock soon`}
                      </span>
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => dismiss(item.key)}
                    disabled={isPending}
                    aria-label={`Remove notification for ${item.productName} ${item.color} ${item.size}`}
                    className="text-ink-55 hover:bg-secondary hover:text-foreground absolute top-2.5 right-2 grid size-6 place-items-center transition-colors disabled:opacity-50"
                  >
                    <X aria-hidden="true" className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-line border-t px-4 py-2.5">
          <Link
            href={ROUTES.admin.notifications}
            onClick={() => setOpen(false)}
            className="text-brand text-[13px] font-semibold hover:underline"
          >
            See all notifications →
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
