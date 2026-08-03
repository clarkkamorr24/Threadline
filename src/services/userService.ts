import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import type { AdminUserRow, UserRoleValue } from '@/entities/user/model/types';
import type { Paginated } from '@/entities/product/model/types';
import { db } from '@/lib/db';
import { NotFoundError, ValidationError } from '@/lib/errors';

export interface AdminUserQuery {
  readonly search: string | null;
  readonly role: UserRoleValue | null;
  readonly page: number;
  readonly pageSize: number;
}

function buildUserWhere(query: AdminUserQuery): Prisma.UserWhereInput {
  const conditions: Prisma.UserWhereInput[] = [];

  if (query.search) {
    conditions.push({
      OR: [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }

  if (query.role) {
    conditions.push({ role: query.role });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

const adminUserSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
  _count: { select: { orders: true } },
  orders: {
    where: { status: { in: ['PAID', 'FULFILLED'] } },
    select: { totalCents: true },
  },
} satisfies Prisma.UserSelect;

type AdminUserSelection = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;

function toAdminUserRow(row: AdminUserSelection): AdminUserRow {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatarUrl,
    role: row.role as UserRoleValue,
    orderCount: row._count.orders,
    totalSpentCents: row.orders.reduce((sum, order) => sum + order.totalCents, 0),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listUsers(query: AdminUserQuery): Promise<Paginated<AdminUserRow>> {
  const where = buildUserWhere(query);

  const [rows, total] = await db.$transaction([
    db.user.findMany({
      where,
      select: adminUserSelect,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.user.count({ where }),
  ]);

  return {
    items: rows.map(toAdminUserRow),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export interface UserStats {
  readonly totalUsers: number;
  readonly adminCount: number;
  readonly newThisMonth: number;
}

export async function getUserStats(): Promise<UserStats> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [totalUsers, adminCount, newThisMonth] = await db.$transaction([
    db.user.count(),
    db.user.count({ where: { role: 'ADMIN' } }),
    db.user.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);

  return { totalUsers, adminCount, newThisMonth };
}

export async function updateUserRole(
  userId: string,
  role: UserRoleValue,
): Promise<AdminUserRow> {
  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!target) {
    throw new NotFoundError('User');
  }

  if (target.role === 'ADMIN' && role !== 'ADMIN') {
    const adminCount = await db.user.count({ where: { role: 'ADMIN' } });

    if (adminCount <= 1) {
      throw new ValidationError('You cannot remove the last administrator.');
    }
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      _count: { select: { orders: true } },
      orders: {
        where: { status: { in: ['PAID', 'FULFILLED'] } },
        select: { totalCents: true },
      },
    },
  });

  return toAdminUserRow(updated);
}
