import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ADMIN_ROWS_PER_PAGE } from '@/constants/catalog';
import { ROUTES } from '@/constants/routes';
import { USER_ROLES, getUserInitials } from '@/entities/user/model/types';
import type { UserRoleValue } from '@/entities/user/model/types';
import { UserRoleSelect } from '@/features/admin-users/ui/user-role-select';
import { requireAdmin } from '@/lib/auth/session';
import { listUsers } from '@/services/userService';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Users · Admin',
};

export const dynamic = 'force-dynamic';

interface AdminUsersPageProps {
  readonly searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}

function parseRole(value: string | undefined): UserRoleValue | null {
  return value && (USER_ROLES as readonly string[]).includes(value)
    ? (value as UserRoleValue)
    : null;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  // The layout already gates on role; calling it again here returns the
  // current admin so their own row can be marked non-editable.
  const admin = await requireAdmin();
  const params = await searchParams;
  const parsedPage = Number(params.page);

  const result = await listUsers({
    search: params.q?.trim() || null,
    role: parseRole(params.role),
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    pageSize: ADMIN_ROWS_PER_PAGE,
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">
          {result.total} registered {result.total === 1 ? 'account' : 'accounts'}.
        </p>
      </header>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users yet"
          description="Accounts appear here once someone signs up."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt=""
                          width={32}
                          height={32}
                          className="size-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="bg-secondary text-secondary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                          {getUserInitials(user)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {user.name ?? '—'}
                          {user.id === admin.id ? (
                            <span className="text-muted-foreground font-normal"> (you)</span>
                          ) : null}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{user.orderCount}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(user.totalSpentCents)}
                  </TableCell>
                  <TableCell>
                    <UserRoleSelect
                      userId={user.id}
                      userEmail={user.email}
                      role={user.role}
                      isSelf={user.id === admin.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {result.totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`${ROUTES.admin.users}?page=${result.page - 1}`}>Previous</Link>
            </Button>
          ) : null}
          <span className="text-muted-foreground text-sm">
            Page {result.page} of {result.totalPages}
          </span>
          {result.page < result.totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`${ROUTES.admin.users}?page=${result.page + 1}`}>Next</Link>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
