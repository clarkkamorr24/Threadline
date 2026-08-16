import 'server-only';
import { LOW_STOCK_THRESHOLD } from '@/constants/store';
import { db } from '@/lib/db';

export type NotificationSeverity = 'out' | 'low';

export interface AdminNotification {
  readonly key: string;
  readonly severity: NotificationSeverity;
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly size: string;
  readonly color: string;
  readonly stock: number;
  readonly isRead: boolean;
}

export interface AdminNotificationFeed {
  readonly items: readonly AdminNotification[];
  readonly unreadCount: number;
  readonly total: number;
}

function alertKey(variantId: string, severity: NotificationSeverity): string {
  return `stock:${variantId}:${severity}`;
}

export async function getAdminNotifications(
  userId: string,
  limit?: number,
): Promise<AdminNotificationFeed> {
  const [variants, states] = await Promise.all([
    db.productVariant.findMany({
      where: {
        product: { status: { not: 'ARCHIVED' } },
        stock: { lte: LOW_STOCK_THRESHOLD },
      },
      select: {
        id: true,
        productId: true,
        sku: true,
        size: true,
        color: true,
        stock: true,
        product: { select: { name: true } },
      },
      orderBy: [{ stock: 'asc' }, { sku: 'asc' }],
    }),
    db.adminNotificationState.findMany({
      where: { userId },
      select: { key: true, readAt: true, dismissedAt: true },
    }),
  ]);

  const byKey = new Map(states.map((state) => [state.key, state]));

  const items = variants.flatMap((variant) => {
    const severity: NotificationSeverity = variant.stock === 0 ? 'out' : 'low';
    const key = alertKey(variant.id, severity);
    const state = byKey.get(key);

    if (state?.dismissedAt) {
      return [];
    }

    return [
      {
        key,
        severity,
        productId: variant.productId,
        productName: variant.product.name,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
        isRead: state?.readAt != null,
      },
    ];
  });

  return {
    items: limit === undefined ? items : items.slice(0, limit),
    unreadCount: items.filter((item) => !item.isRead).length,
    total: items.length,
  };
}

export async function dismissNotification(userId: string, key: string): Promise<void> {
  const now = new Date();

  await db.adminNotificationState.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, dismissedAt: now, readAt: now },
    update: { dismissedAt: now, readAt: now },
  });
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const { items } = await getAdminNotifications(userId);
  const unread = items.filter((item) => !item.isRead);

  if (unread.length === 0) {
    return 0;
  }

  const now = new Date();

  await db.$transaction(
    unread.map((item) =>
      db.adminNotificationState.upsert({
        where: { userId_key: { userId, key: item.key } },
        create: { userId, key: item.key, readAt: now },
        update: { readAt: now },
      }),
    ),
  );

  return unread.length;
}
