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
import { ADMIN_ROWS_PER_PAGE } from '@/constants/catalog';
import { ROUTES } from '@/constants/routes';
import { ORDER_STATUSES } from '@/entities/order/model/types';
import type { OrderStatusValue } from '@/entities/order/model/types';
import { OrderStatusSelect } from '@/features/admin-orders/ui/order-status-select';
import { listAllOrders } from '@/services/orderService';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Orders · Admin',
};

export const dynamic = 'force-dynamic';

interface AdminOrdersPageProps {
  readonly searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

function parseStatus(value: string | undefined): OrderStatusValue | null {
  return value && (ORDER_STATUSES as readonly string[]).includes(value)
    ? (value as OrderStatusValue)
    : null;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const parsedPage = Number(params.page);
  const activeStatus = parseStatus(params.status);

  const result = await listAllOrders({
    search: params.q?.trim() || null,
    status: activeStatus,
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    pageSize: ADMIN_ROWS_PER_PAGE,
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-muted-foreground text-sm">
          {result.total} order{result.total === 1 ? '' : 's'}.
        </p>
      </header>

      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        <Button asChild variant={activeStatus === null ? 'default' : 'outline'} size="sm">
          <Link href={ROUTES.admin.orders}>All</Link>
        </Button>
        {ORDER_STATUSES.map((status) => (
          <Button
            key={status}
            asChild
            variant={activeStatus === status ? 'default' : 'outline'}
            size="sm"
          >
            <Link href={`${ROUTES.admin.orders}?status=${status}`}>
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
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
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
                    <p className="text-muted-foreground truncate text-xs">
                      {order.customerEmail}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.placedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{order.itemCount}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(order.totalCents)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusSelect
                      orderId={order.id}
                      orderNumber={order.orderNumber}
                      status={order.status}
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
              <Link href={`${ROUTES.admin.orders}?page=${result.page - 1}`}>Previous</Link>
            </Button>
          ) : null}
          <span className="text-muted-foreground text-sm">
            Page {result.page} of {result.totalPages}
          </span>
          {result.page < result.totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`${ROUTES.admin.orders}?page=${result.page + 1}`}>Next</Link>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
