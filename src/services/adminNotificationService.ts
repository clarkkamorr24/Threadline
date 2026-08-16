import 'server-only';
import { ROUTES } from '@/constants/routes';
import { LOW_STOCK_THRESHOLD } from '@/constants/store';
import type { FeedItem, NotificationFeed } from '@/entities/notification/model/types';
import { db } from '@/lib/db';
import {
  dismissStoredNotification,
  isStoredNotificationKey,
  listStoredNotifications,
  markStoredNotificationsRead,
} from '@/services/notificationService';

export const STOCK_KEY_PREFIX = 'stock:';

async function listStockAlerts(userId: string): Promise<readonly FeedItem[]> {
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

  return variants.flatMap((variant) => {
    const isOut = variant.stock === 0;
    const key = `${STOCK_KEY_PREFIX}${variant.id}:${isOut ? 'out' : 'low'}`;
    const state = byKey.get(key);

    if (state?.dismissedAt) {
      return [];
    }

    return [
      {
        key,
        title: variant.product.name,
        detail: `${variant.color} · ${variant.size} · ${variant.sku}`,
        meta: isOut ? 'Out of stock' : `${variant.stock} left — restock soon`,
        href: ROUTES.admin.editProduct(variant.productId),
        tone: isOut ? ('critical' as const) : ('warning' as const),
        isRead: state?.readAt != null,
        sortAt: isOut ? 1 : 0,
      },
    ];
  });
}

export async function getAdminNotifications(
  userId: string,
  limit?: number,
): Promise<NotificationFeed> {
  const [stock, stored] = await Promise.all([
    listStockAlerts(userId),
    listStoredNotifications(userId, true),
  ]);

  const items = [...stored, ...stock].sort((a, b) => b.sortAt - a.sortAt);

  return {
    items: limit === undefined ? items : items.slice(0, limit),
    unreadCount: items.filter((item) => !item.isRead).length,
    total: items.length,
  };
}

export async function dismissAdminNotification(userId: string, key: string): Promise<void> {
  if (isStoredNotificationKey(key)) {
    await dismissStoredNotification(userId, key);
    return;
  }

  const now = new Date();

  await db.adminNotificationState.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, dismissedAt: now, readAt: now },
    update: { dismissedAt: now, readAt: now },
  });
}

export async function markAllAdminNotificationsRead(userId: string): Promise<number> {
  const stock = await listStockAlerts(userId);
  const unreadStock = stock.filter((item) => !item.isRead);
  const now = new Date();

  const [storedCount] = await Promise.all([
    markStoredNotificationsRead(userId),
    unreadStock.length === 0
      ? Promise.resolve(null)
      : db.$transaction(
          unreadStock.map((item) =>
            db.adminNotificationState.upsert({
              where: { userId_key: { userId, key: item.key } },
              create: { userId, key: item.key, readAt: now },
              update: { readAt: now },
            }),
          ),
        ),
  ]);

  return storedCount + unreadStock.length;
}
