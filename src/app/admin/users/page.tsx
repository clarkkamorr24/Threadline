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
import { getUserInitials } from '@/entities/user/model/types';
import { UserActiveToggle } from '@/features/admin-users/ui/user-active-toggle';
import { requireAdmin } from '@/lib/auth/session';
import { listUsers } from '@/services/userService';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Users · Admin',
};

export const dynamic = 'force-dynamic';

interface AdminUsersPageProps {
  readonly searchParams: Promise<AdminListParams>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  await requireAdmin();
  const params = await searchParams;

  const result = await listUsers(parseAdminListQuery(params));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-[22px] font-extrabold">Users</h1>
        <p className="text-ink-55 text-sm">
          {result.total} customer {result.total === 1 ? 'account' : 'accounts'}.
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
          title="No customers yet"
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
                <TableHead>Status</TableHead>
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
                        <p className="truncate font-medium">{user.name ?? '—'}</p>
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
                    <Badge variant={user.isActive ? 'success' : 'destructive'}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActiveToggle
                      userId={user.id}
                      userEmail={user.email}
                      userName={user.name}
                      isActive={user.isActive}
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
