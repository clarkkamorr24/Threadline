import 'server-only';
import { clientEnv } from '@/config/env';

export const NOTIFICATION_EVENT = 'notification';

export function notificationTopic(userId: string): string {
  return `notifications:${userId}`;
}

export async function broadcastNotification(userIds: readonly string[]): Promise<void> {
  const unique = [...new Set(userIds)];

  if (unique.length === 0) {
    return;
  }

  const url = `${clientEnv.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`;
  const key = clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        messages: unique.map((userId) => ({
          topic: notificationTopic(userId),
          event: NOTIFICATION_EVENT,
          payload: {},
        })),
      }),
    });

    if (!response.ok) {
      console.warn(
        '[realtime] Broadcast rejected:',
        response.status,
        await response.text().catch(() => ''),
      );
    }
  } catch (error) {
    console.warn('[realtime] Broadcast failed:', error);
  }
}
