'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { dismissNotificationAction, markAllNotificationsReadAction } from '../api/actions';

interface NotificationActionsProps {
  readonly notificationKey?: string;
  readonly hasUnread?: boolean;
}

export function NotificationActions({ notificationKey, hasUnread }: NotificationActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function run(work: () => Promise<{ success: boolean; error?: { message: string } }>): void {
    startTransition(async () => {
      const result = await work();

      if (!result.success) {
        toast.error('Could not update notifications', result.error?.message ?? '');
        return;
      }

      router.refresh();
    });
  }

  if (notificationKey) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => run(() => dismissNotificationAction({ key: notificationKey }))}
      >
        Remove
      </Button>
    );
  }

  if (!hasUnread) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => run(() => markAllNotificationsReadAction({}))}
    >
      Mark all as read
    </Button>
  );
}
