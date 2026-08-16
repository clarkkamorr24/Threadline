'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import type { NotificationFeed } from '@/entities/notification/model/types';
import { NotificationList } from '@/entities/notification/ui/notification-list';
import { useToast } from '@/hooks/useToast';
import type { ActionResult } from '@/types/actionResult';

interface NotificationPageListProps {
  readonly feed: NotificationFeed;
  readonly dismissAction: (input: { key: string }) => Promise<ActionResult<unknown>>;
  readonly markAllReadAction: (input: Record<string, never>) => Promise<ActionResult<unknown>>;
}

export function NotificationPageList({
  feed,
  dismissAction,
  markAllReadAction,
}: NotificationPageListProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

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
    <div className="flex flex-col gap-4">
      {feed.unreadCount > 0 ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => run(() => markAllReadAction({}))}
          >
            Mark all as read
          </Button>
        </div>
      ) : null}

      <div className="border-line border">
        <NotificationList
          items={feed.items}
          disabled={isPending}
          onDismiss={(key) => run(() => dismissAction({ key }))}
        />
      </div>
    </div>
  );
}
