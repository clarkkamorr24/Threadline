'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const NOTIFICATION_EVENT = 'notification';

export function useNotificationStream(userId: string): void {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`notifications:${userId}`);

    channel
      .on('broadcast', { event: NOTIFICATION_EVENT }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, userId]);
}
