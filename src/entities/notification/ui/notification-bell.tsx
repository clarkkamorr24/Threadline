'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NotificationFeed } from '@/entities/notification/model/types';
import { useNotificationStream } from '@/entities/notification/model/useNotificationStream';
import { NotificationList } from '@/entities/notification/ui/notification-list';
import { useToast } from '@/hooks/useToast';
import type { ActionResult } from '@/types/actionResult';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  readonly feed: NotificationFeed;
  readonly userId: string;
  readonly seeAllHref: string;
  readonly dismissAction: (input: { key: string }) => Promise<ActionResult<unknown>>;
  readonly markAllReadAction: (input: Record<string, never>) => Promise<ActionResult<unknown>>;
  readonly emptyMessage: string;
  readonly triggerClassName?: string;
}

export function NotificationBell({
  feed,
  userId,
  seeAllHref,
  dismissAction,
  markAllReadAction,
  emptyMessage,
  triggerClassName,
}: NotificationBellProps) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useNotificationStream(userId);

  function run(work: () => Promise<ActionResult<unknown>>): void {
    startTransition(async () => {
      const result = await work();

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
        className={cn('relative grid size-9 place-items-center border-none', triggerClassName)}
      >
        <Bell aria-hidden="true" className="size-4.5" strokeWidth={1.6} />
        {feed.unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="bg-brand absolute top-1 right-0.5 grid min-w-3.75 place-items-center rounded-full px-0.75 text-[9px] leading-3.75 font-extrabold text-white"
          >
            {feed.unreadCount > 99 ? '99+' : feed.unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-88 p-0">
        <div className="border-line-strong flex items-center justify-between gap-3 border-b-2 px-4 py-3">
          <span className="font-display text-sm font-extrabold">Notifications</span>
          {feed.unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => run(() => markAllReadAction({}))}
              disabled={isPending}
              className="text-brand font-mono text-[11px] tracking-[0.06em] uppercase hover:underline disabled:opacity-50"
            >
              Mark all as read
            </button>
          ) : null }
        </div>

        {feed.items.length === 0 ? (
          <p className="text-ink-55 px-4 py-8 text-center text-[13px]">{emptyMessage}</p>
        ) : (
          <NotificationList
            items={feed.items}
            compact
            disabled={isPending}
            onNavigate={() => setOpen(false)}
            onDismiss={(key) => run(() => dismissAction({ key }))}
          />
        )}

        <div className="border-line border-t px-4 py-2.5">
          <Link
            href={seeAllHref}
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
