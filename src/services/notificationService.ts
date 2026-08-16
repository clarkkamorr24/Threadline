import 'server-only';
import { ROUTES } from '@/constants/routes';
import type { FeedItem, FeedTone } from '@/entities/notification/model/types';
import type { OrderStatusValue } from '@/entities/order/model/types';
import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/lib/db';
import { broadcastNotification } from '@/lib/realtime/broadcast';
import { formatDateTime } from '@/utils/datetime';

export const NOTIFICATION_KEY_PREFIX = 'note:';

const STATUS_TONE: Readonly<Record<string, FeedTone>> = {
  PENDING: 'info',
  PROCESSING: 'info',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'critical',
};

const STATUS_COPY: Readonly<Record<string, string>> = {
  PENDING: 'is awaiting payment',
  PROCESSING: 'is being prepared',
  SHIPPED: 'is on its way',
  DELIVERED: 'has been delivered',
  CANCELLED: 'was cancelled',
};

const notificationSelect = {
  id: true,
  type: true,
  orderId: true,
  orderNumber: true,
  status: true,
  customerName: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

type NotificationRow = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;

function toFeedItem(row: NotificationRow, forAdmin: boolean): FeedItem {
  const timestamp = formatDateTime(row.createdAt.toISOString());

  const href = row.orderId
    ? forAdmin
      ? ROUTES.admin.order(row.orderId)
      : ROUTES.order(row.orderId)
    : forAdmin
      ? ROUTES.admin.orders
      : ROUTES.orders;

  if (row.type === 'ORDER_PLACED') {
    return {
      key: `${NOTIFICATION_KEY_PREFIX}${row.id}`,
      title: `New order #${row.orderNumber}`,
      detail: row.customerName ?? 'Threadline customer',
      meta: timestamp,
      href,
      tone: 'info',
      isRead: row.readAt !== null,
      sortAt: row.createdAt.getTime(),
    };
  }

  const status = row.status ?? 'PENDING';

  return {
    key: `${NOTIFICATION_KEY_PREFIX}${row.id}`,
    title: `Order #${row.orderNumber} ${STATUS_COPY[status] ?? 'was updated'}`,
    detail: status.charAt(0) + status.slice(1).toLowerCase(),
    meta: timestamp,
    href,
    tone: STATUS_TONE[status] ?? 'info',
    isRead: row.readAt !== null,
    sortAt: row.createdAt.getTime(),
  };
}

export async function listStoredNotifications(
  userId: string,
  forAdmin: boolean,
): Promise<readonly FeedItem[]> {
  const rows = await db.notification.findMany({
    where: { userId, dismissedAt: null },
    select: notificationSelect,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return rows.map((row) => toFeedItem(row, forAdmin));
}

export async function notifyOrderPlaced(
  orderId: string,
  orderNumber: string,
  customerName: string | null,
): Promise<void> {
  const admins = await db.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  });

  if (admins.length === 0) {
    return;
  }

  await db.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: 'ORDER_PLACED' as const,
      orderId,
      orderNumber,
      customerName,
    })),
  });

  await broadcastNotification(admins.map((admin) => admin.id));
}

export async function notifyOrderStatusChanged(
  userId: string,
  orderId: string,
  orderNumber: string,
  status: OrderStatusValue,
): Promise<void> {
  await db.notification.create({
    data: {
      userId,
      type: 'ORDER_STATUS',
      orderId,
      orderNumber,
      status,
    },
  });

  await broadcastNotification([userId]);
}

export function isStoredNotificationKey(key: string): boolean {
  return key.startsWith(NOTIFICATION_KEY_PREFIX);
}

function notificationIdFromKey(key: string): string {
  return key.slice(NOTIFICATION_KEY_PREFIX.length);
}

export async function dismissStoredNotification(userId: string, key: string): Promise<void> {
  const now = new Date();

  await db.notification.updateMany({
    where: { id: notificationIdFromKey(key), userId },
    data: { dismissedAt: now, readAt: now },
  });
}

export async function markStoredNotificationsRead(userId: string): Promise<number> {
  const result = await db.notification.updateMany({
    where: { userId, dismissedAt: null, readAt: null },
    data: { readAt: new Date() },
  });

  return result.count;
}
