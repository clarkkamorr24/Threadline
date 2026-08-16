import Link from 'next/link';
import type { Metadata } from 'next';
import { ShoppingCart } from 'lucide-react';
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
import { ROUTES } from '@/constants/routes';
import {
  buildAdminListHref,
  parseAdminListQuery,
  type AdminListParams,
} from '@/features/admin-table/model/query';
import { AdminPagination } from '@/features/admin-table/ui/admin-pagination';
import { AdminSearch } from '@/features/admin-table/ui/admin-search';
import { ORDER_STATUSES } from '@/entities/order/model/types';
import type { OrderStatusValue } from '@/entities/order/model/types';
import { PaymentMark } from '@/entities/order/ui/payment-mark';
import { OrderStatusSelect } from '@/features/admin-orders/ui/order-status-select';
import { listAllOrders } from '@/services/orderService';
import { formatShortDateTime } from '@/utils/datetime';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Orders · Admin',
};

export const dynamic = 'force-dynamic';

interface AdminOrdersPageProps {
  readonly searchParams: Promise<AdminListParams & { status?: string }>;
}

function parseStatus(value: string | undefined): OrderStatusValue | null {
  const upper = value?.trim().toUpperCase();

  return upper && (ORDER_STATUSES as readonly string[]).includes(upper)
    ? (upper as OrderStatusValue)
    : null;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const listQuery = parseAdminListQuery(params);
  const activeStatus = parseStatus(params.status);

  const result = await listAllOrders({ ...listQuery, status: activeStatus });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-[22px] font-extrabold">Orders</h1>
        <p className="text-ink-55 text-sm">
          {result.total} order{result.total === 1 ? '' : 's'}.
        </p>
      </header>

      <AdminSearch
        basePath={ROUTES.admin.orders}
        params={params}
        placeholder="Search orders…"
        label="Search orders"
      />

      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        <Button asChild variant={activeStatus === null ? 'default' : 'outline'} size="sm">
          <Link
            href={buildAdminListHref(ROUTES.admin.orders, params, { status: null, page: null })}
          >
            All
          </Link>
        </Button>
        {ORDER_STATUSES.map((status) => (
          <Button
            key={status}
            asChild
            variant={activeStatus === status ? 'default' : 'outline'}
            size="sm"
          >
            <Link
              href={buildAdminListHref(ROUTES.admin.orders, params, {
                status: status.toLowerCase(),
                page: null,
              })}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </Link>
          </Button>
        ))}
      </nav>

      {result.items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders"
          description={
            activeStatus
              ? 'No orders currently have that status.'
              : 'Orders will appear here once customers start checking out.'
          }
        />
      ) : (
        <div className="border-line border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={ROUTES.admin.order(order.id)}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="min-w-0">
                    <p className="truncate text-sm">{order.customerName ?? '—'}</p>
                    <p className="text-muted-foreground truncate text-xs">{order.customerEmail}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatShortDateTime(order.placedAt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{order.itemCount}</TableCell>
                  <TableCell>
                    <PaymentMark
                      method={order.paymentMethod}
                      provider={order.paymentProvider}
                      height={16}
                      hideLabel
                    />
                  </TableCell>
                  <TableCell>
                    <OrderStatusSelect
                      orderId={order.id}
                      orderNumber={order.orderNumber}
                      status={order.status}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(order.totalCents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminPagination
        basePath={ROUTES.admin.orders}
        params={params}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        totalPages={result.totalPages}
        noun="orders"
      />
    </div>
  );
}
