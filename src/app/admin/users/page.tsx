import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/constants/routes';
import { parseAdminListQuery, type AdminListParams } from '@/features/admin-table/model/query';
import { AdminPagination } from '@/features/admin-table/ui/admin-pagination';
import { AdminSearch } from '@/features/admin-table/ui/admin-search';
import { UserAvatar } from '@/entities/user/ui/user-avatar';
import { USER_ROLES, getUserInitials } from '@/entities/user/model/types';
import type { UserRoleValue } from '@/entities/user/model/types';
import { UserActiveToggle } from '@/features/admin-users/ui/user-active-toggle';
import { UserRoleSelect } from '@/features/admin-users/ui/user-role-select';
import { requireAdmin } from '@/lib/auth/session';
import { listUsers } from '@/services/userService';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Users · Admin',
};

export const dynamic = 'force-dynamic';

interface AdminUsersPageProps {
  readonly searchParams: Promise<AdminListParams & { role?: string }>;
}

function parseRole(value: string | undefined): UserRoleValue | null {
  return value && (USER_ROLES as readonly string[]).includes(value)
    ? (value as UserRoleValue)
    : null;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const listQuery = parseAdminListQuery(params);

  const result = await listUsers({ ...listQuery, role: parseRole(params.role) });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-[22px] font-extrabold">Users</h1>
        <p className="text-ink-55 text-sm">
          {result.total} registered {result.total === 1 ? 'account' : 'accounts'}.
        </p>
      </header>

      <AdminSearch
        basePath={ROUTES.admin.users}
        params={params}
        placeholder="Search by name or email…"
        label="Search users"
      />

      {result.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users yet"
          description="Accounts appear here once someone signs up."
        />
      ) : (
        <div className="border-line border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>
                  <span className="sr-only">Account</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar src={user.avatarUrl} initials={getUserInitials(user)} size={32} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {user.name ?? '—'}
                          {user.id === admin.id ? (
                            <span className="text-muted-foreground font-normal"> (you)</span>
                          ) : null}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                        {!user.isActive ? (
                          <Badge variant="secondary" className="mt-1">
                            Disabled
                          </Badge>
                        ) : null}
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
                  <TableCell className="text-right">
                    <UserActiveToggle
                      userId={user.id}
                      userEmail={user.email}
                      isActive={user.isActive}
                      isSelf={user.id === admin.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminPagination
        basePath={ROUTES.admin.users}
        params={params}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        totalPages={result.totalPages}
        noun="users"
      />
    </div>
  );
}
